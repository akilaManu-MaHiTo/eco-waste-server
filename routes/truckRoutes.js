const express = require("express");
const router = express.Router();

const {
  createTruck,
  getTrucks,
  getTruckById,
  updateTruck,
  deleteTruck,
  getTruckByDriverId,
  updateTruckStatusAvailable,
  updateTruckStatusInService,
  updateTruckWasteLoad,
} = require("../controllers/truckController");
const { protect } = require("../controllers/authController");

router.post("/", protect, createTruck);
router.get("/", protect, getTrucks);

router.get("/driver/:driverId", protect, getTruckByDriverId);

router.put("/collect/:truckId/:garbageId", protect, updateTruckWasteLoad);

router.put("/available/:truckId/:collectionId", protect, updateTruckStatusAvailable);
router.put("/inservice/:truckId/:collectionId", protect, updateTruckStatusInService);

router.get("/:id", protect, getTruckById);

router.put("/:id", protect, updateTruck);
router.delete("/:id", protect, deleteTruck);

module.exports = router;
