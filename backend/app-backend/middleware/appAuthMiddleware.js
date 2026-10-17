const jwt = require("jsonwebtoken");
const Employee = require("../../models/Employee");

const appAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Accept employee tokens only.
    const employeeId = decoded.employeeId || decoded.id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: "Invalid employee token",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee || employee.employmentStatus !== "active") {
      return res.status(401).json({
        success: false,
        message: "Employee account not found or inactive",
      });
    }

    req.employee = employee;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

module.exports = appAuthMiddleware;