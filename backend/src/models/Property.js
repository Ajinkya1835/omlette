import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ["Shop", "Industry", "Residence", "Farm"],
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    wardNumber: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
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

    permitNumber: {
      type: String,
      required: true,
      unique: true,
    },
    permitValidFrom: {
      type: Date,
      required: true,
    },
    permitValidTo: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "EXPIRED", "PENDING_APPROVAL", "REJECTED"],
      default: "ACTIVE",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries and geospatial operations
propertySchema.index({ owner: 1, status: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ permitNumber: 1 });
propertySchema.index({ locationGeo: "2dsphere" }); // Geospatial index
propertySchema.index({ wardNumber: 1, zone: 1 });
propertySchema.index({ createdAt: -1 });

export default mongoose.model("Property", propertySchema);
