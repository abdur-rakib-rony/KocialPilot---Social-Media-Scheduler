import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import multer from "multer";
import path from "path";
import fs from "fs";
import connectDB from "@/lib/db";
import Image from "@/models/Image";
import type {IImage} from "@/models/Image";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `image-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const images: IImage[] = [];

    for (const file of files) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only images allowed.` },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max size is 10MB.` },
          { status: 400 }
        );
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(file.name);
      const filename = `image-${uniqueSuffix}${fileExtension}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      const imageDoc = new Image({
        filename: filename,
        originalName: file.name,
        url: `/uploads/${filename}`,
        filePath: filePath,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date(),
      });

      const savedImage = await imageDoc.save();

      images.push(savedImage as IImage);
    }

    return NextResponse.json({
      success: true,
      message: `${images.length} image(s) uploaded successfully`,
      images: images,
      total: images.length,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Upload failed: " + message },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const images = await Image.find({})
      .sort({ uploadedAt: -1 })
      .select("-filePath -__v")
      .lean();

    return NextResponse.json({
      success: true,
      message: `Found ${images.length} image(s)`,
      images: images,
      total: images.length,
    });
  } catch (error: unknown) {
    console.error("Error getting images:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get images: " + message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");
    if (!imageId || !Types.ObjectId.isValid(imageId)) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
    }
    const image = await Image.findById(imageId);
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    if (image.filePath && fs.existsSync(image.filePath)) {
      fs.unlinkSync(image.filePath);
    }
    await Image.findByIdAndDelete(imageId);
    return NextResponse.json({ success: true, message: "Image deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Delete failed: " + message },
      { status: 500 }
    );
  }
}
