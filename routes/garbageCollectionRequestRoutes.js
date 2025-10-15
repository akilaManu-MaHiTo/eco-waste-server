const express = require("express");
const { protect } = require("../controllers/authController");
const {
  getGarbageCollectionRequest,
} = require("../controllers/garbageCollectionRequestController");
const router = express.Router();

// Server-to-server notification endpoint
router.get("/", protect, getGarbageCollectionRequest);

module.exports = router;
