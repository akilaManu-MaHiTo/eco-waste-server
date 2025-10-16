const CollectionRoute = require("../models/CollectionRoute");
const GarbageRequest = require("../models/GarbageRequest");

exports.createCollectionRoute = async (req, res) => {
  try {
    const { garbage, truck } = req.body;

    if (!garbage || !Array.isArray(garbage) || garbage.length === 0) {
      return res.status(400).json({ error: "Garbage IDs are required." });
    }
    if (!truck) {
      return res.status(400).json({ error: "Truck ID is required." });
    }

    await GarbageRequest.updateMany(
      { _id: { $in: garbage } },
      { $set: { status: "Approved" } }
    );
    const collectionRoute = new CollectionRoute({ garbage, truck });
    await collectionRoute.save();

    res.status(201).json("Collection route created successfully");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all collection routes
exports.getAllCollectionRoutes = async (req, res) => {
  try {
    const routes = await CollectionRoute.find()
      .populate({
        path: "garbage",
        populate: {
          path: "garbageId",
          populate: [
            { path: "binId" },
            { path: "createdBy", select: "-password" },
          ],
        },
      })
      .populate("truck"); // also populate truck details

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single collection route by ID
exports.getCollectionRouteById = async (req, res) => {
  try {
    const route = await CollectionRoute.findById(req.params.id).populate(
      "garbage"
    );
    if (!route)
      return res.status(404).json({ error: "Collection route not found" });
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a collection route
exports.updateCollectionRoute = async (req, res) => {
  try {
    const { garbage } = req.body;
    const route = await CollectionRoute.findByIdAndUpdate(
      req.params.id,
      { garbage },
      { new: true }
    );
    if (!route)
      return res.status(404).json({ error: "Collection route not found" });
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a collection route
exports.deleteCollectionRoute = async (req, res) => {
  try {
    const route = await CollectionRoute.findByIdAndDelete(req.params.id);
    if (!route)
      return res.status(404).json({ error: "Collection route not found" });
    res.json({ message: "Collection route deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get route by truck ID (only pending delivery)
exports.getRoutesByTruckId = async (req, res) => {
  try {
    const { truckId } = req.params;

    // Step 1: Check if the truck has any assigned routes
    const assignedRoutes = await CollectionRoute.find({ truck: truckId });

    if (!assignedRoutes || assignedRoutes.length === 0) {
      return res
        .status(404)
        .json({ message: "No routes found for this truck." });
    }

    const pendingRoute = await CollectionRoute.findOne({
      truck: truckId,
      deliveryStatus: "Pending",
    })
      .populate({
        path: "garbage",
        populate: {
          path: "garbageId",
          populate: [
            { path: "binId" },
            { path: "createdBy", select: "-password" },
          ],
        },
      })
      .populate("truck");

    // Step 3: Return the pending route (if any)
    if (!pendingRoute) {
      return res
        .status(404)
        .json({ message: "No pending deliveries for this truck." });
    }

    res.json(pendingRoute);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ error: error.message });
  }
};

// get only pending route
exports.getPendingRoutes = async (req, res) => {
  try {
    const pendingRoute = await CollectionRoute.find({
      deliveryStatus: "Pending",
    })
      .populate({
        path: "garbage",
        populate: {
          path: "garbageId",
          populate: [
            { path: "binId" },
            { path: "createdBy", select: "-password" },
          ],
        },
      })
      .populate("truck");

    // Step 3: Return the pending route (if any)
    if (!pendingRoute) {
      return res
        .status(404)
        .json({ message: "No pending deliveries for this truck." });
    }

    res.json(pendingRoute);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ error: error.message });
  }
};

// get only completed route
exports.getCompletedRoutes = async (req, res) => {
  try {
    const pendingRoute = await CollectionRoute.find({
      deliveryStatus: "Completed",
    })
      .populate({
        path: "garbage",
        populate: {
          path: "garbageId",
          populate: [
            { path: "binId" },
            { path: "createdBy", select: "-password" },
          ],
        },
      })
      .populate("truck");

    // Step 3: Return the pending route (if any)
    if (!pendingRoute) {
      return res
        .status(404)
        .json({ message: "No pending deliveries for this truck." });
    }

    res.json(pendingRoute);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ error: error.message });
  }
};

// get In progress route
exports.getInProgressRoutes = async (req, res) => {
try {
    const pendingRoute = await CollectionRoute.find({
      deliveryStatus: "In Progress",
    })
      .populate({
        path: "garbage",
        populate: {
          path: "garbageId",
          populate: [
            { path: "binId" },
            { path: "createdBy", select: "-password" },
          ],
        },
      })
      .populate("truck");

    // Step 3: Return the pending route (if any)
    if (!pendingRoute) {
      return res
        .status(404)
        .json({ message: "No pending deliveries for this truck." });
    }

    res.json(pendingRoute);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ error: error.message });
  }
}


// update delivery status
exports.updateDeliveryStatusInProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateddeliveryStatus = await CollectionRoute.findByIdAndUpdate(
      id,
      { deliveryStatus: "In Progress" },
      { new: true }
    );

    if (!updateddeliveryStatus) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.status(200).json(updateddeliveryStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update delivery status" });
  }
};

exports.updateDeliveryStatusCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const updateddeliveryStatus = await CollectionRoute.findByIdAndUpdate(
      id,
      { deliveryStatus: "Completed" },
      { new: true }
    );

    if (!updateddeliveryStatus) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.status(200).json(updateddeliveryStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update delivery status" });
  }
};