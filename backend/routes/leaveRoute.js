const express = require("express");
const router = express.Router();

const {
applyLeave,
getMyLeaves
} = require("../controllers/leaveController");

const {
protectEmployee
} = require("../middlewares/employeeAuthMiddleware");

router.post("/", protectEmployee, applyLeave);
router.get("/me", protectEmployee, getMyLeaves);

module.exports = router;
