const Garbage = require("../models/Garbage");

exports.createGarbage = async (req, res) => {
  try {
    const { wasteWeight, binId, garbageCategory } = req.body;
    const userId = req.user.id;
    const garbage = await Garbage.create({
      wasteWeight,
      binId: binId._id,
      garbageCategory,
      createdBy: userId,
    });
    res.status(201).json(garbage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateGarbage = async (req, res) => {
  try {
    const { wasteWeight, binId, garbageCategory } = req.body;
    const { id } = req.params;
    const userId = req.user.id;
    const garbage = await Garbage.findByIdAndUpdate(
      id,
      {
        wasteWeight,
        binId: binId._id,
        garbageCategory,
        updatedBy: userId,
      },
      { new: true }
    );
    if (!garbage) {
      return res.status(404).json({ error: "Garbage not found" });
    }
    res.status(201).json(garbage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteGarbage = async (req, res) => {
  try {
    const { id } = req.params;
    const garbage = await Garbage.findByIdAndDelete(id);
    if (!garbage) {
      return res.status(404).json({ error: "Garbage not found" });
    }
    res.status(200).json(garbage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getGarbage = async (req, res) => {
  try {
    const garbage = await Garbage.find()
      .populate("binId")
      .populate("createdBy");
    res.status(200).json(garbage);
  } catch (error) {
    console.error("Error fetching garbage:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch garbage",
    });
  }
};

exports.getTodayGarbage = async (req, res) => {
  try {
    const now = new Date();

    const offsetMinutes = now.getTimezoneOffset(); 
    const localNow = new Date(now.getTime() - offsetMinutes * 60000);

    const startOfDayLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 0, 0, 0, 0);
    const endOfDayLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 23, 59, 59, 999);

    const startOfDayUTC = new Date(startOfDayLocal.getTime() + offsetMinutes * 60000);
    const endOfDayUTC = new Date(endOfDayLocal.getTime() + offsetMinutes * 60000);

    const todayGarbage = await Garbage.find({
      createdAt: { $gte: startOfDayUTC, $lt: endOfDayUTC }
    })
      .populate("binId")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: todayGarbage.length,
      date: localNow.toDateString(),
      garbage: todayGarbage
    });
  } catch (error) {
    console.error("Error fetching today's garbage:", error);
    res.status(500).json({ message: "Server Error: Unable to fetch today's garbage" });
  }
};
