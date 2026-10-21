
const axios = require("axios");
const FormData = require("form-data");

const API_URL = (
  process.env.FACE_AI_URL || "http://127.0.0.1:8001"
).replace(/\/+$/, "");

const API_KEY = process.env.FACE_AI_API_KEY;

// Send an image to the Python InsightFace service.
const sendFaceImage = async (endpoint, imageBuffer, filename, employeeId) => {
  if (!API_KEY) {
    throw new Error("FACE_AI_API_KEY is missing from backend .env");
  }

  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error("A valid face image buffer is required.");
  }

  const formData = new FormData();

  formData.append("face", imageBuffer, {
    filename: filename || "face.jpg",
    contentType: "image/jpeg",
  });

  if (employeeId) {
    formData.append("employeeId", employeeId);
  }

  const response = await axios.post(`${API_URL}${endpoint}`, formData, {
    headers: {
      ...formData.getHeaders(),
      "X-API-Key": API_KEY,
    },
    timeout: 60000,
    maxBodyLength: Infinity,
  });

  return response.data;
};

// Enroll an employee's face.
const registerFace = async (
  imageBuffer,
  employeeId,
  filename = "face.jpg",
) => {
  if (!employeeId) {
    throw new Error("Employee ID is required for face enrollment.");
  }

  return sendFaceImage("/enroll", imageBuffer, filename, employeeId);
};

// Recognize a face.
const recognizeFace = async (imageBuffer, filename = "face.jpg") => {
  return sendFaceImage("/recognize", imageBuffer, filename);
};

module.exports = {
  registerFace,
  recognizeFace,
};

