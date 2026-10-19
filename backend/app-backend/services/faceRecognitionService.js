const axios = require("axios");
const FormData = require("form-data");

const API_URL = (
  process.env.FACE_RECOGNITION_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const API_KEY = process.env.FACE_RECOGNITION_API_KEY;

// Register an employee's face
const registerFace = async (imageBuffer, employeeId, filename = "face.jpg") => {
  if (!API_KEY) {
    throw new Error("FACE_RECOGNITION_API_KEY is missing.");
  }

  const formData = new FormData();

  formData.append("file", imageBuffer, {
    filename,
    contentType: "image/jpeg",
  });

  const response = await axios.post(
    `${API_URL}/api/v1/recognition/faces?subject=${encodeURIComponent(
      employeeId,
    )}`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "x-api-key": API_KEY,
      },
      timeout: 60000,
    },
  );

  return response.data;
};

// Recognize an employee's face
const recognizeFace = async (imageBuffer, filename = "face.jpg") => {
  if (!API_KEY) {
    throw new Error("FACE_RECOGNITION_API_KEY is missing.");
  }

  const formData = new FormData();

  formData.append("file", imageBuffer, {
    filename,
    contentType: "image/jpeg",
  });

  const response = await axios.post(
    `${API_URL}/api/v1/recognition/recognize`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "x-api-key": API_KEY,
      },
      timeout: 60000,
    },
  );

  return response.data;
};

module.exports = {
  registerFace,
  recognizeFace,
};
