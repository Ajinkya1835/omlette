import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const users = [
  {
    name: "Test Citizen",
    email: "citizen@test.com",
    password: "123456",
    role: "CITIZEN",
  },
  {
  name: "Test Permit Holder",
  email: "owner@test.com",
  password: "123456",
  role: "PERMIT_HOLDER",
   },
  {
    name: "Test Officer",
    email: "officer@test.com",
    password: "123456",
    role: "OFFICER",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");

    // Clean old test users
    await User.deleteMany({
      email: { $in: users.map((u) => u.email) },
    });

    for (let user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await User.create({
        ...user,
        password: hashedPassword,
      });
    }

    console.log("Dummy users created successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
