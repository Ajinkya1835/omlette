import mongoose from "mongoose";
import dotenv from "dotenv";
import Property from "../models/Property.js";
import Violation from "../models/Violation.js";

dotenv.config();

const validateData = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🔍 Validating data consistency...\n");

    // Check properties for location format
    console.log("📍 Checking Property locations...");
    const properties = await Property.find({});
    let propertyIssues = 0;

    for (const property of properties) {
      const issues = [];

      // Check if latitude/longitude exist
      if (!property.latitude || !property.longitude) {
        issues.push("Missing latitude or longitude");
      }

      // Check if locationGeo exists
      if (!property.locationGeo || !property.locationGeo.coordinates) {
        issues.push("Missing locationGeo");
      } else {
        // Validate locationGeo format [lng, lat]
        const [lng, lat] = property.locationGeo.coordinates;
        if (lng !== property.longitude || lat !== property.latitude) {
          issues.push(`Coordinate mismatch: locationGeo[${lng}, ${lat}] vs lat/lng[${property.latitude}, ${property.longitude}]`);
        }
      }

      if (issues.length > 0) {
        propertyIssues++;
        console.log(`  ⚠️  Property ${property._id} (${property.propertyName}):`);
        issues.forEach((issue) => console.log(`      - ${issue}`));
      }
    }

    if (propertyIssues === 0) {
      console.log(`  ✅ All ${properties.length} properties have valid location data`);
    } else {
      console.log(`  ⚠️  Found issues in ${propertyIssues}/${properties.length} properties`);
    }

    // Check violations for location format
    console.log("\n📍 Checking Violation locations...");
    const violations = await Violation.find({});
    let violationIssues = 0;

    for (const violation of violations) {
      const issues = [];

      // Check if location exists
      if (!violation.location || !violation.location.latitude || !violation.location.longitude) {
        issues.push("Missing location data");
      }

      // Check if locationGeo exists
      if (!violation.locationGeo || !violation.locationGeo.coordinates) {
        issues.push("Missing locationGeo");
      } else if (violation.location) {
        // Validate locationGeo format [lng, lat]
        const [lng, lat] = violation.locationGeo.coordinates;
        if (lng !== violation.location.longitude || lat !== violation.location.latitude) {
          issues.push(`Coordinate mismatch: locationGeo[${lng}, ${lat}] vs location[${violation.location.latitude}, ${violation.location.longitude}]`);
        }
      }

      // Check media format
      if (violation.media && violation.media.length > 0) {
        violation.media.forEach((item, index) => {
          if (!item.url) {
            issues.push(`Media item ${index} missing 'url' field`);
          }
          if (!item.type || !["IMAGE", "VIDEO"].includes(item.type)) {
            issues.push(`Media item ${index} has invalid type: ${item.type}`);
          }
        });
      }

      if (issues.length > 0) {
        violationIssues++;
        console.log(`  ⚠️  Violation ${violation._id}:`);
        issues.forEach((issue) => console.log(`      - ${issue}`));
      }
    }

    if (violationIssues === 0) {
      console.log(`  ✅ All ${violations.length} violations have valid data`);
    } else {
      console.log(`  ⚠️  Found issues in ${violationIssues}/${violations.length} violations`);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 VALIDATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Properties checked: ${properties.length}`);
    console.log(`Properties with issues: ${propertyIssues}`);
    console.log(`Violations checked: ${violations.length}`);
    console.log(`Violations with issues: ${violationIssues}`);
    console.log("=".repeat(50));

    if (propertyIssues === 0 && violationIssues === 0) {
      console.log("\n✨ All data is consistent!");
    } else {
      console.log("\n⚠️  Some data needs to be fixed. Run fixDataConsistency.js to auto-fix.");
    }

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error validating data:", error);
    process.exit(1);
  }
};

validateData();
