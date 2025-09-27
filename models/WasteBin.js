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
      required: true,
    },
    currentWasteLevel: { 
        type: Number, 
        required: true 
    },
    thresholdLevel: { 
        type: Number, 
        required: true 
    },
    binType: { 
        type: String, 
        required: true, 
        enum: ["food", "paper", "plastic"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WasteBin", wasteBinSchema);
