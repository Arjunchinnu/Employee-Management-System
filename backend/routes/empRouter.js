const express = require("express");

const router = express.Router();

const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/empController");

const { protectAdmin } = require("../middlewares/authMiddleware");



// All routes below require admin authentication
router.post("/", protectAdmin, createEmployee);

router.get("/", protectAdmin, getAllEmployees);

router.get("/:id", protectAdmin, getEmployeeById);

router.put("/:id", protectAdmin, updateEmployee);

router.delete("/:id", protectAdmin, deleteEmployee);

module.exports = router;
