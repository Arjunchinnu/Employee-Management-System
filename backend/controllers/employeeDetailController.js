const Employee = require("../models/Employee");

exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id)
      .select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (employee.employmentStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Employee account is not active.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      employee,
    });
  } catch (error) {
    console.error("Get employee profile failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employee profile.",
    });
  }
};