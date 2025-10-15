const Truck = require("../models/Truck");
const User = require("../models/User");

// CREATE Truck
exports.createTruck = async (req, res) => {
  try {
    const { capacity, status, currentLocation, assignedRoute } = req.body;
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
    const trucks = await Truck.find().populate("driver", "name email").populate("assignedRoute");
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

    const truck = await Truck.findOne(query).populate("driver", "name email").populate("assignedRoute");

    if (!truck) {
      return res.status(404).json({ error: "Truck not found" });
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

    const { capacity, status, currentLocation } = req.body;

    // ✅ Use an object as the filter
    const updatedTruck = await Truck.findOneAndUpdate(
      { _id: id }, // or { truckId: id } if you're using custom truckId
      { capacity, status, currentLocation },
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
