const WasteBin = require("../models/WasteBin");
const Role = require("../models/Role");
const User = require("../models/User");

exports.createWasteBin = async (req, res) => {
  try {
    const { binType, thresholdLevel } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userRole = await Role.findById(user.userType);
    if (!userRole.permissionObject.get("ADMIN_BIN_MNG_CREATE")) {
      return res.status(403).json({
        error: "Forbidden: You don't have permission to create waste bins",
      });
    }
    let prefix = "WB";
    if (binType.toLowerCase() === "plastic") prefix = "PL";
    else if (binType.toLowerCase() === "food") prefix = "FD";
    else if (binType.toLowerCase() === "paper") prefix = "PP";

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const binId = `${prefix}-${randomNum}`;
    const newWasteBin = await WasteBin.create({
      binId,
      binType,
      thresholdLevel,
    });

    res.status(201).json(newWasteBin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWasteBins = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userRole = await Role.findById(user.userType);
    if (!userRole.permissionObject.get("ADMIN_BIN_MNG_VIEW")) {
      return res.status(403).json({
        error: "Forbidden: You don't have permission to view waste bins",
      });
    }
    const bins = await WasteBin.find();
    res.status(200).json(bins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWasteBinById = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userRole = await Role.findById(user.userType);
    if (!userRole.permissionObject.get("ADMIN_BIN_MNG_VIEW")) {
      return res.status(403).json({
        error: "Forbidden: You don't have permission to view waste bins",
      });
    }
    const { id } = req.params;
    const bin = await WasteBin.findOne({ $or: [{ _id: id }, { binId: id }] });

    if (!bin) return res.status(404).json({ error: "WasteBin not found" });

    res.status(200).json(bin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateWasteBin = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, currentWasteLevel, thresholdLevel, availability } =
      req.body;

    const userId = req.user.id;
    const user = await User.findById(userId);
    const userRole = await Role.findById(user.userType);

    if (!userRole.permissionObject.get("ADMIN_BIN_MNG_EDIT")) {
      return res.status(403).json({
        error: "Forbidden: You don't have permission to update waste bins",
      });
    }

    const updatedWasteBin = await WasteBin.findByIdAndUpdate(
      id,
      { location, currentWasteLevel, thresholdLevel, availability },
      { new: true, runValidators: true }
    );

    if (!updatedWasteBin) {
      return res.status(404).json({ error: "Waste bin not found" });
    }

    res.status(200).json(updatedWasteBin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteWasteBin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userRole = await Role.findById(user.userType);
    if (!userRole.permissionObject.get("ADMIN_BIN_MNG_DELETE")) {
      return res.status(403).json({
        error: "Forbidden: You don't have permission to delete waste bins",
      });
    }
    const deletedBin = await WasteBin.findOneAndDelete({
      $or: [{ _id: id }, { binId: id }],
    });

    if (!deletedBin)
      return res.status(404).json({ error: "WasteBin not found" });

    res.status(200).json({ message: "WasteBin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetWasteBinLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedWasteBin = await WasteBin.findByIdAndUpdate(
      id,
      { currentWasteLevel: 0 },
      { new: true }
    );
    if (!updatedWasteBin) {
      return res.status(404).json({ error: "Waste bin not found" });
    }
    res.status(200).json(updatedWasteBin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getWasteBinsByOwner = async (req, res) => {
  try {
    const userId = req.user.id;
    const category = req.params.category;
    const bins = await WasteBin.find({
      owner: userId,
      binType: category,
    });
    res.status(200).json(bins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
