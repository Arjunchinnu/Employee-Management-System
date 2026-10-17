const express = require("express");

const router = express.Router();

const appAuthMiddleware = require("../middleware/appAuthMiddleware");

const { getFaceEnrollmentStatus } = require("../controllers/faceController");

router.get("/status", appAuthMiddleware, getFaceEnrollmentStatus);

module.exports = router;
