const wasteController = require("../controllers/wasteController");
const WasteBin = require("../models/WasteBin");
const Role = require("../models/Role");
const User = require("../models/User");

// Mock the models
jest.mock("../models/WasteBin");
jest.mock("../models/Role");
jest.mock("../models/User");

describe("WasteController Unit Tests", () => {
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
  // TEST 1: Create WasteBin
  // ============================================
  describe("createWasteBin", () => {
    it("should create a waste bin with correct permissions", async () => {
      // Arrange
      req.body = {
        binType: "Plastic",
        thresholdLevel: 80,
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_CREATE", true]]),
      };

      const mockCreatedBin = {
        _id: "bin123",
        binId: "PL-1234",
        binType: "Plastic",
        thresholdLevel: 80,
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.create.mockResolvedValue(mockCreatedBin);

      // Act
      await wasteController.createWasteBin(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(Role.findById).toHaveBeenCalledWith("role123");
      expect(WasteBin.create).toHaveBeenCalledWith(
        expect.objectContaining({
          binId: expect.stringMatching(/^PL-\d{4}$/),
          binType: "Plastic",
          thresholdLevel: 80,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedBin);
    });

    it("should create a Food waste bin with FD prefix", async () => {
      // Arrange
      req.body = {
        binType: "Food",
        thresholdLevel: 75,
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_CREATE", true]]),
      };

      const mockCreatedBin = {
        _id: "bin124",
        binId: "FD-5678",
        binType: "Food",
        thresholdLevel: 75,
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.create.mockResolvedValue(mockCreatedBin);

      // Act
      await wasteController.createWasteBin(req, res);

      // Assert
      expect(WasteBin.create).toHaveBeenCalledWith(
        expect.objectContaining({
          binId: expect.stringMatching(/^FD-\d{4}$/),
          binType: "Food",
          thresholdLevel: 75,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create a Paper waste bin with PP prefix", async () => {
      // Arrange
      req.body = {
        binType: "Paper",
        thresholdLevel: 70,
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_CREATE", true]]),
      };

      const mockCreatedBin = {
        _id: "bin125",
        binId: "PP-9012",
        binType: "Paper",
        thresholdLevel: 70,
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.create.mockResolvedValue(mockCreatedBin);

      // Act
      await wasteController.createWasteBin(req, res);

      // Assert
      expect(WasteBin.create).toHaveBeenCalledWith(
        expect.objectContaining({
          binId: expect.stringMatching(/^PP-\d{4}$/),
          binType: "Paper",
          thresholdLevel: 70,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 403 when user lacks create permission", async () => {
      // Arrange
      req.body = {
        binType: "Plastic",
        thresholdLevel: 80,
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_CREATE", false]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);

      // Act
      await wasteController.createWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden: You don't have permission to create waste bins",
      });
      expect(WasteBin.create).not.toHaveBeenCalled();
    });

    it("should handle server errors", async () => {
      // Arrange
      req.body = {
        binType: "Plastic",
        thresholdLevel: 80,
      };

      User.findById.mockRejectedValue(new Error("Database error"));

      // Act
      await wasteController.createWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 2: Get All WasteBins
  // ============================================
  describe("getWasteBins", () => {
    it("should fetch all waste bins with correct permissions", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_VIEW", true]]),
      };

      const mockBins = [
        {
          _id: "bin1",
          binId: "PL-1234",
          binType: "Plastic",
          thresholdLevel: 80,
        },
        {
          _id: "bin2",
          binId: "FD-5678",
          binType: "Food",
          thresholdLevel: 75,
        },
      ];

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.find.mockResolvedValue(mockBins);

      // Act
      await wasteController.getWasteBins(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(Role.findById).toHaveBeenCalledWith("role123");
      expect(WasteBin.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBins);
    });

    it("should return 403 when user lacks view permission", async () => {
      // Arrange
      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_VIEW", false]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);

      // Act
      await wasteController.getWasteBins(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden: You don't have permission to view waste bins",
      });
      expect(WasteBin.find).not.toHaveBeenCalled();
    });

    it("should handle server errors", async () => {
      // Arrange
      User.findById.mockRejectedValue(new Error("Database error"));

      // Act
      await wasteController.getWasteBins(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 3: Get WasteBin by ID
  // ============================================
  describe("getWasteBinById", () => {
    it("should fetch a waste bin by MongoDB _id", async () => {
      // Arrange
      req.params.id = "bin123";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_VIEW", true]]),
      };

      const mockBin = {
        _id: "bin123",
        binId: "PL-1234",
        binType: "Plastic",
        thresholdLevel: 80,
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findOne.mockResolvedValue(mockBin);

      // Act
      await wasteController.getWasteBinById(req, res);

      // Assert
      expect(WasteBin.findOne).toHaveBeenCalledWith({
        $or: [{ _id: "bin123" }, { binId: "bin123" }],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBin);
    });

    it("should fetch a waste bin by binId", async () => {
      // Arrange
      req.params.id = "PL-1234";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_VIEW", true]]),
      };

      const mockBin = {
        _id: "bin123",
        binId: "PL-1234",
        binType: "Plastic",
        thresholdLevel: 80,
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findOne.mockResolvedValue(mockBin);

      // Act
      await wasteController.getWasteBinById(req, res);

      // Assert
      expect(WasteBin.findOne).toHaveBeenCalledWith({
        $or: [{ _id: "PL-1234" }, { binId: "PL-1234" }],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBin);
    });

    it("should return 404 when waste bin is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_VIEW", true]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findOne.mockResolvedValue(null);

      // Act
      await wasteController.getWasteBinById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "WasteBin not found" });
    });

    it("should return 403 when user lacks view permission", async () => {
      // Arrange
      req.params.id = "bin123";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_VIEW", false]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);

      // Act
      await wasteController.getWasteBinById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden: You don't have permission to view waste bins",
      });
      expect(WasteBin.findOne).not.toHaveBeenCalled();
    });

    it("should handle server errors", async () => {
      // Arrange
      req.params.id = "bin123";
      User.findById.mockRejectedValue(new Error("Database error"));

      // Act
      await wasteController.getWasteBinById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 4: Update WasteBin
  // ============================================
  describe("updateWasteBin", () => {
    it("should update a waste bin with correct permissions", async () => {
      // Arrange
      req.params.id = "bin123";
      req.body = {
        location: "Zone A",
        currentWasteLevel: 50,
        thresholdLevel: 85,
        availability: true,
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_EDIT", true]]),
      };

      const mockUpdatedBin = {
        _id: "bin123",
        binId: "PL-1234",
        location: "Zone A",
        currentWasteLevel: 50,
        thresholdLevel: 85,
        availability: true,
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findByIdAndUpdate.mockResolvedValue(mockUpdatedBin);

      // Act
      await wasteController.updateWasteBin(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(Role.findById).toHaveBeenCalledWith("role123");
      expect(WasteBin.findByIdAndUpdate).toHaveBeenCalledWith(
        "bin123",
        {
          location: "Zone A",
          currentWasteLevel: 50,
          thresholdLevel: 85,
          availability: true,
        },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedBin);
    });

    it("should return 404 when waste bin is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";
      req.body = {
        location: "Zone A",
        currentWasteLevel: 50,
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_EDIT", true]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await wasteController.updateWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Waste bin not found" });
    });

    it("should return 403 when user lacks edit permission", async () => {
      // Arrange
      req.params.id = "bin123";
      req.body = {
        location: "Zone A",
      };

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_EDIT", false]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);

      // Act
      await wasteController.updateWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden: You don't have permission to update waste bins",
      });
      expect(WasteBin.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle server errors", async () => {
      // Arrange
      req.params.id = "bin123";
      req.body = { location: "Zone A" };
      User.findById.mockRejectedValue(new Error("Database error"));

      // Act
      await wasteController.updateWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 5: Delete WasteBin
  // ============================================
  describe("deleteWasteBin", () => {
    it("should delete a waste bin with correct permissions", async () => {
      // Arrange
      req.params.id = "bin123";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_DELETE", true]]),
      };

      const mockDeletedBin = {
        _id: "bin123",
        binId: "PL-1234",
        binType: "Plastic",
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findOneAndDelete.mockResolvedValue(mockDeletedBin);

      // Act
      await wasteController.deleteWasteBin(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(Role.findById).toHaveBeenCalledWith("role123");
      expect(WasteBin.findOneAndDelete).toHaveBeenCalledWith({
        $or: [{ _id: "bin123" }, { binId: "bin123" }],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "WasteBin deleted successfully",
      });
    });

    it("should return 404 when waste bin is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_DELETE", true]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);
      WasteBin.findOneAndDelete.mockResolvedValue(null);

      // Act
      await wasteController.deleteWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "WasteBin not found" });
    });

    it("should return 403 when user lacks delete permission", async () => {
      // Arrange
      req.params.id = "bin123";

      const mockUser = {
        _id: "user123",
        userType: "role123",
      };

      const mockRole = {
        _id: "role123",
        permissionObject: new Map([["ADMIN_BIN_MNG_DELETE", false]]),
      };

      User.findById.mockResolvedValue(mockUser);
      Role.findById.mockResolvedValue(mockRole);

      // Act
      await wasteController.deleteWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Forbidden: You don't have permission to delete waste bins",
      });
      expect(WasteBin.findOneAndDelete).not.toHaveBeenCalled();
    });

    it("should handle server errors", async () => {
      // Arrange
      req.params.id = "bin123";
      User.findById.mockRejectedValue(new Error("Database error"));

      // Act
      await wasteController.deleteWasteBin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 6: Reset WasteBin Level
  // ============================================
  describe("resetWasteBinLevel", () => {
    it("should reset waste bin level to 0", async () => {
      // Arrange
      req.params.id = "bin123";

      const mockUpdatedBin = {
        _id: "bin123",
        binId: "PL-1234",
        currentWasteLevel: 0,
        thresholdLevel: 80,
      };

      WasteBin.findByIdAndUpdate.mockResolvedValue(mockUpdatedBin);

      // Act
      await wasteController.resetWasteBinLevel(req, res);

      // Assert
      expect(WasteBin.findByIdAndUpdate).toHaveBeenCalledWith(
        "bin123",
        { currentWasteLevel: 0 },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedBin);
    });

    it("should return 404 when waste bin is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";

      WasteBin.findByIdAndUpdate.mockResolvedValue(null);

      // Act
      await wasteController.resetWasteBinLevel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Waste bin not found" });
    });

    it("should handle server errors", async () => {
      // Arrange
      req.params.id = "bin123";
      WasteBin.findByIdAndUpdate.mockRejectedValue(
        new Error("Database error")
      );

      // Act
      await wasteController.resetWasteBinLevel(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  // ============================================
  // TEST 7: Get WasteBins by Owner
  // ============================================
  describe("getWasteBinsByOwner", () => {
    it("should fetch waste bins by owner and category", async () => {
      // Arrange
      req.params.category = "Plastic";

      const mockBins = [
        {
          _id: "bin1",
          binId: "PL-1234",
          binType: "Plastic",
          owner: "user123",
        },
        {
          _id: "bin2",
          binId: "PL-5678",
          binType: "Plastic",
          owner: "user123",
        },
      ];

      WasteBin.find.mockResolvedValue(mockBins);

      // Act
      await wasteController.getWasteBinsByOwner(req, res);

      // Assert
      expect(WasteBin.find).toHaveBeenCalledWith({
        owner: "user123",
        binType: "Plastic",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBins);
    });

    it("should fetch Food waste bins by owner", async () => {
      // Arrange
      req.params.category = "Food";

      const mockBins = [
        {
          _id: "bin3",
          binId: "FD-1234",
          binType: "Food",
          owner: "user123",
        },
      ];

      WasteBin.find.mockResolvedValue(mockBins);

      // Act
      await wasteController.getWasteBinsByOwner(req, res);

      // Assert
      expect(WasteBin.find).toHaveBeenCalledWith({
        owner: "user123",
        binType: "Food",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBins);
    });

    it("should return empty array when no bins found for owner and category", async () => {
      // Arrange
      req.params.category = "Paper";

      WasteBin.find.mockResolvedValue([]);

      // Act
      await wasteController.getWasteBinsByOwner(req, res);

      // Assert
      expect(WasteBin.find).toHaveBeenCalledWith({
        owner: "user123",
        binType: "Paper",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle server errors", async () => {
      // Arrange
      req.params.category = "Plastic";
      WasteBin.find.mockRejectedValue(new Error("Database error"));

      // Act
      await wasteController.getWasteBinsByOwner(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });
});
