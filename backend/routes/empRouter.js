const express = require("express");
const multer = require("multer");

const router = express.Router();

// Existing employee controllers
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/empController");

// Existing admin authentication middleware
const { protectAdmin } = require("../middlewares/authMiddleware");

// Face enrollment controller
const {
  enrollEmployeeFace,
} = require("../app-backend/controllers/faceAttendanceController");

// Configure face image uploads
const faceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// ==========================================
// EXISTING EMPLOYEE ROUTES
// All routes require admin authentication
// ==========================================

// Create employee
router.post("/", protectAdmin, createEmployee);

// Get all employees
router.get("/", protectAdmin, getAllEmployees);

// Get employee by MongoDB ID
router.get("/:id", protectAdmin, getEmployeeById);

// Update employee
router.put("/:id", protectAdmin, updateEmployee);

// Delete employee
router.delete("/:id", protectAdmin, deleteEmployee);

// ==========================================
// FACE ENROLLMENT ROUTE
// Admin registers an employee's face
// ==========================================

router.post(
  "/:id/register-face",
  protectAdmin,
  faceUpload.single("face"),
  enrollEmployeeFace,
);

module.exports = router;
