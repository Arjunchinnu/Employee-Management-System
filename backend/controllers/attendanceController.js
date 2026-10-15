const Attendance = require("../models/Attendance");

// Employee check-in
exports.checkIn = async (req, res) => {
try {
const employeeId = req.employee.id;


// Use a consistent server timezone for attendance dates.
// This example uses India Standard Time.
const now = new Date();
const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const attendance = await Attendance.create({
  employee: employeeId,
  date: indiaDate,
  checkIn: now,
});

return res.status(201).json({
  success: true,
  message: "Check-in successful.",
  attendance,
});


} catch (error) {
if (error.code === 11000) {
return res.status(409).json({
success: false,
message: "Attendance already exists for today.",
});
}


console.error("Check-in failed:", error.message);

return res.status(500).json({
  success: false,
  message: "Unable to check in.",
});


}
};

// Employee check-out
exports.checkOut = async (req, res) => {
try {
const employeeId = req.employee.id;

const now = new Date();

const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const attendance = await Attendance.findOne({
  employee: employeeId,
  date: indiaDate,
});

if (!attendance) {
  return res.status(404).json({
    success: false,
    message: "No check-in record found for today.",
  });
}

if (attendance.checkOut) {
  return res.status(409).json({
    success: false,
    message: "You have already checked out today.",
  });
}

if (!attendance.checkIn || now <= attendance.checkIn) {
  return res.status(400).json({
    success: false,
    message: "Invalid check-in or check-out time.",
  });
}

attendance.checkOut = now;

// Calculate elapsed time in minutes.
attendance.workingMinutes = Math.floor(
  (attendance.checkOut - attendance.checkIn) / (1000 * 60)
);

await attendance.save();

return res.status(200).json({
  success: true,
  message: "Check-out successful.",
  attendance,
});


} catch (error) {
console.error("Check-out failed:", error.message);


return res.status(500).json({
  success: false,
  message: "Unable to check out.",
});


}
};

// Employee attendance history
exports.getMyAttendance = async (req, res) => {
try {
const attendance = await Attendance.find({
employee: req.employee.id,
}).sort({ date: -1 });


return res.status(200).json({
  success: true,
  count: attendance.length,
  attendance,
});


} catch (error) {
console.error("Get attendance failed:", error.message);


return res.status(500).json({
  success: false,
  message: "Unable to fetch attendance history.",
});


}
};
