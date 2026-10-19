const express = require("express");
const multer = require("multer");

const {
  testFaceRecognition,
  recordFaceAttendance,
} = require("../controllers/faceAttendanceController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Test whether the route is working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Face attendance route is working",
  });
});

// Test face recognition
router.post("/recognize", upload.single("face"), testFaceRecognition);

// Employee check-in using face recognition
router.post(
  "/check-in",
  upload.single("face"),
  (req, res, next) => {
    req.body.action = "check-in";
    next();
  },
  recordFaceAttendance,
);

// Employee check-out using face recognition
router.post(
  "/check-out",
  upload.single("face"),
  (req, res, next) => {
    req.body.action = "check-out";
    next();
  },
  recordFaceAttendance,
);

module.exports = router;

// const express = require("express");
// const multer = require("multer");

// const {
//   testFaceRecognition,
// } = require("../controllers/faceAttendanceController");

// const router = express.Router();

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed"));
//     }
//   },
// });

// router.get("/test", (req, res) => {
//   res.json({
//     success: true,
//     message: "Face attendance route is working",
//   });
// });

// router.post(
//   "/recognize",
//   upload.single("face"),
//   testFaceRecognition
// );

// module.exports = router;
