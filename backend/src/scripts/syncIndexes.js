import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Violation from "../models/Violation.js";
import ViolationRule from "../models/ViolationRule.js";
import Appeal from "../models/Appeal.js";
import AuditLog from "../models/AuditLog.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";

dotenv.config();

const syncIndexes = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n📊 Syncing database indexes...\n");

    // Sync all model indexes
    const models = [
      { name: "User", model: User },
      { name: "Property", model: Property },
      { name: "Violation", model: Violation },
      { name: "ViolationRule", model: ViolationRule },
      { name: "Appeal", model: Appeal },
      { name: "AuditLog", model: AuditLog },
      { name: "Comment", model: Comment },
      { name: "Notification", model: Notification },
      { name: "Payment", model: Payment },
    ];

    for (const { name, model } of models) {
      try {
        await model.syncIndexes();
        console.log(`✅ ${name} indexes synced`);
      } catch (error) {
        console.error(`❌ Error syncing ${name} indexes:`, error.message);
      }
    }

    console.log("\n✨ Database indexes synced successfully!");
    console.log("\n📋 Verifying indexes...\n");

    // List all indexes for verification
    for (const { name, model } of models) {
      try {
        const indexes = await model.collection.getIndexes();
        console.log(`\n${name} Indexes:`);
        Object.keys(indexes).forEach((indexName) => {
          console.log(`  - ${indexName}`);
        });
      } catch (error) {
        console.error(`Error listing ${name} indexes:`, error.message);
      }
    }

    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing indexes:", error);
    process.exit(1);
  }
};

syncIndexes();
