const express = require("express");
const router = express.Router();
const {
  createWasteBin,
  getWasteBins,
  getWasteBinById,
  updateWasteBin,
  deleteWasteBin,
  resetWasteBinLevel,
} = require("../controllers/wasteController");
const { protect } = require("../controllers/authController");

router.post("/",protect, createWasteBin);
router.get("/",protect, getWasteBins);

router.put("/reset/:id", protect, resetWasteBinLevel);

router.get("/:id",protect, getWasteBinById);
router.put("/:id",protect, updateWasteBin);
router.delete("/:id",protect, deleteWasteBin);

module.exports = router;
