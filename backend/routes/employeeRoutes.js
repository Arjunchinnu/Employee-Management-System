const express = require("express");
const router = express.Router();

const {
  employeeLogin,
} = require("../controllers/empAuthController");

router.post("/login", employeeLogin);

module.exports = router;