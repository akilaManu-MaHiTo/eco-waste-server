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
