
const Employee = require("../../models/Employee");
const Attendance = require("../../models/Attendance");

const {
  registerFace,
  recognizeFace,
} = require("../services/faceRecognitionService");

// ==========================================
// REGISTER EMPLOYEE FACE
// ==========================================
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

    // Send the captured face to Python InsightFace.
    const result = await registerFace(
      req.file.buffer,
      employee.employeeId,
      req.file.originalname || "face.jpg",
    );

    if (!result || result.success !== true) {
      return res.status(400).json({
        success: false,
        message: result?.message || "Python could not enroll this face.",
      });
    }

    // Update MongoDB only after Python confirms enrollment.
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
    });
  } catch (error) {
    console.error("Face enrollment error:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to register employee face.",
    });
  }
};

// ==========================================
// TEST FACE RECOGNITION
// ==========================================
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

    return res.status(502).json({
      success: false,
      message: "Face recognition service failed.",
    });
  }
};

// ==========================================
// RECORD ATTENDANCE USING FACE RECOGNITION
// ==========================================
exports.recordFaceAttendance = async (req, res) => {
  try {
    const { action } = req.body;

    if (!["check-in", "check-out"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be check-in or check-out.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please capture and upload a face image.",
      });
    }

    // Ask Python to recognize the face.
    const recognitionResult = await recognizeFace(
      req.file.buffer,
      req.file.originalname || "attendance.jpg",
    );

    // Python returns:
    // { success, recognized, employeeId, similarity, message }
    if (
      !recognitionResult ||
      recognitionResult.success !== true ||
      recognitionResult.recognized !== true ||
      !recognitionResult.employeeId
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid Person. Face not recognized.",
      });
    }

    const recognizedEmployeeId = String(
      recognitionResult.employeeId,
    ).trim().toUpperCase();

    const similarity = Number(recognitionResult.similarity);

    const threshold = Number(
      process.env.FACE_MATCH_THRESHOLD || 0.45,
    );

    // Validate the returned score as well as the recognition result.
    if (
      !Number.isFinite(similarity) ||
      similarity < threshold
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid Person. Face match is below the threshold.",
      });
    }

    // Verify the recognized employee exists and is active.
    const employee = await Employee.findOne({
      employeeId: recognizedEmployeeId,
      employmentStatus: "active",
      "faceEnrollment.status": "registered",
      "faceEnrollment.subject": recognizedEmployeeId,
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid Person. No active enrolled employee matches this face.",
      });
    }

    // Use today's date in India.
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date,
    });

    // ======================================
    // CHECK-IN
    // ======================================
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
          similarity,
        },
      });
    }

    // ======================================
    // CHECK-OUT
    // ======================================
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
        similarity,
      },
    });
  } catch (error) {
    console.error("Face attendance error:", {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    return res.status(502).json({
      success: false,
      message: "Unable to process face attendance. Please try again.",
    });
  }
};

