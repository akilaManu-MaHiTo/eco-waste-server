const mongoose = require("mongoose");

const collectionRouteSchema = new mongoose.Schema(
  {
    garbage: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GarbageRequest",
        required: true,
      },
    ],
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollectionRoute", collectionRouteSchema);
