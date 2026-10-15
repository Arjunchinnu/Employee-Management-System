const express = require("express");
const router = express.Router();

const { getMyProfile } = require("../controllers/employeeDetailController");
const { protectEmployee } = require("../middlewares/employeeAuthMiddleware");

router.get("/profile", protectEmployee, getMyProfile);

module.exports = router;
