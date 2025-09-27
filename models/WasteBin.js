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
    },
    currentWasteLevel: { 
        type: Number, 
        required: false 
    },
    thresholdLevel: { 
        type: Number, 
        required: false 
    },
    binType: { 
        type: String, 
        required: true, 
        enum: ["food", "paper", "plastic"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WasteBin", wasteBinSchema);
