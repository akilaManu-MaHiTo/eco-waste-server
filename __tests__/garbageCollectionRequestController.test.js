const garbageCollectionRequestController = require("../controllers/garbageCollectionRequestController");
const GarbageCollectionRequest = require("../models/GarbageRequest");
const Garbage = require("../models/Garbage");

// Mock the models
jest.mock("../models/GarbageRequest");
jest.mock("../models/Garbage");

describe("GarbageCollectionRequestController Unit Tests", () => {
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
  // TEST 1: Get Garbage Collection Request (Pending)
  // ============================================
  describe("getGarbageCollectionRequest", () => {
    it("should fetch all pending garbage collection requests with populated data", async () => {
      // Arrange
      const mockRequests = [
        {
          _id: "req1",
          garbageId: {
            _id: "garbage1",
            garbageCategory: "Plastic",
            wasteWeight: 50,
            binId: {
              _id: "bin1",
              binType: "Recycling",
            },
            createdBy: {
              _id: "user1",
              name: "John Doe",
              email: "john@example.com",
            },
          },
          status: "Pending",
          price: 100,
          currency: "USD",
        },
      ];

      const mockPopulate = jest.fn().mockResolvedValue(mockRequests);
      GarbageCollectionRequest.find = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });

      // Act
      await garbageCollectionRequestController.getGarbageCollectionRequest(req, res);

      // Assert
      expect(GarbageCollectionRequest.find).toHaveBeenCalledWith({
        status: "Pending",
      });
      expect(mockPopulate).toHaveBeenCalledWith({
        path: "garbageId",
        populate: [{ path: "binId" }, { path: "createdBy", select: "-password" }],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it("should handle errors when fetching pending requests", async () => {
      // Arrange
      const errorMessage = "Database error";
      const mockPopulate = jest.fn().mockRejectedValue(new Error(errorMessage));
      GarbageCollectionRequest.find = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });

      // Act
      await garbageCollectionRequestController.getGarbageCollectionRequest(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error: Unable to fetch garbage collection requests",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 2: Get Garbage Collection Request (Approved)
  // ============================================
  describe("getGarbageCollectionRequestApproved", () => {
    it("should fetch all approved garbage collection requests with populated data", async () => {
      // Arrange
      const mockRequests = [
        {
          _id: "req2",
          garbageId: {
            _id: "garbage2",
            garbageCategory: "Metal",
            wasteWeight: 100,
            binId: {
              _id: "bin2",
              binType: "Metal",
            },
            createdBy: {
              _id: "user2",
              name: "Jane Smith",
              email: "jane@example.com",
            },
          },
          status: "Approved",
          price: 200,
          currency: "USD",
        },
      ];

      const mockPopulate = jest.fn().mockResolvedValue(mockRequests);
      GarbageCollectionRequest.find = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });

      // Act
      await garbageCollectionRequestController.getGarbageCollectionRequestApproved(req, res);

      // Assert
      expect(GarbageCollectionRequest.find).toHaveBeenCalledWith({
        status: "Approved",
      });
      expect(mockPopulate).toHaveBeenCalledWith({
        path: "garbageId",
        populate: [{ path: "binId" }, { path: "createdBy", select: "-password" }],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it("should handle errors when fetching approved requests", async () => {
      // Arrange
      const errorMessage = "Database connection failed";
      const mockPopulate = jest.fn().mockRejectedValue(new Error(errorMessage));
      GarbageCollectionRequest.find = jest.fn().mockReturnValue({
        populate: mockPopulate,
      });

      // Act
      await garbageCollectionRequestController.getGarbageCollectionRequestApproved(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error: Unable to fetch garbage collection requests",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 3: Get Garbage by Category
  // ============================================
  describe("getGarbageByCategory", () => {
    it("should aggregate and return garbage data by category", async () => {
      // Arrange
      const mockData = [
        {
          _id: "Plastic",
          totalWeight: 150,
          count: 3,
        },
        {
          _id: "Metal",
          totalWeight: 200,
          count: 2,
        },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getGarbageByCategory(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating garbage by category", async () => {
      // Arrange
      const errorMessage = "Aggregation failed";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getGarbageByCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching garbage by category",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 4: Get Requests by Status
  // ============================================
  describe("getRequestsByStatus", () => {
    it("should aggregate and return request counts by status", async () => {
      // Arrange
      const mockData = [
        { _id: "Pending", count: 5 },
        { _id: "Approved", count: 10 },
        { _id: "Rejected", count: 2 },
        { _id: "Completed", count: 8 },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getRequestsByStatus(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating requests by status", async () => {
      // Arrange
      const errorMessage = "Aggregation error";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getRequestsByStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching requests by status",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 5: Get Waste by Bin Type
  // ============================================
  describe("getWasteByBinType", () => {
    it("should aggregate and return waste data by bin type", async () => {
      // Arrange
      const mockData = [
        {
          _id: "Recycling",
          totalWeight: 300,
          totalRequests: 6,
        },
        {
          _id: "Organic",
          totalWeight: 250,
          totalRequests: 5,
        },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getWasteByBinType(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating waste by bin type", async () => {
      // Arrange
      const errorMessage = "Failed to aggregate";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getWasteByBinType(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching waste by bin type",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 6: Get Daily Collections
  // ============================================
  describe("getDailyCollections", () => {
    it("should aggregate and return daily collection statistics", async () => {
      // Arrange
      const mockData = [
        {
          _id: "2025-10-15",
          totalWeight: 500,
          count: 10,
        },
        {
          _id: "2025-10-16",
          totalWeight: 450,
          count: 8,
        },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getDailyCollections(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalWeight: { $sum: "$garbageId.wasteWeight" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating daily collections", async () => {
      // Arrange
      const errorMessage = "Aggregation pipeline error";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getDailyCollections(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching daily collections",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 7: Get Revenue by Category
  // ============================================
  describe("getRevenueByCategory", () => {
    it("should aggregate and return revenue data by category", async () => {
      // Arrange
      const mockData = [
        {
          _id: "Plastic",
          totalRevenue: 500,
          currency: "USD",
        },
        {
          _id: "Metal",
          totalRevenue: 800,
          currency: "USD",
        },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getRevenueByCategory(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating revenue by category", async () => {
      // Arrange
      const errorMessage = "Revenue calculation failed";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getRevenueByCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching revenue by category",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 8: Get Monthly Requests
  // ============================================
  describe("getMonthlyRequests", () => {
    it("should aggregate and return monthly request statistics", async () => {
      // Arrange
      const mockData = [
        {
          year: 2025,
          month: "September",
          totalRequests: 25,
        },
        {
          year: 2025,
          month: "October",
          totalRequests: 30,
        },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getMonthlyRequests(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating monthly requests", async () => {
      // Arrange
      const errorMessage = "Monthly aggregation failed";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getMonthlyRequests(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error: Unable to fetch monthly requests",
        error: errorMessage,
      });
    });
  });

  // ============================================
  // TEST 9: Get Daily Requests by Date and Time
  // ============================================
  describe("getDailyRequestsByDateAndTime", () => {
    it("should aggregate and return daily requests based on dateAndTime field", async () => {
      // Arrange
      const mockData = [
        {
          year: 2025,
          month: 10,
          day: 15,
          totalRequests: 12,
          date: new Date("2025-10-15"),
        },
        {
          year: 2025,
          month: 10,
          day: 16,
          totalRequests: 15,
          date: new Date("2025-10-16"),
        },
      ];

      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue(mockData);

      // Act
      await garbageCollectionRequestController.getDailyRequestsByDateAndTime(req, res);

      // Assert
      expect(GarbageCollectionRequest.aggregate).toHaveBeenCalledWith([
        {
          $addFields: {
            requestDate: {
              $dateFromString: { dateString: "$dateAndTime", format: "%Y-%m-%d %H:%M" }
            }
          }
        },
        {
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it("should handle errors when aggregating daily requests by dateAndTime", async () => {
      // Arrange
      const errorMessage = "Date parsing error";
      GarbageCollectionRequest.aggregate = jest.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      await garbageCollectionRequestController.getDailyRequestsByDateAndTime(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error: Unable to fetch daily requests",
        error: errorMessage,
      });
    });

    it("should return empty array when no requests exist", async () => {
      // Arrange
      GarbageCollectionRequest.aggregate = jest.fn().mockResolvedValue([]);

      // Act
      await garbageCollectionRequestController.getDailyRequestsByDateAndTime(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});
