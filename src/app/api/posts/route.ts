import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Image from "@/models/Image";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const {
      imageId,
      caption,
      selectedVariation,
      customCaption,
      finalCaption,
      scheduledTime,
      platform,
      isAutomatic,
    } = await request.json();

    if (!imageId || !finalCaption || !scheduledTime) {
      return NextResponse.json(
        { error: "imageId, finalCaption, and scheduledTime are required" },
        { status: 400 }
      );
    }

    const image = await Image.findById(imageId);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    const postData = new Post({
      imageId: imageId,
      caption: caption,
      selectedVariation: selectedVariation,
      customCaption: customCaption,
      finalCaption: finalCaption,
      scheduledTime: scheduledDate,
      platform: platform || "facebook",
      isAutomatic: isAutomatic || false,
      status: "queued",
    });

    const savedPost = await postData.save();

    await Image.findByIdAndUpdate(imageId, {
      isUsed: true,
      $push: { usedInPosts: savedPost._id },
    });

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      post: {
        _id: savedPost._id,
        imageId: savedPost.imageId,
        finalCaption: savedPost.finalCaption,
        scheduledTime: savedPost.scheduledTime,
        platform: savedPost.platform,
        status: savedPost.status,
        isAutomatic: savedPost.isAutomatic,
        createdAt: savedPost.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Post creation failed: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const filter: any = {};
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const posts = await Post.find(filter)
      .populate("imageId", "url filename originalName size")
      .sort({ scheduledTime: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(filter);

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      image: post.imageId,
      finalCaption: post.finalCaption,
      scheduledTime: post.scheduledTime,
      platform: post.platform,
      status: post.status,
      isAutomatic: post.isAutomatic,
      platformPostId: post.platformPostId,
      errorMessage: post.errorMessage,
      createdAt: post.createdAt,
      postedAt: post.postedAt,
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Failed to get posts: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { postId, status, scheduledTime, finalCaption, platform } =
      await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (scheduledTime) updateData.scheduledTime = new Date(scheduledTime);
    if (finalCaption) updateData.finalCaption = finalCaption;
    if (platform) updateData.platform = platform;

    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
    }).populate("imageId", "url filename originalName");

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error: any) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { error: "Post update failed: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "posted") {
      return NextResponse.json(
        { error: "Cannot delete already posted content" },
        { status: 400 }
      );
    }

    await Post.findByIdAndDelete(postId);

    await Image.findByIdAndUpdate(post.imageId, {
      $pull: { usedInPosts: postId },
    });

    const remainingPosts = await Post.countDocuments({ imageId: post.imageId });
    if (remainingPosts === 0) {
      await Image.findByIdAndUpdate(post.imageId, { isUsed: false });
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    console.error("Post deletion error:", error);
    return NextResponse.json(
      { error: "Post deletion failed: " + error.message },
      { status: 500 }
    );
  }
}
