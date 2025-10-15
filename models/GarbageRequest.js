const mongoose = require("mongoose");

const garbageRequestSchema = new mongoose.Schema(
  {
    garbageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garbage",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected", "Completed"],
    },
    dateAndTime: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GarbageRequest", garbageRequestSchema);
