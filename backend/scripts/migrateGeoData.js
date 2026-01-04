// backend/scripts/migrateGeoData.js
// Migration script to populate GeoJSON fields from existing latitude/longitude

import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "../src/models/Property.js";
import Violation from "../src/models/Violation.js";

dotenv.config();

async function migrateGeoData() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // ========================================
    // 1️⃣ MIGRATE PROPERTIES
    // ========================================
    console.log("📍 Migrating Properties...");
    
    const properties = await Property.find({});
    let propertiesUpdated = 0;
    let propertiesSkipped = 0;

    for (const property of properties) {
      // Skip if locationGeo already exists
      if (property.locationGeo && property.locationGeo.coordinates) {
        propertiesSkipped++;
        continue;
      }

      // Check if latitude and longitude exist
      if (property.latitude && property.longitude) {
        property.locationGeo = {
          type: "Point",
          coordinates: [property.longitude, property.latitude], // [lng, lat] order
        };
        await property.save();
        propertiesUpdated++;
      }
    }

    console.log(`   ✅ Updated: ${propertiesUpdated}`);
    console.log(`   ⏭️  Skipped: ${propertiesSkipped}`);
    console.log(`   📊 Total: ${properties.length}\n`);

    // ========================================
    // 2️⃣ MIGRATE VIOLATIONS
    // ========================================
    console.log("📍 Migrating Violations...");
    
    const violations = await Violation.find({});
    let violationsUpdated = 0;
    let violationsSkipped = 0;

    for (const violation of violations) {
      // Skip if locationGeo already exists
      if (violation.locationGeo && violation.locationGeo.coordinates) {
        violationsSkipped++;
        continue;
      }

      // Check if location.latitude and location.longitude exist
      if (violation.location?.latitude && violation.location?.longitude) {
        violation.locationGeo = {
          type: "Point",
          coordinates: [violation.location.longitude, violation.location.latitude],
        };
        await violation.save();
        violationsUpdated++;
      }
    }

    console.log(`   ✅ Updated: ${violationsUpdated}`);
    console.log(`   ⏭️  Skipped: ${violationsSkipped}`);
    console.log(`   📊 Total: ${violations.length}\n`);

    // ========================================
    // 3️⃣ CREATE GEOSPATIAL INDEXES
    // ========================================
    console.log("🔍 Creating Geospatial Indexes...");
    
    try {
      await Property.collection.createIndex({ locationGeo: "2dsphere" });
      console.log("   ✅ Property.locationGeo index created");
    } catch (err) {
      if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
        console.log("   ⏭️  Property.locationGeo index already exists");
      } else {
        throw err;
      }
    }

    try {
      await Violation.collection.createIndex({ locationGeo: "2dsphere" });
      console.log("   ✅ Violation.locationGeo index created");
    } catch (err) {
      if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
        console.log("   ⏭️  Violation.locationGeo index already exists");
      } else {
        throw err;
      }
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Properties: ${propertiesUpdated} migrated, ${propertiesSkipped} skipped`);
    console.log(`   Violations: ${violationsUpdated} migrated, ${violationsSkipped} skipped`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

migrateGeoData();
