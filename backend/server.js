const express = require("express");
const cors = require("cors");
require("dotenv").config();

//app-backend
const faceRoutes = require("./app-backend/routes/faceRoutes");
const faceAttendanceRoutes = require("./app-backend/routes/faceAttendanceRoutes");

const employeeRoutes = require("./routes/empRouter");
const employeeAuthRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const employeeDetailRoutes = require("./routes/employeeDetailRoutes");
const attendanceRoutes = require("./routes/attendanceRoute");
const leaveRoutes = require("./routes/leaveRoute");
const adminLeaveRoutes = require("./routes/adminLeaveRoute");
const adminAttendanceRoutes = require("./routes/adminAttendanceRoutes");

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Employee Management API is running",
  });
});

//approutes
app.use("/api/app/face", faceRoutes);
app.use("/api/face-attendance", faceAttendanceRoutes);

//web routes
app.use("/api/auth", authRoutes);
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin/employees", employeeRoutes);
app.use("/api/employee/auth", employeeAuthRoutes);
app.use("/api/employee", employeeDetailRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/admin/leaves", adminLeaveRoutes);
app.use("/api/admin/attendance", adminAttendanceRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
