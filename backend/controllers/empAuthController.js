const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const employee = await Employee.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (employee.employmentStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your employee account is not active.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      employee.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: employee._id.toString(),
        role: "employee",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Employee login successful.",
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (error) {
    console.error("Employee login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
};

