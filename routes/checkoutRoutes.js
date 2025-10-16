const express = require("express");
const {
  notifyPayment,
  notifyPaymentBin,
} = require("../controllers/checkoutController");
const router = express.Router();

// Server-to-server notification endpoint
router.post("/payhere-notify", notifyPayment);
router.post("/payhere-notify-bin", notifyPaymentBin);
module.exports = router;
