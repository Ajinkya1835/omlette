import mongoose from "mongoose";

const violationSchema = new mongoose.Schema(
  {
    // Who reported the violation
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic violation info
    violationType: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    // Location of violation
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    // Evidence - Keep as 'url' (file.path gets stored here)
    media: [
      {
        url: {
          type: String,
        },
        type: {
          type: String,
          enum: ["IMAGE", "VIDEO"],
        },
      },
    ],

    // 🔐 AUTOMATED DECISION SNAPSHOT (IMMUTABLE)
    decision: {
      decision: {
        type: String,
      },
      amount: {
        type: Number,
        default: 0,
      },
      ruleApplied: {
        type: String,
      },
      ruleSnapshot: {
        title: String,
        act: String,
        section: String,
        authority: String,
        severity: String,
      },
      aiConfidence: {
        type: Number,
      },
      requiresHuman: {
        type: Boolean,
        default: false,
      },
      overrideReason: {
        type: String,
      },
    },

    // 🔁 STATUS STATE MACHINE
    status: {
      type: String,
      enum: [
        "REPORTED",
        "AUTO_DECIDED",
        "AWAITING_OWNER",
        "PAID",
        "OBJECTED",
        "UNDER_REVIEW",
        "CLOSED",
      ],
      default: "REPORTED",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Violation", violationSchema);