const express = require("express");
const router = express.Router();

const {
checkIn,
checkOut,
getMyAttendance,
} = require("../controllers/attendanceController");

const {
protectEmployee,
} = require("../middlewares/employeeAuthMiddleware");

router.post("/check-in", protectEmployee, checkIn);
router.post("/check-out", protectEmployee, checkOut);
router.get("/me", protectEmployee, getMyAttendance);

module.exports = router;
