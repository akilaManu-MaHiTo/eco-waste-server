const BinCollectionRequest = require("../models/BinCollectionRequest");
const mongoose = require('mongoose');

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

exports.getAllBinCollectionRequests = async (req, res) => {
  try {
    const requests = await BinCollectionRequest.find()
      .populate('binId')      
      .populate('userId')    
      .sort({ createdAt: -1 }); 
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bin collection requests' 
    });
  }
};

exports.getBinCollectionRequestsByBinId = async (req, res) => {
  try {
    const { binId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(binId)) {
      return res.status(400).json({ 
        error: 'Invalid bin ID format' 
      });
    }
    const requests = await BinCollectionRequest.find({ binId })
      .populate('userId')
      .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch requests for this bin' 
    });
  }
};

exports.updateBinCollectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        error: 'Invalid request ID format' 
      });
    }
    const updatedRequest = await BinCollectionRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('binId')
      .populate('userId');
    
    if (!updatedRequest) {
      return res.status(404).json({ 
        error: 'Request not found' 
      });
    }
    
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to update request' 
    });
  }
};
