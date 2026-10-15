//for the admin to create, read, update and delete employees
const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");

// CREATE EMPLOYEE
exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      phone,
      department,
      designation,
      joiningDate,
    } = req.body;

    if (
      !employeeId ||
      !name ||
      !email ||
      !password ||
      !department ||
      !designation
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required employee details.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const existingEmployee = await Employee.findOne({
      $or: [
        { employeeId: employeeId.trim().toUpperCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      phone,
      department,
      designation,
      joiningDate,
      createdBy: req.admin.id,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        employmentStatus: employee.employmentStatus,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists.",
      });
    }

    console.error("Create employee error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee.",
    });
  }
};

// GET ALL EMPLOYEES
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees.",
    });
  }
};

// GET ONE EMPLOYEE
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("-password")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee.",
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "email",
      "phone",
      "department",
      "designation",
      "employmentStatus",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      employee,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Employee ID or email already exists.",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update employee.",
    });
  }
};

// DELETE EMPLOYEE
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    console.error("Delete employee error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete employee.",
    });
  }
};

