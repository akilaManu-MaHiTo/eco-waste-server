const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissionObject: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
