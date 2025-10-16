const express = require("express");
const { protect } = require("../controllers/authController");
const {
  getGarbageCollectionRequest,
  getGarbageByCategory,
  getRequestsByStatus,
  getWasteByBinType,
  getDailyCollections,
  getRevenueByCategory,
  getMonthlyRequests,
  getDailyRequestsByDateAndTime,
} = require("../controllers/garbageCollectionRequestController");
const router = express.Router();

// Server-to-server notification endpoint
router.get("/", protect, getGarbageCollectionRequest);
router.get("/garbage-by-category", getGarbageByCategory);
router.get("/requests-by-status", getRequestsByStatus);
router.get("/waste-by-bin-type", getWasteByBinType);
router.get("/daily-collections", getDailyCollections);
router.get("/revenue-by-category", getRevenueByCategory);
router.get("/monthly-requests", getMonthlyRequests);
router.get("/daily-requests",getDailyRequestsByDateAndTime);
module.exports = router;
