const mongoose = require("mongoose");

const truckSchema = new mongoose.Schema(
  {
    truckId: {
      type: String,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "In Service", "Under Maintenance"],
      default: "Active",
    },
    currentLocation: {
      type: String,
      default: null,
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garbage",
      default: null,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Truck", truckSchema);
