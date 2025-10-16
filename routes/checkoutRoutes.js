const express = require("express");
const {
  notifyPayment,
  notifyPaymentBin,
} = require("../controllers/checkoutController");
const router = express.Router();

router.post("/payhere-notify", notifyPayment);
router.post("/payhere-notify-bin", notifyPaymentBin);
module.exports = router;
