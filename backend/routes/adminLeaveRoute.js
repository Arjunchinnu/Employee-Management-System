const express = require("express");
const router = express.Router();

const {
getAllLeaves,
reviewLeave
} = require("../controllers/leaveController");

const {
protectAdmin
} = require("../middlewares/authMiddleware");

router.get("/", protectAdmin, getAllLeaves);
router.patch("/:id/review", protectAdmin, reviewLeave);

module.exports = router;
