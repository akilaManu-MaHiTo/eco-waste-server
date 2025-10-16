const truckController = require("../controllers/truckController");
const Truck = require("../models/Truck");
const Garbage = require("../models/Garbage");
const CollectionRoute = require("../models/CollectionRoute");

// Mock the models
jest.mock("../models/Truck");
jest.mock("../models/Garbage");
jest.mock("../models/CollectionRoute");

describe("TruckController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response objects
    req = {
      body: {},
      params: {},
      user: { id: "user123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ============================================
  // TEST 1: Create Truck
  // ============================================
  describe("createTruck", () => {
    it("should create a new truck with auto-generated truckId", async () => {
      // Arrange
      req.body = {
        capacity: 1000,
        status: "Available",
        currentLocation: "Warehouse A",
        latitude: 6.9271,
        longitude: 79.8612,
        assignedRoute: "route123",
      };

      const mockLastTruck = {
        truckId: "TRUCK005",
        createdAt: new Date(),
      };

      const mockNewTruck = {
        _id: "truck123",
        truckId: "TRUCK006",
        capacity: 1000,
        driver: "user123",
        status: "Available",
        currentLocation: "Warehouse A",
        currentWasteLoad: 0,
        latitude: 6.9271,
        longitude: 79.8612,
        assignedRoute: "route123",
      };

      // Mock findOne to return the last truck
      Truck.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLastTruck),
      });

      // Mock create to return the new truck
      Truck.create.mockResolvedValue(mockNewTruck);

      // Act
      await truckController.createTruck(req, res);

      // Assert
      expect(Truck.findOne).toHaveBeenCalled();
      expect(Truck.create).toHaveBeenCalledWith({
        truckId: "TRUCK006",
        capacity: 1000,
        driver: "user123",
        status: "Available",
        currentLocation: "Warehouse A",
        currentWasteLoad: 0,
        latitude: 6.9271,
        longitude: 79.8612,
        assignedRoute: "route123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNewTruck);
    });

    it("should handle errors when creating a truck fails", async () => {
      // Arrange
      req.body = {
        capacity: 1000,
        status: "Available",
        currentLocation: "Warehouse A",
      };

      Truck.findOne.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      // Act
      await truckController.createTruck(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 2: Update Truck Waste Load
  // ============================================
  describe("updateTruckWasteLoad", () => {
    it("should update truck waste load and mark garbage as collected", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        garbageId: "garbage456",
      };

      const mockGarbage = {
        _id: "garbage456",
        wasteWeight: 50,
        status: "Pending",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTruck = {
        _id: "truck123",
        truckId: "TRUCK001",
        capacity: 1000,
        currentWasteLoad: 200,
        save: jest.fn().mockResolvedValue(true),
      };

      Garbage.findById.mockResolvedValue(mockGarbage);
      Truck.findById.mockResolvedValue(mockTruck);

      // Act
      await truckController.updateTruckWasteLoad(req, res);

      // Assert
      expect(Garbage.findById).toHaveBeenCalledWith("garbage456");
      expect(Truck.findById).toHaveBeenCalledWith("truck123");
      expect(mockTruck.currentWasteLoad).toBe(250); // 200 + 50
      expect(mockGarbage.status).toBe("Collected");
      expect(mockTruck.save).toHaveBeenCalled();
      expect(mockGarbage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Truck waste load updated and garbage emptied successfully",
        currentWasteLoad: 250,
        capacity: 1000,
        garbageStatus: "Collected",
      });
    });

    it("should return error when truck capacity is exceeded", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        garbageId: "garbage456",
      };

      const mockGarbage = {
        _id: "garbage456",
        wasteWeight: 900,
        status: "Pending",
      };

      const mockTruck = {
        _id: "truck123",
        truckId: "TRUCK001",
        capacity: 1000,
        currentWasteLoad: 200,
      };

      Garbage.findById.mockResolvedValue(mockGarbage);
      Truck.findById.mockResolvedValue(mockTruck);

      // Act
      await truckController.updateTruckWasteLoad(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Cannot collect garbage — truck capacity exceeded.",
      });
    });

    it("should return 404 when garbage is not found", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        garbageId: "garbage456",
      };

      Garbage.findById.mockResolvedValue(null);

      // Act
      await truckController.updateTruckWasteLoad(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Garbage not found" });
    });

    it("should return 404 when truck is not found", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        garbageId: "garbage456",
      };

      const mockGarbage = {
        _id: "garbage456",
        wasteWeight: 50,
        status: "Pending",
      };

      Garbage.findById.mockResolvedValue(mockGarbage);
      Truck.findById.mockResolvedValue(null);

      // Act
      await truckController.updateTruckWasteLoad(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Truck not found" });
    });

    it("should handle errors during waste load update", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        garbageId: "garbage456",
      };

      Garbage.findById.mockRejectedValue(new Error("Database error"));

      // Act
      await truckController.updateTruckWasteLoad(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    });
  });

  // ============================================
  // TEST 3: Get All Trucks
  // ============================================
  describe("getTrucks", () => {
    it("should return all trucks with populated driver and route", async () => {
      // Arrange
      const mockTrucks = [
        {
          _id: "truck1",
          truckId: "TRUCK001",
          capacity: 1000,
          driver: { _id: "user1", username: "driver1", email: "driver1@test.com" },
          assignedRoute: { _id: "route1", name: "Route A" },
          status: "Available",
        },
        {
          _id: "truck2",
          truckId: "TRUCK002",
          capacity: 1500,
          driver: { _id: "user2", username: "driver2", email: "driver2@test.com" },
          assignedRoute: { _id: "route2", name: "Route B" },
          status: "In Service",
        },
      ];

      Truck.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrucks),
        }),
      });

      // Act
      await truckController.getTrucks(req, res);

      // Assert
      expect(Truck.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTrucks);
    });

    it("should handle errors when fetching trucks", async () => {
      // Arrange
      Truck.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      // Act
      await truckController.getTrucks(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 4: Get Truck By ID
  // ============================================
  describe("getTruckById", () => {
    it("should return truck by MongoDB ObjectId", async () => {
      // Arrange
      req.params = { id: "507f1f77bcf86cd799439011" }; // Valid ObjectId

      const mockTruck = {
        _id: "507f1f77bcf86cd799439011",
        truckId: "TRUCK001",
        capacity: 1000,
        driver: { _id: "user1", username: "driver1", email: "driver1@test.com" },
        assignedRoute: { _id: "route1", name: "Route A" },
      };

      Truck.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTruck),
        }),
      });

      // Act
      await truckController.getTruckById(req, res);

      // Assert
      expect(Truck.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTruck);
    });

    it("should return truck by custom truckId", async () => {
      // Arrange
      req.params = { id: "TRUCK001" };

      const mockTruck = {
        _id: "507f1f77bcf86cd799439011",
        truckId: "TRUCK001",
        capacity: 1000,
      };

      Truck.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTruck),
        }),
      });

      // Act
      await truckController.getTruckById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTruck);
    });

    it("should return 404 when truck is not found", async () => {
      // Arrange
      req.params = { id: "TRUCK999" };

      Truck.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act
      await truckController.getTruckById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Truck not found" });
    });

    it("should handle errors when fetching truck by id", async () => {
      // Arrange
      req.params = { id: "TRUCK001" };

      Truck.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      // Act
      await truckController.getTruckById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 5: Get Truck By Driver ID
  // ============================================
  describe("getTruckByDriverId", () => {
    it("should return trucks assigned to the logged-in driver", async () => {
      // Arrange
      req.user.id = "driver123";

      const mockTrucks = [
        {
          _id: "truck1",
          truckId: "TRUCK001",
          driver: { _id: "driver123", username: "driver1", email: "driver1@test.com" },
          assignedRoute: { _id: "route1", name: "Route A" },
        },
      ];

      Truck.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTrucks),
        }),
      });

      // Act
      await truckController.getTruckByDriverId(req, res);

      // Assert
      expect(Truck.find).toHaveBeenCalledWith({ driver: "driver123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTrucks);
    });

    it("should handle errors when fetching truck by driver id", async () => {
      // Arrange
      req.user.id = "driver123";

      Truck.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      // Act
      await truckController.getTruckByDriverId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 6: Update Truck
  // ============================================
  describe("updateTruck", () => {
    it("should update truck details successfully", async () => {
      // Arrange
      req.params = { id: "truck123" };
      req.body = {
        capacity: 1500,
        status: "In Service",
        currentLocation: "Downtown",
        latitude: 6.9271,
        longitude: 79.8612,
      };

      const mockUpdatedTruck = {
        _id: "truck123",
        truckId: "TRUCK001",
        capacity: 1500,
        status: "In Service",
        currentLocation: "Downtown",
        latitude: 6.9271,
        longitude: 79.8612,
      };

      Truck.findOneAndUpdate.mockResolvedValue(mockUpdatedTruck);

      // Act
      await truckController.updateTruck(req, res);

      // Assert
      expect(Truck.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "truck123" },
        {
          capacity: 1500,
          status: "In Service",
          currentLocation: "Downtown",
          latitude: 6.9271,
          longitude: 79.8612,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedTruck);
    });

    it("should return 404 when truck to update is not found", async () => {
      // Arrange
      req.params = { id: "truck999" };
      req.body = { capacity: 1500 };

      Truck.findOneAndUpdate.mockResolvedValue(null);

      // Act
      await truckController.updateTruck(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Truck not found" });
    });

    it("should handle errors when updating truck", async () => {
      // Arrange
      req.params = { id: "truck123" };
      req.body = { capacity: 1500 };

      Truck.findOneAndUpdate.mockRejectedValue(new Error("Database error"));

      // Act
      await truckController.updateTruck(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 7: Delete Truck
  // ============================================
  describe("deleteTruck", () => {
    it("should delete truck by MongoDB ObjectId", async () => {
      // Arrange
      req.params = { id: "507f1f77bcf86cd799439011" };

      const mockDeletedTruck = {
        _id: "507f1f77bcf86cd799439011",
        truckId: "TRUCK001",
      };

      Truck.findOneAndDelete.mockResolvedValue(mockDeletedTruck);

      // Act
      await truckController.deleteTruck(req, res);

      // Assert
      expect(Truck.findOneAndDelete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Truck deleted successfully" });
    });

    it("should delete truck by custom truckId", async () => {
      // Arrange
      req.params = { id: "TRUCK001" };

      const mockDeletedTruck = {
        _id: "507f1f77bcf86cd799439011",
        truckId: "TRUCK001",
      };

      Truck.findOneAndDelete.mockResolvedValue(mockDeletedTruck);

      // Act
      await truckController.deleteTruck(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Truck deleted successfully" });
    });

    it("should return 404 when truck to delete is not found", async () => {
      // Arrange
      req.params = { id: "TRUCK999" };

      Truck.findOneAndDelete.mockResolvedValue(null);

      // Act
      await truckController.deleteTruck(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Truck not found" });
    });

    it("should handle errors when deleting truck", async () => {
      // Arrange
      req.params = { id: "truck123" };

      Truck.findOneAndDelete.mockRejectedValue(new Error("Database error"));

      // Act
      await truckController.deleteTruck(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 8: Update Truck Status to In Service
  // ============================================
  describe("updateTruckStatusInService", () => {
    it("should update truck status to 'In Service' and route to 'In Progress'", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        collectionId: "collection456",
      };

      const mockUpdatedTruck = {
        _id: "truck123",
        truckId: "TRUCK001",
        status: "In Service",
      };

      const mockUpdatedRoute = {
        _id: "collection456",
        deliveryStatus: "In Progress",
      };

      Truck.findByIdAndUpdate.mockResolvedValue(mockUpdatedTruck);
      CollectionRoute.findByIdAndUpdate.mockResolvedValue(mockUpdatedRoute);

      // Act
      await truckController.updateTruckStatusInService(req, res);

      // Assert
      expect(Truck.findByIdAndUpdate).toHaveBeenCalledWith(
        "truck123",
        { status: "In Service" },
        { new: true }
      );
      expect(CollectionRoute.findByIdAndUpdate).toHaveBeenCalledWith(
        "collection456",
        { deliveryStatus: "In Progress" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Truck marked as available and collection route marked as completed",
        truck: mockUpdatedTruck,
        route: mockUpdatedRoute,
      });
    });

    it("should return 404 when truck is not found", async () => {
      // Arrange
      req.params = {
        truckId: "truck999",
        collectionId: "collection456",
      };

      Truck.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await truckController.updateTruckStatusInService(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Truck not found" });
    });

    it("should return 404 when collection route is not found", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        collectionId: "collection999",
      };

      const mockUpdatedTruck = {
        _id: "truck123",
        status: "In Service",
      };

      Truck.findByIdAndUpdate.mockResolvedValue(mockUpdatedTruck);
      CollectionRoute.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await truckController.updateTruckStatusInService(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Collection route not found" });
    });

    it("should handle errors when updating truck status to in service", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        collectionId: "collection456",
      };

      Truck.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

      // Act
      await truckController.updateTruckStatusInService(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Could not update truck status" });
    });
  });

  // ============================================
  // TEST 9: Update Truck Status to Available
  // ============================================
  describe("updateTruckStatusAvailable", () => {
    it("should update truck status to 'Available' and route to 'Completed'", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        collectionId: "collection456",
      };

      const mockUpdatedTruck = {
        _id: "truck123",
        truckId: "TRUCK001",
        status: "Available",
      };

      const mockUpdatedRoute = {
        _id: "collection456",
        deliveryStatus: "Completed",
      };

      Truck.findByIdAndUpdate.mockResolvedValue(mockUpdatedTruck);
      CollectionRoute.findByIdAndUpdate.mockResolvedValue(mockUpdatedRoute);

      // Act
      await truckController.updateTruckStatusAvailable(req, res);

      // Assert
      expect(Truck.findByIdAndUpdate).toHaveBeenCalledWith(
        "truck123",
        { status: "Available" },
        { new: true }
      );
      expect(CollectionRoute.findByIdAndUpdate).toHaveBeenCalledWith(
        "collection456",
        { deliveryStatus: "Completed" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Truck marked as available and collection route marked as completed",
        truck: mockUpdatedTruck,
        route: mockUpdatedRoute,
      });
    });

    it("should return 404 when truck is not found", async () => {
      // Arrange
      req.params = {
        truckId: "truck999",
        collectionId: "collection456",
      };

      Truck.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await truckController.updateTruckStatusAvailable(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Truck not found" });
    });

    it("should return 404 when collection route is not found", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        collectionId: "collection999",
      };

      const mockUpdatedTruck = {
        _id: "truck123",
        status: "Available",
      };

      Truck.findByIdAndUpdate.mockResolvedValue(mockUpdatedTruck);
      CollectionRoute.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await truckController.updateTruckStatusAvailable(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Collection route not found" });
    });

    it("should handle errors when updating truck status to available", async () => {
      // Arrange
      req.params = {
        truckId: "truck123",
        collectionId: "collection456",
      };

      Truck.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

      // Act
      await truckController.updateTruckStatusAvailable(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Could not update truck and collection route" });
    });
  });

  // ============================================
  // TEST 10: Create Truck - Additional Cases
  // ============================================
  describe("createTruck - Additional Edge Cases", () => {
    it("should create first truck with TRUCK001 when no trucks exist", async () => {
      // Arrange
      req.body = {
        capacity: 1000,
        status: "Available",
        currentLocation: "Warehouse A",
        latitude: 6.9271,
        longitude: 79.8612,
        assignedRoute: "route123",
      };

      const mockNewTruck = {
        _id: "truck123",
        truckId: "TRUCK001",
        capacity: 1000,
        driver: "user123",
        status: "Available",
      };

      // Mock findOne to return null (no trucks exist)
      Truck.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      Truck.create.mockResolvedValue(mockNewTruck);

      // Act
      await truckController.createTruck(req, res);

      // Assert
      expect(Truck.create).toHaveBeenCalledWith({
        truckId: "TRUCK001",
        capacity: 1000,
        driver: "user123",
        status: "Available",
        currentLocation: "Warehouse A",
        currentWasteLoad: 0,
        latitude: 6.9271,
        longitude: 79.8612,
        assignedRoute: "route123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle non-standard truckId format gracefully", async () => {
      // Arrange
      req.body = {
        capacity: 1000,
        status: "Available",
        currentLocation: "Warehouse A",
      };

      const mockLastTruck = {
        truckId: "INVALID_FORMAT",
        createdAt: new Date(),
      };

      Truck.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLastTruck),
      });

      Truck.create.mockResolvedValue({
        truckId: "TRUCK001",
        capacity: 1000,
      });

      // Act
      await truckController.createTruck(req, res);

      // Assert
      expect(Truck.create).toHaveBeenCalledWith(
        expect.objectContaining({
          truckId: "TRUCK001", // Should default to TRUCK001
        })
      );
    });
  });
});
