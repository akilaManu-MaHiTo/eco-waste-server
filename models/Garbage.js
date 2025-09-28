const mongoose = require("mongoose");

const garbageSchema = new mongoose.Schema(
  {
    wasteWeight: {
      type: Number,
      required: true,
    },
    garbageCategory: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "Pending"
    },
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WasteBin",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Garbage", garbageSchema);
