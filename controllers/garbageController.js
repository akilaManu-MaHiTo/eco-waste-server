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


exports.getCurrentSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: now },
        },
      },
    ];

    if (req.query.mine === "true") {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      pipeline.unshift({
        $match: { createdBy: mongoose.Types.ObjectId(req.user.id) },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: { user: "$createdBy", category: "$garbageCategory" },
          totalWeight: { $sum: "$wasteWeight" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          user: { _id: "$user._id", name: "$user.name", email: "$user.email" },
          category: "$_id.category",
          totalWeight: 1,
          count: 1,
        },
      }
    );

    const summary = await Garbage.aggregate(pipeline);
    res.status(200).json(summary);
  } catch (err) {
    console.error("Error building summary:", err);
    res.status(500).json({ message: "Server Error: Unable to build summary" });
  }
};


// exports.getGarbageTrend = async (req, res) => {
//   try {
//     // Accept either:
//     // - userIds=<id,id,...>
//     // - role=<role>
//     // If none provided, fall back to users that have garbage records.
//     const { userIds: userIdsCsv, role } = req.query;
//     let userIds = [];

//     if (userIdsCsv) {
//       userIds = userIdsCsv
//         .split(",")
//         .map((s) => s.trim())
//         .filter(Boolean)
//         .map((id) => mongoose.Types.ObjectId(id));
//     } else if (role) {
//       const users = await User.find({ role }).select("_id").lean();
//       userIds = users.map((u) => u._id);
//     } else {
//       // fallback: use users that actually have garbage records
//       const ids = await Garbage.distinct("createdBy");
//       userIds = ids || [];
//     }

//     // If still no userIds, return empty result
//     if (!userIds || userIds.length === 0) {
//       return res.status(200).json({ startDate: null, endDate: null, trend: [] });
//     }

//     // find earliest garbage record for these users
//     const first = await Garbage.findOne({ createdBy: { $in: userIds } })
//       .sort({ createdAt: 1 })
//       .select("createdAt")
//       .lean();

//     if (!first) {
//       return res.status(200).json({ startDate: null, endDate: null, trend: [] });
//     }

//     const start = new Date(first.createdAt);
//     start.setHours(0, 0, 0, 0);
//     const end = new Date();
//     end.setHours(23, 59, 59, 999);

//     // aggregate daily totals per category (YYYY-MM-DD)
//     const pipeline = [
//       {
//         $match: {
//           createdBy: { $in: userIds },
//           createdAt: { $gte: start, $lte: end },
//         },
//       },
//       {
//         $project: {
//           date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           garbageCategory: 1,
//           wasteWeight: 1,
//         },
//       },
//       {
//         $group: {
//           _id: { date: "$date", category: "$garbageCategory" },
//           totalWeight: { $sum: "$wasteWeight" },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id.date",
//           categories: {
//             $push: {
//               category: "$_id.category",
//               totalWeight: "$totalWeight",
//               count: "$count",
//             },
//           },
//         },
//       },
//       { $project: { _id: 0, date: "$_id", categories: 1 } },
//       { $sort: { date: 1 } },
//     ];

//     const aggResult = await Garbage.aggregate(pipeline);

//     // build map for quick lookup
//     const trendMap = {};
//     aggResult.forEach((d) => {
//       trendMap[d.date] = d.categories;
//     });

//     // helper: list all dates from start..end as YYYY-MM-DD
//     const dates = [];
//     for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//       const iso = d.toISOString().split("T")[0];
//       dates.push(iso);
//     }

//     const trend = dates.map((date) => ({
//       date,
//       categories: trendMap[date] || [],
//     }));

//     return res.status(200).json({
//       startDate: start.toISOString().split("T")[0],
//       endDate: end.toISOString().split("T")[0],
//       trend,
//     });
//   } catch (err) {
//     console.error("Error building trend:", err);
//     return res.status(500).json({ error: "Server Error" });
//   }
// };

// ...existing code...
exports.getGarbageTrend = async (req, res) => {
  try {
    const { userIds: userIdsCsv, role } = req.query;
    let userIds = [];

    if (userIdsCsv) {
      userIds = userIdsCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => mongoose.Types.ObjectId(id));
    } else if (role) {
      const users = await User.find({ role }).select("_id").lean();
      userIds = users.map((u) => u._id);
    } else {
      const ids = await Garbage.distinct("createdBy");
      userIds = ids || [];
    }

    if (!userIds || userIds.length === 0) {
      return res.status(200).json({ startDate: null, endDate: null, trend: [] });
    }

    const first = await Garbage.findOne({ createdBy: { $in: userIds } })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean();

    if (!first) {
      return res.status(200).json({ startDate: null, endDate: null, trend: [] });
    }

    const start = new Date(first.createdAt);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          createdBy: { $in: userIds },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          garbageCategory: 1,
          wasteWeight: 1,
          binId: 1,
        },
      },
      {
        $group: {
          _id: { date: "$date", category: "$garbageCategory", binId: "$binId" },
          totalWeight: { $sum: "$wasteWeight" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          categories: {
            $push: {
              category: "$_id.category",
              binId: "$_id.binId",
              totalWeight: "$totalWeight",
              count: "$count",
            },
          },
        },
      },
      { $project: { _id: 0, date: "$_id", categories: 1 } },
      { $sort: { date: 1 } },

      // optional: populate bin details from 'bins' collection if you have one
      { $unwind: { path: "$categories", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "bins", // adjust collection name if different
          localField: "categories.binId",
          foreignField: "_id",
          as: "categories.bin",
        },
      },
      { $unwind: { path: "$categories.bin", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$date",
          categories: { $push: "$categories" },
        },
      },
      { $project: { _id: 0, date: "$_id", categories: 1 } },
      { $sort: { date: 1 } },
    ];

    const aggResult = await Garbage.aggregate(pipeline);

    const trendMap = {};
    aggResult.forEach((d) => {
      trendMap[d.date] = d.categories.map((c) => {
        // convert bin object id to string if not populated; keep populated bin doc if available
        const binInfo = c.bin ? c.bin : c.binId;
        return {
          category: c.category,
          bin: binInfo,
          totalWeight: c.totalWeight,
          count: c.count,
        };
      });
    });

    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }

    const trend = dates.map((date) => ({
      date,
      categories: trendMap[date] || [],
    }));

    return res.status(200).json({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      trend,
    });
  } catch (err) {
    console.error("Error building trend:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

/**
 * Get current garbage level as percentage.
 * - Optional query params:
 *   - userId (filter by user)
 *   - category (filter by garbageCategory)
 * - Returns per-bin totals (totalWeight / capacity) and overall percent.
 *
 * Notes:
 * - Uses bin.capacity if present; falls back to DEFAULT_BIN_CAPACITY env (kg) or 100 kg.
 * - Caps percent at 100%.
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

    const DEFAULT_CAPACITY = parseFloat(process.env.DEFAULT_BIN_CAPACITY) || 100;

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
              { $or: [{ $eq: ["$bin.capacity", null] }, { $eq: ["$bin.capacity", 0] }] },
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
                  { $cond: [{ $eq: ["$capacity", 0] }, 0, { $divide: ["$totalWeight", "$capacity"] }] },
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
    const totalCapacityAll = bins.reduce((s, b) => s + (b.capacity || DEFAULT_CAPACITY), 0);
    const overallPercent =
      totalCapacityAll === 0 ? 0 : Math.min(((totalWeightAll / totalCapacityAll) * 100), 100);

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
