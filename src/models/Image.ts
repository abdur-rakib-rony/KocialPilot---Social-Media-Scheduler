import mongoose, { Document, Schema } from "mongoose";

export interface IImage extends Document {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  filePath: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
  isUsed: boolean;
  usedInPosts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedInPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ImageSchema.index({ uploadedAt: -1 });
ImageSchema.index({ isUsed: 1 });

export default mongoose.models.Image ||
  mongoose.model<IImage>("Image", ImageSchema);
