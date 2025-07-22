import { NextRequest, NextResponse } from "next/server";
import cron, { ScheduledTask } from "node-cron";
import connectDB from "@/lib/db";
import Post from "@/models/Post";

const activeJobs = new Map<string, ScheduledTask>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action } = await request.json();

    if (action === "start") {
      await startScheduler();
      return NextResponse.json({
        success: true,
        message: "Scheduler started successfully",
      });
    } else if (action === "stop") {
      await stopScheduler();
      return NextResponse.json({
        success: true,
        message: "Scheduler stopped successfully",
      });
    } else if (action === "status") {
      return NextResponse.json({
        success: true,
        running: activeJobs.size > 0,
        activeJobs: activeJobs.size,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'start', 'stop', or 'status'" },
      { status: 400 }
    );
  } catch (error: unknown) {
    let errorMessage = "Scheduler operation failed";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingPosts = await Post.find({
      status: "queued",
      scheduledTime: {
        $gte: now,
        $lte: tomorrow,
      },
    })
      .populate("imageId", "url filename originalName")
      .sort({ scheduledTime: 1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      upcomingPosts: upcomingPosts,
      schedulerRunning: activeJobs.size > 0,
      nextPost: upcomingPosts[0] || null,
    });
  } catch (error: unknown) {
    let errorMessage = "Failed to get scheduler status";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function startScheduler() {
  await stopScheduler();

  const mainJob = cron.schedule(
    "* * * * *",
    async () => {
      try {
        await checkAndProcessPosts();
      } catch (error) {
        console.error("Scheduler error:", error);
      }
    },
    {
    }
  );

  activeJobs.set("main", mainJob);
  mainJob.start();

  console.log("Post scheduler started");
}

async function stopScheduler() {
  activeJobs.forEach((job) => {
    job.stop();
    job.destroy();
  });
  activeJobs.clear();
  console.log("Post scheduler stopped");
}

async function checkAndProcessPosts() {
  try {
    await connectDB();

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const postsToProcess = await Post.find({
      status: "queued",
      scheduledTime: {
        $gte: fiveMinutesAgo,
        $lte: now,
      },
    }).populate("imageId");

    console.log(`Found ${postsToProcess.length} posts to process`);

    for (const post of postsToProcess) {
      try {
        await processPost(post);
      } catch (error) {
        console.error(`Failed to process post ${post._id}:`, error);
        await Post.findByIdAndUpdate(post._id, {
          status: "failed",
          errorMessage: `Processing failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }
  } catch (error) {
    console.error("Check and process posts error:", error);
  }
}

interface SchedulerPost {
  _id: string;
  platform: string;
  scheduledTime?: Date;
  status?: string;
  imageId?: string;
  errorMessage?: string;
}

async function processPost(post: SchedulerPost) {
  console.log(`Processing post ${post._id} for ${post.platform}`);

  try {
    let result;

    switch (post.platform) {
      case "facebook":
        result = await postToFacebook(post._id);
        break;
      default:
        throw new Error(`Unsupported platform: ${post.platform}`);
    }

    if (!result.success) {
      throw new Error(result.error || "Platform posting failed");
    }

    console.log(
      `Successfully posted to ${post.platform}: ${result.platformPostId}`
    );
  } catch (error) {
    console.error(`Failed to post to ${post.platform}:`, error);
    throw error;
  }
}

async function postToFacebook(postId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/facebook/post`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      }
    );

    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
