import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  _id: string;
  imageId: mongoose.Types.ObjectId;
  caption: string;
  selectedVariation?: string;
  customCaption?: string;
  finalCaption: string;
  scheduledTime: Date;
  status: "queued" | "posted" | "failed" | "cancelled";
  platform: "facebook" | "instagram";
  platformPostId?: string;
  isAutomatic: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    caption: {
      type: String,
      required: true,
    },
    selectedVariation: {
      type: String,
    },
    customCaption: {
      type: String,
    },
    finalCaption: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "posted", "failed", "cancelled"],
      default: "queued",
    },
    platform: {
      type: String,
      enum: ["facebook", "instagram"],
      default: "facebook",
    },
    platformPostId: {
      type: String,
    },
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
    },
    postedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ scheduledTime: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ platform: 1 });
PostSchema.index({ createdAt: -1 });

export default mongoose.models.Post ||
  mongoose.model<IPost>("Post", PostSchema);
