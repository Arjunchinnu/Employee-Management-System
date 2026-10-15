const express = require("express");
const cors = require("cors");
require("dotenv").config();
const employeeRoutes = require("./routes/empRouter");
const employeeAuthRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");
const employeeDetailRoutes = require("./routes/employeeDetailRoutes");
const attendanceRoutes = require("./routes/attendanceRoute");
const leaveRoutes = require("./routes/leaveRoute");
const adminLeaveRoutes = require("./routes/adminLeaveRoute");

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

app.use("/api/auth", authRoutes);
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", employeeRoutes);
app.use("/api/employee/auth", employeeAuthRoutes);
app.use("/api/employee", employeeDetailRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/admin/leaves", adminLeaveRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
