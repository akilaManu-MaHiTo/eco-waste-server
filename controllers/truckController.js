const CollectionRoute = require("../models/CollectionRoute");
const Garbage = require("../models/Garbage");
const Truck = require("../models/Truck");
const User = require("../models/User");

// CREATE Truck
exports.createTruck = async (req, res) => {
  try {
    const {
      capacity,
      status,
      currentLocation,
      assignedRoute,
      latitude,
      longitude,
    } = req.body;
    const userId = req.user.id;

    // Get the last created truck to determine next truckId
    const lastTruck = await Truck.findOne().sort({ createdAt: -1 }); // Sort by creation date
    let nextTruckNumber = 1;

    if (lastTruck && lastTruck.truckId) {
      const match = lastTruck.truckId.match(/TRUCK(\d+)/);
      if (match) {
        nextTruckNumber = parseInt(match[1]) + 1;
      }
    }

    // Format the truck ID (e.g., TRUCK001)
    const truckId = `TRUCK${String(nextTruckNumber).padStart(3, "0")}`;

    // Create new truck
    const newTruck = await Truck.create({
      truckId,
      capacity,
      driver: userId,
      status,
      currentLocation,
      currentWasteLoad: 0,
      latitude,
      longitude,
      assignedRoute,
    });

    res.status(201).json(newTruck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// get all trucks
exports.getTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find()
      .populate("driver", "username email")
      .populate("assignedRoute");
    res.status(200).json(trucks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const mongoose = require("mongoose");

exports.getTruckById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = {};

    // Check if 'id' is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { truckId: id }] };
    } else {
      query = { truckId: id };
    }

    const truck = await Truck.findOne(query)
      .populate("driver", "username email")
      .populate("assignedRoute");

    if (!truck) {
      return res.status(404).json({ error: "Truck not found" });
    }

    res.status(200).json(truck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Truck by driver (user) ID
exports.getTruckByDriverId = async (req, res) => {
  try {
    const driverId = req.user.id;
    const truck = await Truck.find({ driver: driverId })
      .populate("driver", "username email")
      .populate("assignedRoute");

    if (!truck) {
      return res.status(404).json({ error: "Truck not found for this driver" });
    }

    res.status(200).json(truck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE Truck by truckId
exports.updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Truck ID:", id);

    const { capacity, status, currentLocation, latitude, longitude } = req.body;

    // ✅ Use an object as the filter
    const updatedTruck = await Truck.findOneAndUpdate(
      { _id: id }, // or { truckId: id } if you're using custom truckId
      { capacity, status, currentLocation, latitude, longitude },
      { new: true } // returns updated document
    );

    if (!updatedTruck) {
      return res.status(404).json({ error: "Truck not found" });
    }

    res.status(200).json(updatedTruck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE Truck by truckId
exports.deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;

    let query = {};

    // Check if 'id' is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { truckId: id }] };
    } else {
      query = { truckId: id };
    }

    const deletedTruck = await Truck.findOneAndDelete(query);
    if (!deletedTruck) {
      return res.status(404).json({ error: "Truck not found" });
    }
    res.status(200).json({ message: "Truck deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// update the truck status to "In Service"
exports.updateTruckStatusInService = async (req, res) => {
  try {
    const { truckId, collectionId } = req.params;

    const updatedTruck = await Truck.findByIdAndUpdate(
      truckId,
      { status: "In Service" },
      { new: true }
    );

    if (!updatedTruck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const updatedRoute = await CollectionRoute.findByIdAndUpdate(
      collectionId,
      { deliveryStatus: "In Progress" },
      { new: true }
    );

    if (!updatedRoute) {
      return res.status(404).json({ message: "Collection route not found" });
    }

    res.status(200).json({
      message: "Truck marked as available and collection route marked as completed",
      truck: updatedTruck,
      route: updatedRoute,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update truck status" });
  }
};

// update the truck status to "Available"
exports.updateTruckStatusAvailable = async (req, res) => {
  try {
    const { truckId, collectionId } = req.params;

    const updatedTruck = await Truck.findByIdAndUpdate(
      truckId,
      { status: "Available" },
      { new: true }
    );

    if (!updatedTruck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const updatedRoute = await CollectionRoute.findByIdAndUpdate(
      collectionId,
      { deliveryStatus: "Completed" },
      { new: true }
    );

    if (!updatedRoute) {
      return res.status(404).json({ message: "Collection route not found" });
    }

    res.status(200).json({
      message: "Truck marked as available and collection route marked as completed",
      truck: updatedTruck,
      route: updatedRoute,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update truck and collection route" });
  }
};


// update the truck's current waste load when garbage is collected
exports.updateTruckWasteLoad = async (req, res) => {
  try {
    const { truckId, garbageId } = req.params;

    const garbage = await Garbage.findById(garbageId);
    if (!garbage) {
      return res.status(404).json({ message: "Garbage not found" });
    }

    const truck = await Truck.findById(truckId);
    if (!truck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const newWasteLoad = truck.currentWasteLoad + garbage.wasteWeight;

    if (newWasteLoad > truck.capacity) {
      return res.status(400).json({
        message: "Cannot collect garbage — truck capacity exceeded.",
      });
    }

    truck.currentWasteLoad = newWasteLoad;
    await truck.save();

    garbage.wasteWeight = 0;
    garbage.status = "Collected";
    await garbage.save();

    res.status(200).json({
      message: "Truck waste load updated and garbage emptied successfully",
      currentWasteLoad: truck.currentWasteLoad,
      capacity: truck.capacity,
      garbageStatus: garbage.status,
    });
  } catch (err) {
    console.error("Error updating truck waste load:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
