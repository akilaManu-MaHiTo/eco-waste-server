const express = require("express");
const { generatePayHereHash } = require("../controllers/payhereHash");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.post("/hash", protect, generatePayHereHash);

module.exports = router;
