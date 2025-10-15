const express = require("express");
const { protect } = require("../controllers/authController");
const {
  createCollectionRoute,
  getAllCollectionRoutes,
} = require("../controllers/collectionController");
const router = express.Router();

// Server-to-server notification endpoint
router.post("/", protect, createCollectionRoute);
router.get("/", protect, getAllCollectionRoutes);
module.exports = router;
