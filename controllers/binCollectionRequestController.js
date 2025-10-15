const BinCollectionRequest = require("../models/BinCollectionRequest");

exports.createBinCollectionRequest = async (req, res) => {
  try {
    const {
      binId,
      userId,
      collectionDate,
      collectionTime,
      latitude,
      longitude,
      orderId,
      amount,
      paymentStatus,
    } = req.body;

    if (
      !binId ||
      !userId ||
      !collectionDate ||
      !collectionTime ||
      !latitude ||
      !longitude ||
      !orderId ||
      !amount ||
      !paymentStatus
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const request = await BinCollectionRequest.create({
      binId,
      userId,
      collectionDate,
      collectionTime,
      latitude,
      longitude,
      orderId,
      amount,
      paymentStatus,
    });

    res.status(201).json({
      success: true,
      message: "Bin collection request created successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error creating bin collection request:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Order ID already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create bin collection request",
      error: error.message,
    });
  }
};
