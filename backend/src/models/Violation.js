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

    // Related property (optional)
    relatedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: false,
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

    // GeoJSON for geospatial queries (backward compatible)
    locationGeo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
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

    // Owner's objection text (set when they object to a violation)
    objectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries and geospatial operations
violationSchema.index({ reportedBy: 1, status: 1 });
violationSchema.index({ relatedProperty: 1, status: 1 });
violationSchema.index({ status: 1, createdAt: -1 });
violationSchema.index({ locationGeo: "2dsphere" }); // Geospatial index
violationSchema.index({ violationType: 1 });
violationSchema.index({ createdAt: -1 });

export default mongoose.model("Violation", violationSchema);