import mongoose from "mongoose";
import User from "../src/models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function updateUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Create properly hashed password for "password123"
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Update all users to be approved with correct password hash
    const result = await User.updateMany({}, { approved: true, password: hashedPassword });
    console.log(`Updated ${result.modifiedCount} users to approved: true with password "password123"`);

    // Update the role for users who have "OWNER" to "PERMIT_HOLDER"
    const ownerResult = await User.updateMany({ role: "OWNER" }, { role: "PERMIT_HOLDER" });
    console.log(`Updated ${ownerResult.modifiedCount} users to PERMIT_HOLDER role`);

    // Fetch and display all users
    const users = await User.find({});
    console.log("\nAll users:");
    users.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}, Approved: ${user.approved}`);
    });

    console.log("\nTest Credentials:");
    console.log("- citizen@pvms.test / password123");
    console.log("- owner@pvms.test / password123");
    console.log("- officer@pvms.test / password123");

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

updateUsers();
