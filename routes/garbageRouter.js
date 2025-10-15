const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");
const {
  createGarbage,
  getGarbage,
  getTodayGarbage,
  updateGarbage,
  deleteGarbage,
} = require("../controllers/garbageController");

router.post("/", protect, createGarbage);
router.get("/", protect, getGarbage);
router.get("/today", protect, getTodayGarbage);
router.put("/:id", protect, updateGarbage);
router.delete("/:id", protect, deleteGarbage);
module.exports = router;
