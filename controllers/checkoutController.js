const Payment = require("../models/Payhere");
const GarbageRequest = require("../models/GarbageRequest");
const Garbage = require("../models/Garbage");
const PaymentBin = require("../models/PaymentBin");
const WasteBin = require("../models/WasteBin");
/**
 * Processes PayHere callbacks for garbage collection payments and opens a request when successful.
 * @param {import('express').Request} req Express request object containing PayHere payload.
 * @param {import('express').Response} res Express response object used to acknowledge the callback.
 * @returns {Promise<void>} A promise resolving once the notification workflow completes.
 */
exports.notifyPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    console.log("Received payment notification:", paymentData);

    if (!paymentData.payment_id) {
      return res.status(400).send("payment_id is missing");
    }

    const payment = await Payment.create(paymentData);

    if (paymentData.status_code === "2") {
      const requestComplete = await GarbageRequest.create({
        garbageId: paymentData.custom_2,
        dateAndTime: paymentData.custom_1,
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

    if (error?.name === "ValidationError") {
      return res.status(400).send("Invalid payment data");
    }

    if (error?.name === "MongoNetworkError") {
      return res.status(503).send("Database temporarily unavailable");
    }

    res.status(500).send("Server Error");
  }
};

/**
 * Processes PayHere callbacks for bin purchases and updates the purchased bin accordingly.
 * @param {import('express').Request} req Express request object containing PayHere payload.
 * @param {import('express').Response} res Express response object used to acknowledge the callback.
 * @returns {Promise<void>} A promise resolving once the notification workflow completes.
 */
exports.notifyPaymentBin = async (req, res) => {
  try {
    const paymentData = req.body;
    console.log("Received payment notification:", paymentData);

    if (!paymentData.payment_id) {
      return res.status(400).send("payment_id is missing");
    }

    const payment = await PaymentBin.create(paymentData);
    if (paymentData.status_code === "2") {
      const [latitude, longitude] = paymentData.custom_1.split("-");
      const [binId, userId] = paymentData.custom_2.split("-");
      const updatedRequest = await WasteBin.findByIdAndUpdate(
        binId,
        {
          status: "Purchased",
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          owner: userId,
          availability: false,
        },
        { new: true }
      );
      console.log("Bin updated:", updatedRequest?._id);
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

    if (error?.name === "ValidationError") {
      return res.status(400).send("Invalid payment data");
    }

    if (error?.name === "MongoNetworkError") {
      return res.status(503).send("Database temporarily unavailable");
    }

    res.status(500).send("Server Error");
  }
};
