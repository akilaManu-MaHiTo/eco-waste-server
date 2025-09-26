const Payment = require("../models/Payhere");

exports.notifyPayment = async (req, res) => {
  try {
    const paymentData = req.body;

    // Save or update payment
    const payment = await Payment.findOneAndUpdate(
      { payment_id: paymentData.payment_id },
      paymentData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("Payment processed:", payment.payment_id);

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
