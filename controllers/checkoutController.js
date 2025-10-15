const Payment = require("../models/Payhere");
const User = require("../models/User");
const Role = require("../models/Role");
const GarbageRequest = require("../models/GarbageRequest");
exports.notifyPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    console.log("Received payment notification:", paymentData);

    if (!paymentData.payment_id) {
      return res.status(400).send("payment_id is missing");
    }
    const payment = Payment.create(paymentData);
    const requestComplete = GarbageRequest.create({
      garbageId: paymentData.custom_2,
      price: paymentData.payhere_amount,
      currency: paymentData.payhere_currency,
      status: "Pending",
    });

    console.log("Payment processed:", payment.payment_id);

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
