const Payment = require("../models/Payhere");
const GarbageRequest = require("../models/GarbageRequest");
const Garbage = require("../models/Garbage");
exports.notifyPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    console.log("Received payment notification:", paymentData);

    if (!paymentData.payment_id) {
      return res.status(400).send("payment_id is missing");
    }

    const payment = await Payment.create(paymentData);

    if (paymentData.status_code === '2') {
      const requestComplete = await GarbageRequest.create({
        garbageId: paymentData.custom_2,
        price: paymentData.payhere_amount,
        currency: paymentData.payhere_currency,
        status: "Pending",
      });

      const updateStatus = await Garbage.findByIdAndUpdate(
        paymentData.custom_2,
        { status: "Requested" },
        { new: true }
      );

      console.log("Garbage request created:", requestComplete._id);
    } else {
      console.log(
        "Payment not successful, status code:",
        paymentData.status_code
      );
    }
    console.log("Payment processed:", payment.payment_id);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error saving payment:", error);
    res.status(500).send("Server Error");
  }
};
