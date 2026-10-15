const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Check whether the authentication API is working
exports.checklogin = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Check login API is working",
    });
  } catch (error) {
    console.error("Check login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    console.log("Admin login request received:");
    const { email, password } = req.body;

    // Validate input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    // Check if admin exists and is active
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id.toString(),
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Admin login successful",

      token,

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
