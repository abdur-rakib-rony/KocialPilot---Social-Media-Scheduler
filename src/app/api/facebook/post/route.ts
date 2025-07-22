import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import type { Readable } from "stream";

const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
      return NextResponse.json(
        { error: "Facebook credentials not configured" },
        { status: 500 }
      );
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { postId } = body as { postId?: string };

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId).populate("imageId");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "queued") {
      return NextResponse.json(
        { error: "Post is not in queued status" },
        { status: 400 }
      );
    }

    if (post.platform !== "facebook") {
      return NextResponse.json(
        { error: "Post is not configured for Facebook" },
        { status: 400 }
      );
    }

    const imagePath = path.join(
      process.cwd(),
      "public",
      post.imageId.url.replace("/", "")
    );
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json(
        { error: "Image file not found" },
        { status: 404 }
      );
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const photoId = await uploadPhotoToFacebook(
      imageBuffer,
      post.imageId.filename
    );

    if (!photoId) {
      await Post.findByIdAndUpdate(postId, {
        status: "failed",
        errorMessage: "Failed to upload image to Facebook",
      });

      return NextResponse.json(
        { error: "Failed to upload image to Facebook" },
        { status: 500 }
      );
    }

    const fbPostId = await createFacebookPost(photoId, post.finalCaption);

    if (!fbPostId) {
      await Post.findByIdAndUpdate(postId, {
        status: "failed",
        errorMessage: "Failed to create Facebook post",
      });

      return NextResponse.json(
        { error: "Failed to create Facebook post" },
        { status: 500 }
      );
    }

    await Post.findByIdAndUpdate(postId, {
      status: "posted",
      platformPostId: fbPostId,
      postedAt: new Date(),
      errorMessage: null,
    });

    return NextResponse.json({
      success: true,
      message: "Post published to Facebook successfully",
      platformPostId: fbPostId,
    });
  } catch (error) {
    let errorMsg = "Facebook posting failed";
    if (error instanceof Error) {
      errorMsg += ": " + error.message;
    }
    console.error("Facebook posting error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

async function uploadPhotoToFacebook(
  imageBuffer: Buffer,
  filename: string
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("source", imageBuffer, {
      filename,
      contentType: "image/jpeg",
    });
    formData.append("access_token", FB_ACCESS_TOKEN!);

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/photos`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    if (response.data && response.data.id) {
      return response.data.id;
    } else {
      console.error("Facebook photo upload error:", response.data);
      return null;
    }
  } catch (error) {
    console.error("Photo upload error:", error);
    return null;
  }
}

async function createFacebookPost(
  photoId: string,
  caption: string
): Promise<string | null> {
  try {
    const postData = {
      message: caption,
      attached_media: JSON.stringify([{ media_fbid: photoId }]),
      access_token: FB_ACCESS_TOKEN,
    };

    const formData = new URLSearchParams();
    Object.entries(postData).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (response.ok && result.id) {
      return result.id;
    } else {
      console.error("Facebook post creation error:", result);
      return null;
    }
  } catch (error) {
    console.error("Post creation error:", error);
    return null;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
      return NextResponse.json({
        connected: false,
        error: "Facebook credentials not configured",
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PAGE_ID}?access_token=${FB_ACCESS_TOKEN}`
    );
    const result: Record<string, unknown> = await response.json();

    if (response.ok) {
      return NextResponse.json({
        connected: true,
        pageInfo: {
          id: result["id"],
          name: result["name"],
          category: result["category"],
        },
      });
    } else {
      const errorMsg =
        typeof result["error"] === "object" &&
        result["error"] !== null &&
        "message" in result["error"]
          ? (result["error"] as { message?: string }).message
          : "Failed to connect to Facebook";
      return NextResponse.json({
        connected: false,
        error: errorMsg,
      });
    }
  } catch (error) {
    let errorMsg = "Connection test failed";
    if (error instanceof Error) {
      errorMsg += ": " + error.message;
    }
    return NextResponse.json({
      connected: false,
      error: errorMsg,
    });
  }
}
