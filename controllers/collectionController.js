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
