const Employee = require("../../models/Employee");
const Attendance = require("../../models/Attendance");

const {
  registerFace,
  recognizeFace,
} = require("../services/faceRecognitionService");

// Register an employee's face
exports.enrollEmployeeFace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an employee face image.",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (employee.employmentStatus !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active employees can register their faces.",
      });
    }

    if (employee.faceEnrollment?.status === "registered") {
      return res.status(409).json({
        success: false,
        message: "This employee's face is already registered.",
      });
    }

    const result = await registerFace(
      req.file.buffer,
      employee.employeeId,
      req.file.originalname || "face.jpg",
    );

    employee.faceEnrollment = {
      status: "registered",
      subject: employee.employeeId,
      registeredAt: new Date(),
    };

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee face registered successfully.",
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        faceEnrollment: employee.faceEnrollment,
      },
      recognitionService: result,
    });
  } catch (error) {
    console.error("Face enrollment error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      response: error.response?.data,
      url: error.config?.url,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to register employee face.",
    });
  }
};

// Test face recognition
exports.testFaceRecognition = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a face image.",
      });
    }

    const result = await recognizeFace(
      req.file.buffer,
      req.file.originalname || "face.jpg",
    );

    return res.status(200).json({
      success: true,
      message: "Face recognition completed.",
      result,
    });
  } catch (error) {
    console.error("Face recognition error:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Face recognition failed.",
    });
  }
};

// Record attendance using face recognition
exports.recordFaceAttendance = async (req, res) => {
  try {
    const { action } = req.body;

    // Validate the requested action
    if (!["check-in", "check-out"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be check-in or check-out.",
      });
    }

    // Validate uploaded face image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please capture and upload a face image.",
      });
    }

    // Recognize the uploaded face
    const recognitionResult = await recognizeFace(
      req.file.buffer,
      req.file.originalname || "attendance.jpg",
    );

    // Get CompreFace recognition results
    const results = recognitionResult?.result || [];

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "No recognizable face was found.",
      });
    }

    // Find the highest similarity score returned by CompreFace
    const threshold = Number(
      process.env.FACE_MATCH_THRESHOLD || 0.85,
    );

    let bestMatch = null;

    for (const face of results) {
      for (const subject of face.subjects || []) {
        if (
          !bestMatch ||
          subject.similarity > bestMatch.similarity
        ) {
          bestMatch = subject;
        }
      }
    }

    // Reject faces that do not meet the configured threshold
    if (
      !bestMatch ||
      !bestMatch.subject ||
      bestMatch.similarity < threshold
    ) {
      return res.status(401).json({
        success: false,
        message: "Face not recognized. Please try again.",
      });
    }

    // Match the recognized subject to the employee ID
    const employee = await Employee.findOne({
      employeeId: bestMatch.subject,
      employmentStatus: "active",
      "faceEnrollment.status": "registered",
      "faceEnrollment.subject": bestMatch.subject,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "No active enrolled employee matches this face.",
      });
    }

    // Use the current date in India
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Find today's attendance record
    let attendance = await Attendance.findOne({
      employee: employee._id,
      date,
    });

    // CHECK-IN
    if (action === "check-in") {
      if (attendance?.checkIn) {
        return res.status(409).json({
          success: false,
          message: "You have already checked in today.",
        });
      }

      if (!attendance) {
        attendance = new Attendance({
          employee: employee._id,
          date,
          checkIn: new Date(),
          status: "present",
        });
      } else {
        attendance.checkIn = new Date();
        attendance.status = "present";
      }

      await attendance.save();

      return res.status(200).json({
        success: true,
        message: "Check-in successful.",
        employee: {
          employeeId: employee.employeeId,
          name: employee.name,
        },
        attendance: {
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          workingMinutes: attendance.workingMinutes,
          status: attendance.status,
        },
        faceMatch: {
          similarity: bestMatch.similarity,
        },
      });
    }

    // CHECK-OUT
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Please check in before checking out.",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        success: false,
        message: "You have already checked out today.",
      });
    }

    const checkOutTime = new Date();

    // Calculate working time in minutes
    const elapsedMilliseconds =
      checkOutTime.getTime() - attendance.checkIn.getTime();

    if (elapsedMilliseconds < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance time.",
      });
    }

    attendance.checkOut = checkOutTime;

    attendance.workingMinutes = Math.floor(
      elapsedMilliseconds / 60000,
    );

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful.",
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
      },
      attendance: {
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workingMinutes: attendance.workingMinutes,
        status: attendance.status,
      },
      faceMatch: {
        similarity: bestMatch.similarity,
      },
    });
  } catch (error) {
    console.error("Face attendance error:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to process face attendance.",
    });
  }
};
