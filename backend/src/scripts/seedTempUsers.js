import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

async function seedUsers() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({
    email: { $in: ["citizen@test.com", "owner@test.com"] }
  });

  const hashed = await bcrypt.hash("123456", 10);

  await User.create([
    {
      name: "Test Citizen",
      email: "citizen@test.com",
      password: hashed,
      role: "CITIZEN",
    },
    {
      name: "Test Owner",
      email: "owner@test.com",
      password: hashed,
      role: "OWNER",
    }
  ]);

  console.log("✅ Temp users created");
  process.exit();
}

seedUsers();
