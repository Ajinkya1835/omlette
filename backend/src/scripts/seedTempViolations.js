import mongoose from "mongoose";
import dotenv from "dotenv";
import Violation from "../models/Violation.js";
import User from "../models/User.js";

dotenv.config();

async function seedViolations() {
  await mongoose.connect(process.env.MONGO_URI);

  const citizen = await User.findOne({ email: "citizen@test.com" });
  if (!citizen) throw new Error("Citizen not found");

  await Violation.deleteMany({ reportedBy: citizen._id });

  await Violation.create([
    {
      reportedBy: citizen._id,
      violationType: "WASTE-002",
      description: "Garbage dumping near road",
      location: { latitude: 19.204, longitude: 73.012 },
      status: "AWAITING_OWNER",
    },
    {
      reportedBy: citizen._id,
      violationType: "NOISE-001",
      description: "Loud music after 11 PM",
      location: { latitude: 19.205, longitude: 73.013 },
      status: "AWAITING_OWNER",
    }
  ]);

  console.log("✅ Temp violations created");
  process.exit();
}

seedViolations();
