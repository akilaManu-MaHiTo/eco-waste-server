const mongoose = require("mongoose");
const Garbage = require("../models/Garbage");
const User = require("../models/User");
const Bin = require("../models/WasteBin");

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

    const startOfDayLocal = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      localNow.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDayLocal = new Date(
      localNow.getFullYear(),
      localNow.getMonth(),
      localNow.getDate(),
      23,
      59,
      59,
      999
    );

    const startOfDayUTC = new Date(
      startOfDayLocal.getTime() + offsetMinutes * 60000
    );
    const endOfDayUTC = new Date(
      endOfDayLocal.getTime() + offsetMinutes * 60000
    );

    const todayGarbage = await Garbage.find({
      createdAt: { $gte: startOfDayUTC, $lt: endOfDayUTC },
    })
      .populate("binId")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: todayGarbage.length,
      date: localNow.toDateString(),
      garbage: todayGarbage,
    });
  } catch (error) {
    console.error("Error fetching today's garbage:", error);
    res
      .status(500)
      .json({ message: "Server Error: Unable to fetch today's garbage" });
  }
};

exports.getCurrentSummary = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user identifier" });
    }

    const userIdStr = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userIdStr);

    const { startDate, endDate, category } = req.query;

    const userDoc = await User.findById(userObjectId)
      .select("username email")
      .lean();

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    let rangeStart;
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({ message: "Invalid startDate" });
      }
      parsedStart.setHours(0, 0, 0, 0);
      rangeStart = parsedStart;
    } else {
      const earliest = await Garbage.findOne({
        $or: [{ createdBy: userObjectId }, { createdBy: userIdStr }],
      })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean();

      if (!earliest) {
        return res.status(200).json({
          user: {
            _id: userDoc._id,
            name: userDoc.username,
            email: userDoc.email,
          },
          range: null,
          totals: { totalWeight: 0, count: 0, lastDepositAt: null },
          summary: [],
        });
      }

      rangeStart = new Date(earliest.createdAt);
      rangeStart.setHours(0, 0, 0, 0);
    }

    let rangeEnd;
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (Number.isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ message: "Invalid endDate" });
      }
      parsedEnd.setHours(23, 59, 59, 999);
      rangeEnd = parsedEnd;
    } else {
      rangeEnd = new Date();
    }

    if (rangeEnd < rangeStart) {
      return res
        .status(400)
        .json({ message: "endDate must be on or after startDate" });
    }

    const matchConditions = [
      { createdAt: { $gte: rangeStart, $lte: rangeEnd } },
      {
        $or: [
          { createdBy: userObjectId },
          { $expr: { $eq: [{ $toString: "$createdBy" }, userIdStr] } },
        ],
      },
    ];

    if (category) {
      matchConditions.push({ garbageCategory: category });
    }

    const summary = await Garbage.aggregate([
      { $match: { $and: matchConditions } },
      {
        $group: {
          _id: "$garbageCategory",
          totalWeight: { $sum: "$wasteWeight" },
          count: { $sum: 1 },
          lastDepositAt: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalWeight: 1,
          count: 1,
          lastDepositAt: 1,
        },
      },
      { $sort: { category: 1 } },
    ]);

    const totals = summary.reduce(
      (acc, entry) => {
        acc.totalWeight += entry.totalWeight || 0;
        acc.count += entry.count || 0;
        if (
          entry.lastDepositAt &&
          (!acc.lastDepositAt || entry.lastDepositAt > acc.lastDepositAt)
        ) {
          acc.lastDepositAt = entry.lastDepositAt;
        }
        return acc;
      },
      { totalWeight: 0, count: 0, lastDepositAt: null }
    );

    const formatted = summary.map((entry) => ({
      category: entry.category,
      totalWeight: Math.round((entry.totalWeight || 0) * 100) / 100,
      count: entry.count || 0,
      lastDepositAt: entry.lastDepositAt
        ? entry.lastDepositAt.toISOString()
        : null,
    }));

    return res.status(200).json({
      user: {
        _id: userDoc._id,
        name: userDoc.username,
        email: userDoc.email,
      },
      range: {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
      },
      totals: {
        totalWeight: Math.round(totals.totalWeight * 100) / 100,
        count: totals.count,
        lastDepositAt: totals.lastDepositAt ? totals.lastDepositAt.toISOString() : null,
      },
      summary: formatted,
    });
  } catch (err) {
    console.error("Error building summary:", err);
    res.status(500).json({ message: "Server Error: Unable to build summary" });
  }
};


exports.getGarbageTrend = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user identifier" });
    }

    const userIdStr = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userIdStr);
    const { startDate, endDate, category } = req.query;

    let rangeEnd;
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (Number.isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ message: "Invalid endDate" });
      }
      parsedEnd.setHours(23, 59, 59, 999);
      rangeEnd = parsedEnd;
    } else {
      rangeEnd = new Date();
      rangeEnd.setHours(23, 59, 59, 999);
    }

    let rangeStart;
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({ message: "Invalid startDate" });
      }
      parsedStart.setHours(0, 0, 0, 0);
      rangeStart = parsedStart;
    } else {
      rangeStart = new Date(rangeEnd);
      rangeStart.setHours(0, 0, 0, 0);
      rangeStart.setDate(rangeStart.getDate() - 29);
    }

    if (rangeEnd < rangeStart) {
      return res
        .status(400)
        .json({ message: "endDate must be on or after startDate" });
    }

    const matchConditions = [
      { createdAt: { $gte: rangeStart, $lte: rangeEnd } },
      {
        $or: [
          { createdBy: userObjectId },
          { $expr: { $eq: [{ $toString: "$createdBy" }, userIdStr] } },
        ],
      },
    ];

    if (category) {
      matchConditions.push({ garbageCategory: category });
    }

    const aggregated = await Garbage.aggregate([
      { $match: { $and: matchConditions } },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          category: "$garbageCategory",
          weight: "$wasteWeight",
        },
      },
      {
        $group: {
          _id: { date: "$date", category: "$category" },
          totalWeight: { $sum: "$weight" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          categories: {
            $push: {
              category: "$_id.category",
              totalWeight: "$totalWeight",
              count: "$count",
            },
          },
        },
      },
      { $project: { _id: 0, date: "$_id", categories: 1 } },
      { $sort: { date: 1 } },
    ]);

    const trendMap = new Map();
    aggregated.forEach((entry) => {
      const categories = entry.categories.map((c) => ({
        category: c.category,
        totalWeight: Math.round((c.totalWeight || 0) * 100) / 100,
        count: c.count || 0,
      }));

      const totalWeight = categories.reduce(
        (sum, c) => sum + (c.totalWeight || 0),
        0
      );
      const count = categories.reduce((sum, c) => sum + (c.count || 0), 0);

      trendMap.set(entry.date, {
        categories,
        totalWeight: Math.round(totalWeight * 100) / 100,
        count,
      });
    });

    const trend = [];
    for (let cursor = new Date(rangeStart); cursor <= rangeEnd; ) {
      const isoDate = cursor.toISOString().split("T")[0];
      const dayData = trendMap.get(isoDate);

      if (dayData) {
        trend.push({ date: isoDate, ...dayData });
      } else {
        trend.push({
          date: isoDate,
          categories: [],
          totalWeight: 0,
          count: 0,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
    }

    return res.status(200).json({
      startDate: rangeStart.toISOString().split("T")[0],
      endDate: rangeEnd.toISOString().split("T")[0],
      trend,
    });
  } catch (err) {
    console.error("Error building trend:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

/**
 * Get current garbage level as percentage.
 */
exports.getCurrentGarbageLevel = async (req, res) => {
  try {
    const { userId, category } = req.query;

    // Validate userId if provided
    const filters = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
      }
      filters.createdBy = mongoose.Types.ObjectId(userId);
    }
    if (category) filters.garbageCategory = category;

    const DEFAULT_CAPACITY =
      parseFloat(process.env.DEFAULT_BIN_CAPACITY) || 100;

    // Aggregation: sum waste per bin, lookup bin to get capacity/name
    const pipeline = [
      { $match: filters },
      {
        $group: {
          _id: "$binId",
          totalWeight: { $sum: "$wasteWeight" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "bins", // adjust if your collection name differs
          localField: "_id",
          foreignField: "_id",
          as: "bin",
        },
      },
      { $unwind: { path: "$bin", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          binId: "$_id",
          binName: { $ifNull: ["$bin.name", null] },
          totalWeight: 1,
          capacity: {
            $cond: [
              {
                $or: [
                  { $eq: ["$bin.capacity", null] },
                  { $eq: ["$bin.capacity", 0] },
                ],
              },
              DEFAULT_CAPACITY,
              "$bin.capacity",
            ],
          },
          count: 1,
        },
      },
      {
        $addFields: {
          percentFilled: {
            $min: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $eq: ["$capacity", 0] },
                      0,
                      { $divide: ["$totalWeight", "$capacity"] },
                    ],
                  },
                  100,
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { percentFilled: -1 } },
    ];

    const bins = await Garbage.aggregate(pipeline);

    // compute overall percent: sum(totalWeight) / sum(capacity)
    const totalWeightAll = bins.reduce((s, b) => s + (b.totalWeight || 0), 0);
    const totalCapacityAll = bins.reduce(
      (s, b) => s + (b.capacity || DEFAULT_CAPACITY),
      0
    );
    const overallPercent =
      totalCapacityAll === 0
        ? 0
        : Math.min((totalWeightAll / totalCapacityAll) * 100, 100);

    // Round numbers for client readability
    const formattedBins = bins.map((b) => ({
      binId: b.binId,
      binName: b.binName,
      totalWeight: Math.round((b.totalWeight || 0) * 100) / 100,
      capacity: Math.round((b.capacity || DEFAULT_CAPACITY) * 100) / 100,
      percentFilled: Math.round((b.percentFilled || 0) * 100) / 100,
      deposits: b.count || 0,
    }));

    return res.status(200).json({
      overall: {
        totalWeight: Math.round(totalWeightAll * 100) / 100,
        totalCapacity: Math.round(totalCapacityAll * 100) / 100,
        percentFilled: Math.round(overallPercent * 100) / 100,
      },
      bins: formattedBins,
    });
  } catch (err) {
    console.error("Error computing garbage level:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};
