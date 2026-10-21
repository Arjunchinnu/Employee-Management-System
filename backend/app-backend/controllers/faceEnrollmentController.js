const Employee = require("../../models/Employee");
const { registerFace } = require("../services/faceRecognitionService");

const enrollEmployeeFace = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
     e return res.status(400).json({
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

    // Register the face with CompreFace.
    const result = await registerFace(
      req.file.buffer,
      employee.employeeId,
      req.file.originalname || "face.jpg",
    );

    // Update MongoDB only after CompreFace succeeds.
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

module.exports = { enrollEmployeeFace };
