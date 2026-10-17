const FaceEnrollment = require("../models/FaceEnrollment");

exports.getFaceEnrollmentStatus = async (req, res) => {
  try {
    const enrollment = await FaceEnrollment.findOne({
      employee: req.employee._id,
      isActive: true,
    }).select("_id modelVersion enrolledAt");

    return res.status(200).json({
      success: true,
      enrolled: Boolean(enrollment),
      enrollment: enrollment
        ? {
            modelVersion: enrollment.modelVersion,
            enrolledAt: enrollment.enrolledAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Face enrollment status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to check face enrollment status.",
    });
  }
};