import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    violation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Violation",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        url: {
          type: String,
        },
        type: {
          type: String,
          enum: ["IMAGE", "VIDEO", "DOCUMENT"],
        },
      },
    ],
    isInternal: {
      type: Boolean,
      default: false, // Internal comments visible only to officers
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
commentSchema.index({ violation: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ isInternal: 1 });

export default mongoose.model("Comment", commentSchema);
