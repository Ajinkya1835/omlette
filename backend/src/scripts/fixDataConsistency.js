import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "../models/Property.js";
import Violation from "../models/Violation.js";

dotenv.config();

const fixDataConsistency = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🔧 Fixing data consistency issues...\n");

    // Fix properties
    console.log("📍 Fixing Property locations...");
    const properties = await Property.find({});
    let propertiesFixed = 0;

    for (const property of properties) {
      let needsUpdate = false;

      // Ensure locationGeo exists and matches lat/lng
      if (property.latitude && property.longitude) {
        if (!property.locationGeo || !property.locationGeo.coordinates) {
          property.locationGeo = {
            type: "Point",
            coordinates: [property.longitude, property.latitude],
          };
          needsUpdate = true;
        } else {
          const [lng, lat] = property.locationGeo.coordinates;
          if (lng !== property.longitude || lat !== property.latitude) {
            property.locationGeo.coordinates = [property.longitude, property.latitude];
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await property.save();
        propertiesFixed++;
        console.log(`  ✅ Fixed property ${property._id} (${property.propertyName})`);
      }
    }

    console.log(`  📊 Fixed ${propertiesFixed}/${properties.length} properties`);

    // Fix violations
    console.log("\n📍 Fixing Violation locations...");
    const violations = await Violation.find({});
    let violationsFixed = 0;

    for (const violation of violations) {
      let needsUpdate = false;

      // Ensure locationGeo exists and matches location
      if (violation.location && violation.location.latitude && violation.location.longitude) {
        if (!violation.locationGeo || !violation.locationGeo.coordinates) {
          violation.locationGeo = {
            type: "Point",
            coordinates: [violation.location.longitude, violation.location.latitude],
          };
          needsUpdate = true;
        } else {
          const [lng, lat] = violation.locationGeo.coordinates;
          if (lng !== violation.location.longitude || lat !== violation.location.latitude) {
            violation.locationGeo.coordinates = [violation.location.longitude, violation.location.latitude];
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await violation.save();
        violationsFixed++;
        console.log(`  ✅ Fixed violation ${violation._id}`);
      }
    }

    console.log(`  📊 Fixed ${violationsFixed}/${violations.length} violations`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 FIX SUMMARY");
    console.log("=".repeat(50));
    console.log(`Properties fixed: ${propertiesFixed}/${properties.length}`);
    console.log(`Violations fixed: ${violationsFixed}/${violations.length}`);
    console.log("=".repeat(50));
    console.log("\n✨ Data consistency fixed successfully!");

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing data:", error);
    process.exit(1);
  }
};

fixDataConsistency();
