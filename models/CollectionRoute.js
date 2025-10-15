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
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollectionRoute", collectionRouteSchema);
