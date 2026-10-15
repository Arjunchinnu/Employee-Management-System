const express = require("express");
const router = express.Router();

const { adminLogin, checklogin } = require("../controllers/authController");

router.post("/admin/login", adminLogin);

router.get("/admin/checklogin", checklogin);

module.exports = router;
