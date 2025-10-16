const mongoose = require("mongoose");

const binCollectionRequestSchema = new mongoose.Schema(
  {
    binId: { type: String, required: true },
    userId: { type: String, required: true },
    collectionDate: { type: String, required: true },
    collectionTime: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, required: true },
    status: { type: String,
      enum: ["pending", "dispatched", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "BinCollectionRequest",
  binCollectionRequestSchema
);
