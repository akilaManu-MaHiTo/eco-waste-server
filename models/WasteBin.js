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
      enum: ["food", "paper", "plastic"],
    },
    availability: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WasteBin", wasteBinSchema);

