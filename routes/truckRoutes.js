const express = require("express");
const router = express.Router();

const {
  createTruck,
  getTrucks,
  getTruckById,
  updateTruck,
  deleteTruck,
} = require("../controllers/truckController");
const { protect } = require("../controllers/authController");

router.post("/", protect, createTruck);
router.get("/", protect, getTrucks);

router.get("/:id", protect, getTruckById);
router.put("/:id", protect, updateTruck);
router.delete("/:id", protect, deleteTruck);
module.exports = router;
