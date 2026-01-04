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
      enum: ["ACTIVE", "SUSPENDED", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
