const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
{
employee: {
type: mongoose.Schema.Types.ObjectId,
ref: "Employee",
required: true,
index: true,
},


date: {
  type: String,
  required: true,
},

checkIn: {
  type: Date,
  default: null,
},

checkOut: {
  type: Date,
  default: null,
},

workingMinutes: {
  type: Number,
  default: 0,
  min: 0,
},

status: {
  type: String,
  enum: ["present", "absent", "half-day", "leave"],
  default: "present",
},


},
{ timestamps: true }
);

// One attendance record per employee per date
attendanceSchema.index(
{ employee: 1, date: 1 },
{ unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
