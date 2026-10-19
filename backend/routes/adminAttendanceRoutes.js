const express = require("express");
const router = express.Router();

const { getAllAttendance } = require("../controllers/attendanceController");
const { protectAdmin } = require("../middlewares/authMiddleware");

// Admin authentication required
router.get("/", protectAdmin, getAllAttendance);

module.exports = router;
