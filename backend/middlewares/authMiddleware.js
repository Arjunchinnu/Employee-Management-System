const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only allow admin tokens.
    if (decoded.role !== "admin" || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

module.exports = { protectAdmin };

// const jwt = require("jsonwebtoken");
// const Employee = require("../models/Employee");
// const appAuthMiddleware = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication token is required.",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Confirm this token belongs to an employee.
//     if (decoded.role !== "employee" || !decoded.id) {
//       return res.status(403).json({
//         success: false,
//         message: "Employee access only.",
//       });
//     }

//     // Get the employee from MongoDB.
//     const employee = await Employee.findById(decoded.id);

//     if (!employee || employee.employmentStatus !== "active") {
//       return res.status(401).json({
//         success: false,
//         message: "Employee account not found or inactive.",
//       });
//     }

//     // Make the authenticated employee available to controllers.
//     req.employee = employee;

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired authentication token.",
//     });
//   }
// };

// module.exports = appAuthMiddleware;
