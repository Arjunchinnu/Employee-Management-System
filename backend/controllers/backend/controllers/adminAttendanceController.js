const Attendance = require("../models/Attendance");


const getAllAttendance = async (req, res) => {
try {
const date =
typeof req.query.date === "string" && req.query.date.trim()
? req.query.date.trim()
: new Date().toLocaleDateString("en-CA", {
timeZone: "Asia/Kolkata",
});


// Validate date format
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  return res.status(400).json({
    success: false,
    message: "Invalid date. Use YYYY-MM-DD format.",
  });
}

const attendance = await Attendance.find({ date })
  .populate("employee", "employeeId name department designation email")
  .sort({ checkIn: -1 });

return res.status(200).json({
  success: true,
  date,
  count: attendance.length,
  attendance,
});


} catch (error) {
console.error("Get all attendance error:", error);


return res.status(500).json({
  success: false,
  message: "Failed to fetch attendance records.",
});


}
};

module.exports = { getAllAttendance };
