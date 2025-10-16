const GarbageCollectionRequest = require("../models/GarbageRequest");
const Garbage = require("../models/Garbage");

exports.getGarbageCollectionRequest = async (req, res) => {
  try {
    const requests = await GarbageCollectionRequest.find().populate({
      path: "garbageId",
      populate: [{ path: "binId" }, { path: "createdBy", select: "-password" }],
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching garbage collection requests:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch garbage collection requests",
      error: error.message,
    });
  }
};

// GET /api/dashboard/garbage-by-category
exports.getGarbageByCategory = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        $lookup: {
          from: "garbages",
          localField: "garbageId",
          foreignField: "_id",
          as: "garbage",
        },
      },
      { $unwind: "$garbage" },
      {
        $group: {
          _id: "$garbage.garbageCategory",
          totalWeight: { $sum: "$garbage.wasteWeight" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching garbage by category", error: error.message });
  }
};

// GET /api/dashboard/requests-by-status
exports.getRequestsByStatus = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests by status", error: error.message });
  }
};

// GET /api/dashboard/waste-by-bin-type
exports.getWasteByBinType = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        $lookup: {
          from: "garbages",
          localField: "garbageId",
          foreignField: "_id",
          as: "garbage",
        },
      },
      { $unwind: "$garbage" },
      {
        $lookup: {
          from: "bins",
          localField: "garbage.binId",
          foreignField: "_id",
          as: "bin",
        },
      },
      { $unwind: "$bin" },
      {
        $group: {
          _id: "$bin.binType",
          totalWeight: { $sum: "$garbage.wasteWeight" },
          totalRequests: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching waste by bin type", error: error.message });
  }
};

// GET /api/dashboard/daily-collections
exports.getDailyCollections = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalWeight: { $sum: "$garbageId.wasteWeight" }, // fallback if stored inline
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching daily collections", error: error.message });
  }
};

// GET /api/dashboard/revenue-by-category
exports.getRevenueByCategory = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        $lookup: {
          from: "garbages",
          localField: "garbageId",
          foreignField: "_id",
          as: "garbage",
        },
      },
      { $unwind: "$garbage" },
      {
        $group: {
          _id: "$garbage.garbageCategory",
          totalRevenue: { $sum: "$price" },
          currency: { $first: "$currency" },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching revenue by category", error: error.message });
  }
};

// GET /api/dashboard/monthly-requests
exports.getMonthlyRequests = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRequests: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: {
            $arrayElemAt: [
              [
                "",
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              "$_id.month",
            ],
          },
          totalRequests: 1,
        },
      },
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching monthly requests:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch monthly requests",
      error: error.message,
    });
  }
};

// GET /api/dashboard/daily-requests
// GET /api/dashboard/daily-requests
exports.getDailyRequestsByDateAndTime = async (req, res) => {
  try {
    const data = await GarbageCollectionRequest.aggregate([
      {
        // Convert dateAndTime string to Date object
        $addFields: {
          requestDate: {
            $dateFromString: { dateString: "$dateAndTime", format: "%Y-%m-%d %H:%M" }
          }
        }
      },
      {
        // Group by year, month, day
        $group: {
          _id: {
            year: { $year: "$requestDate" },
            month: { $month: "$requestDate" },
            day: { $dayOfMonth: "$requestDate" }
          },
          totalRequests: { $sum: 1 }
        }
      },
      { 
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } 
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day",
          totalRequests: 1,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day"
            }
          }
        }
      }
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching daily requests by dateAndTime:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch daily requests",
      error: error.message
    });
  }
};


