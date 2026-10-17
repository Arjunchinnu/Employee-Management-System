const mongoose = require("mongoose");

const faceEnrollmentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
      index: true,
    },

    // Face embedding is sensitive biometric data.
    // Never return it through ordinary API responses.
    embedding: {
      type: [Number],
      select: false,
      default: undefined,
    },

    modelVersion: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    lastVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FaceEnrollment",
  faceEnrollmentSchema
);