require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@example.com";
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.INITIAL_ADMIN_PASSWORD,
      12
    );

    await Admin.create({
      name: "System Admin",
      email,
      password: hashedPassword,
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

if (!process.env.INITIAL_ADMIN_PASSWORD) {
  console.error("Set INITIAL_ADMIN_PASSWORD in .env first");
  process.exitCode = 1;
} else {
  createAdmin();
  console.log("Admin creation script executed");
}