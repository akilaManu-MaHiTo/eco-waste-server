const Payment = require("../models/Payhere");
const User = require("../models/User");
const Role = require("../models/Role");

exports.notifyPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    console.log("Received payment notification:", paymentData);

    if (!paymentData.payment_id) {
      return res.status(400).send("payment_id is missing");
    }

    const payment = await Payment.findOneAndUpdate(
      { payment_id: paymentData.payment_id },
      paymentData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const userType = await Role.findOne({ userType: "Purchased-User" });
    if (paymentData.custom_1) {
      await User.findByIdAndUpdate(paymentData.custom_1, {
        userType: userType._id,
      });
      console.log(`User ${paymentData.custom_1} upgraded to premium`);
    }

    console.log("Payment processed:", payment.payment_id);

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
