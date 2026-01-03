import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function resetViolations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Drop the violations collection
    await mongoose.connection.db.dropCollection("violations");
    console.log("✅ Violations collection dropped");

    console.log("✅ Ready for fresh start - restart your backend now!");
    process.exit(0);
  } catch (err) {
    if (err.message === "ns not found") {
      console.log("✅ Collection doesn't exist yet - you're good!");
    } else {
      console.error("❌ Error:", err.message);
    }
    process.exit(1);
  }
}

resetViolations();