const express = require("express");
const { protect } = require("../controllers/authController");
const {
  createCollectionRoute,
  getAllCollectionRoutes,
  getRoutesByTruckId,
  getPendingRoutes,
  updateDeliveryStatusInProgress,
  updateDeliveryStatusCompleted,
} = require("../controllers/collectionController");
const router = express.Router();

// Server-to-server notification endpoint
router.post("/", protect, createCollectionRoute);
router.get("/", protect, getAllCollectionRoutes);
router.get("/pending", protect, getPendingRoutes);
router.put("/in-progress/:id", protect, updateDeliveryStatusInProgress);
router.put("/completed/:id", protect, updateDeliveryStatusCompleted);
router.get("/:truckId", protect, getRoutesByTruckId);
module.exports = router;
