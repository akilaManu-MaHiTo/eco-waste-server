const mongoose = require("mongoose");

const wasteBinSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: false,
      default: "warehouse",
    },
    latitude: { type: Number },
    longitude: { type: Number },
    currentWasteLevel: {
      type: Number,
      required: false,
      default: 0,
    },
    thresholdLevel: {
      type: Number,
      required: false,
    },
    binType: {
      type: String,
      required: true,
      enum: ["Food", "Paper", "Plastic"],
    },
    availability: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["NotPurchased", "Purchased", "Maintenance"],
      default: "NotPurchased",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WasteBin", wasteBinSchema);
