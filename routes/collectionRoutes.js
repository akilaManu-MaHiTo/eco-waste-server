const express = require("express");
const { protect } = require("../controllers/authController");
const {
  createCollectionRoute,
  getAllCollectionRoutes,
  getRoutesByTruckId,
} = require("../controllers/collectionController");
const router = express.Router();

// Server-to-server notification endpoint
router.post("/", protect, createCollectionRoute);
router.get("/", protect, getAllCollectionRoutes);
router.get("/:truckId", protect, getRoutesByTruckId);
module.exports = router;
