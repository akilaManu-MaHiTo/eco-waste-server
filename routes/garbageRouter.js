const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");
const {
  createGarbage,
  getGarbage,
  updateGarbage,
  deleteGarbage,
  getCurrentSummary,
  getGarbageTrend,
  getCurrentGarbageLevel
} = require("../controllers/garbageController");

router.post("/", protect, createGarbage);
router.get("/", protect, getGarbage);
router.put("/:id", protect, updateGarbage);
router.delete("/:id", protect, deleteGarbage);
router.get("/summary", protect, getCurrentSummary);
router.get("/trend", protect, getGarbageTrend);
router.get("/level", protect, getCurrentGarbageLevel);
module.exports = router;
