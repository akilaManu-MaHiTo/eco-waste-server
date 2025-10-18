const mongoose = require("mongoose");

jest.mock("../models/Garbage");
jest.mock("../models/User");
jest.mock("../models/WasteBin");

const garbageController = require("../controllers/garbageController");
const Garbage = require("../models/Garbage");
const User = require("../models/User");
const Bin = require("../models/WasteBin");

let consoleLogSpy;
let consoleErrorSpy;

beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});

Garbage.find = Garbage.find || jest.fn();
Garbage.create = Garbage.create || jest.fn();
Garbage.findByIdAndUpdate = Garbage.findByIdAndUpdate || jest.fn();
Garbage.findByIdAndDelete = Garbage.findByIdAndDelete || jest.fn();
Garbage.findOne = Garbage.findOne || jest.fn();
Garbage.aggregate = Garbage.aggregate || jest.fn();
User.findById = User.findById || jest.fn();
Bin.findById = Bin.findById || jest.fn();

describe("garbageController", () => {
  const validUserId = new mongoose.Types.ObjectId().toHexString();
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: validUserId },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  describe("createGarbage", () => {
    it("creates a garbage entry when capacity allows", async () => {
      req.body = {
        wasteWeight: 30,
        binId: "bin-1",
        garbageCategory: "Plastic",
      };

      Bin.findById.mockResolvedValue({ thresholdLevel: 100 });
      Garbage.find.mockResolvedValue([{ wasteWeight: 20 }]);
      const createdGarbage = { _id: "garbage-1", wasteWeight: 30 };
      Garbage.create.mockResolvedValue(createdGarbage);

      await garbageController.createGarbage(req, res);

      expect(Bin.findById).toHaveBeenCalledWith("bin-1");
      expect(Garbage.find).toHaveBeenCalledWith({
        binId: "bin-1",
        status: "Pending",
      });
      expect(Garbage.create).toHaveBeenCalledWith({
        wasteWeight: 30,
        binId: "bin-1",
        garbageCategory: "Plastic",
        createdBy: validUserId,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdGarbage);
    });

    it("returns 404 when the bin does not exist", async () => {
      req.body = { wasteWeight: 10, binId: "missing" };
      Bin.findById.mockResolvedValue(null);

      await garbageController.createGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Bin not found" });
      expect(Garbage.create).not.toHaveBeenCalled();
    });

    it("prevents creating garbage beyond the bin threshold", async () => {
      req.body = { wasteWeight: 40, binId: "bin-2" };
      Bin.findById.mockResolvedValue({ thresholdLevel: "50" });
      Garbage.find.mockResolvedValue([{ wasteWeight: 30 }]);

      await garbageController.createGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bin capacity exceeded. Please use another bin.",
      });
      expect(Garbage.create).not.toHaveBeenCalled();
    });

    it("surfaces server errors when creation fails", async () => {
      req.body = { wasteWeight: 20, binId: "bin-3", garbageCategory: "Metal" };
      Bin.findById.mockResolvedValue({ thresholdLevel: 100 });
      Garbage.find.mockResolvedValue([]);
      Garbage.create.mockRejectedValue(new Error("db failure"));

      await garbageController.createGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe("updateGarbage", () => {
    beforeEach(() => {
      req.params.id = "garbage-123";
      req.body = {
        wasteWeight: 45,
        binId: { _id: "bin-5" },
        garbageCategory: "Food",
      };
    });

    it("updates an existing garbage record", async () => {
      const updated = { _id: "garbage-123", wasteWeight: 45 };
      Garbage.findByIdAndUpdate.mockResolvedValue(updated);

      await garbageController.updateGarbage(req, res);

      expect(Garbage.findByIdAndUpdate).toHaveBeenCalledWith(
        "garbage-123",
        {
          wasteWeight: 45,
          binId: "bin-5",
          garbageCategory: "Food",
          updatedBy: validUserId,
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("returns 404 when the garbage record is missing", async () => {
      Garbage.findByIdAndUpdate.mockResolvedValue(null);

      await garbageController.updateGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Garbage not found" });
    });

    it("falls back to 500 on unexpected errors", async () => {
      Garbage.findByIdAndUpdate.mockRejectedValue(new Error("boom"));

      await garbageController.updateGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe("deleteGarbage", () => {
    beforeEach(() => {
      req.params.id = "garbage-78";
    });

    it("removes the requested garbage entry", async () => {
      const removed = { _id: "garbage-78" };
      Garbage.findByIdAndDelete.mockResolvedValue(removed);

      await garbageController.deleteGarbage(req, res);

      expect(Garbage.findByIdAndDelete).toHaveBeenCalledWith("garbage-78");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(removed);
    });

    it("returns 404 when the entry does not exist", async () => {
      Garbage.findByIdAndDelete.mockResolvedValue(null);

      await garbageController.deleteGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Garbage not found" });
    });

    it("handles unexpected delete errors", async () => {
      Garbage.findByIdAndDelete.mockRejectedValue(new Error("failure"));

      await garbageController.deleteGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
    });
  });

  describe("getGarbage", () => {
    it("returns the authenticated user's garbage", async () => {
      const garbageList = [{ _id: "g1" }, { _id: "g2" }];
      const populateSecond = jest.fn().mockResolvedValue(garbageList);
      const populateFirst = jest.fn().mockReturnValue({ populate: populateSecond });
      Garbage.find.mockReturnValue({ populate: populateFirst });

      await garbageController.getGarbage(req, res);

      expect(Garbage.find).toHaveBeenCalledWith({ createdBy: validUserId });
      expect(populateFirst).toHaveBeenCalledWith("binId");
      expect(populateSecond).toHaveBeenCalledWith("createdBy");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(garbageList);
    });

    it("converts data access errors into 500 responses", async () => {
      const populateSecond = jest
        .fn()
        .mockRejectedValue(new Error("read failure"));
      const populateFirst = jest.fn().mockReturnValue({ populate: populateSecond });
      Garbage.find.mockReturnValue({ populate: populateFirst });

      await garbageController.getGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error: Unable to fetch garbage",
      });
    });
  });

  describe("getTodayGarbage", () => {
    const fixedNow = new Date("2024-05-01T08:30:00Z");

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(fixedNow);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("summarises today's garbage for the user", async () => {
      const todayGarbage = [{ _id: "g1" }];
      const sort = jest.fn().mockResolvedValue(todayGarbage);
      const populateSecond = jest.fn().mockReturnValue({ sort });
      const populateFirst = jest.fn().mockReturnValue({ populate: populateSecond });
      Garbage.find.mockReturnValue({ populate: populateFirst });

      await garbageController.getTodayGarbage(req, res);

      expect(Garbage.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        count: 1,
        date: fixedNow.toDateString(),
        garbage: todayGarbage,
      });
    });

    it("maps failures to a 500 response", async () => {
      const sort = jest.fn().mockRejectedValue(new Error("aggregation"));
      const populateSecond = jest.fn().mockReturnValue({ sort });
      const populateFirst = jest.fn().mockReturnValue({ populate: populateSecond });
      Garbage.find.mockReturnValue({ populate: populateFirst });

      await garbageController.getTodayGarbage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server Error: Unable to fetch today's garbage",
      });
    });
  });

  describe("getCurrentSummary", () => {
    it("requires authentication", async () => {
      req.user = null;

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Authentication required" });
    });

    it("validates the user identifier", async () => {
      req.user.id = "bad-id";

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid user identifier" });
    });

    it("returns 404 when the user cannot be found", async () => {
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      User.findById.mockReturnValue({ select });

      await garbageController.getCurrentSummary(req, res);

      expect(User.findById).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("returns an empty summary when no records exist", async () => {
      const userDoc = { _id: validUserId, username: "Alice", email: "a@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });
      const lean = jest.fn().mockResolvedValue(null);
      const selectEarliest = jest.fn().mockReturnValue({ lean });
      const sort = jest.fn().mockReturnValue({ select: selectEarliest });
      Garbage.findOne.mockReturnValue({ sort });

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: {
          _id: userDoc._id,
          name: userDoc.username,
          email: userDoc.email,
        },
        range: null,
        totals: { totalWeight: 0, count: 0, lastDepositAt: null },
        summary: [],
      });
    });

    it("rejects invalid start dates", async () => {
      req.query.startDate = "invalid";
      const userDoc = { _id: validUserId, username: "Bob", email: "b@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid startDate" });
    });

    it("rejects invalid end dates", async () => {
      req.query = { startDate: "2024-01-01", endDate: "invalid" };
      const userDoc = { _id: validUserId, username: "Bob", email: "b@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid endDate" });
    });

    it("ensures endDate is not before startDate", async () => {
      req.query = { startDate: "2024-01-10", endDate: "2024-01-05" };
      const userDoc = { _id: validUserId, username: "Bob", email: "b@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "endDate must be on or after startDate",
      });
    });

    it("builds a summary for the given window", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      const userDoc = { _id: validUserId, username: "Alice", email: "a@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });
      Garbage.aggregate.mockResolvedValue([
        {
          category: "Paper",
          totalWeight: 5,
          count: 1,
          lastDepositAt: new Date("2024-01-20T12:00:00Z"),
        },
        {
          category: "Plastic",
          totalWeight: 12.345,
          count: 2,
          lastDepositAt: new Date("2024-01-15T10:00:00Z"),
        },
      ]);

      await garbageController.getCurrentSummary(req, res);

      expect(Garbage.aggregate).toHaveBeenCalled();
      const payload = res.json.mock.calls[0][0];
      const expectedRangeStart = new Date("2024-01-01");
      expectedRangeStart.setHours(0, 0, 0, 0);
      const expectedRangeEnd = new Date("2024-01-31");
      expectedRangeEnd.setHours(23, 59, 59, 999);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(payload.user).toEqual({
        _id: userDoc._id,
        name: userDoc.username,
        email: userDoc.email,
      });
      expect(payload.range).toEqual({
        start: expectedRangeStart.toISOString(),
        end: expectedRangeEnd.toISOString(),
      });
      expect(payload.totals).toEqual({
        totalWeight: 17.35,
        count: 3,
        lastDepositAt: new Date("2024-01-20T12:00:00Z").toISOString(),
      });
      expect(payload.summary).toEqual([
        {
          category: "Paper",
          totalWeight: 5,
          count: 1,
          lastDepositAt: new Date("2024-01-20T12:00:00Z").toISOString(),
        },
        {
          category: "Plastic",
          totalWeight: 12.35,
          count: 2,
          lastDepositAt: new Date("2024-01-15T10:00:00Z").toISOString(),
        },
      ]);
    });

    it("maps validation issues from Mongo to a 400 response", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      const userDoc = { _id: validUserId, username: "Alice", email: "a@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });
      const err = new Error("bad request");
      err.name = "ValidationError";
      Garbage.aggregate.mockRejectedValue(err);

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request", details: err.message });
    });

    it("propagates Mongo connectivity issues as 503", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      const userDoc = { _id: validUserId, username: "Alice", email: "a@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });
      const err = new Error("network");
      err.name = "MongoNetworkError";
      Garbage.aggregate.mockRejectedValue(err);

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database unavailable, please try again later",
      });
    });

    it("falls back to an internal error for unexpected failures", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-31" };
      const userDoc = { _id: validUserId, username: "Alice", email: "a@example.com" };
      const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(userDoc) });
      User.findById.mockReturnValue({ select });
      Garbage.aggregate.mockRejectedValue(new Error("boom"));

      await garbageController.getCurrentSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Server Error: Unable to build summary",
      });
    });
  });

  describe("getGarbageTrend", () => {
    it("requires authentication", async () => {
      req.user = null;

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Authentication required" });
    });

    it("validates the user id", async () => {
      req.user.id = "invalid";

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid user identifier" });
    });

    it("rejects malformed start dates", async () => {
      req.query.startDate = "bad";

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid startDate" });
    });

    it("rejects malformed end dates", async () => {
      req.query = { startDate: "2024-01-01", endDate: "bad" };

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid endDate" });
    });

    it("ensures end is not before start", async () => {
      req.query = { startDate: "2024-01-05", endDate: "2024-01-01" };

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "endDate must be on or after startDate",
      });
    });

    it("returns a continuous daily trend", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-03" };
      Garbage.aggregate.mockResolvedValue([
        {
          date: "2024-01-01",
          categories: [
            { category: "Plastic", totalWeight: 5.5, count: 1 },
            { category: "Paper", totalWeight: 1.25, count: 1 },
          ],
        },
        {
          date: "2024-01-02",
          categories: [{ category: "Plastic", totalWeight: 2, count: 1 }],
        },
      ]);

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];

      const trendByDate = new Map(payload.trend.map((entry) => [entry.date, entry]));
      expect(trendByDate.get("2023-12-31")).toEqual({
        date: "2023-12-31",
        categories: [],
        totalWeight: 0,
        count: 0,
      });
      expect(trendByDate.get("2024-01-01")).toEqual({
        date: "2024-01-01",
        categories: [
          { category: "Plastic", totalWeight: 5.5, count: 1 },
          { category: "Paper", totalWeight: 1.25, count: 1 },
        ],
        totalWeight: 6.75,
        count: 2,
      });
      expect(trendByDate.get("2024-01-02")).toEqual({
        date: "2024-01-02",
        categories: [{ category: "Plastic", totalWeight: 2, count: 1 }],
        totalWeight: 2,
        count: 1,
      });

      const sequence = payload.trend.map((entry) => entry.date);
      const sorted = [...sequence].sort();
      expect(sequence).toEqual(sorted);
    });

    it("maps validation problems to a 400 response", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-03" };
      const err = new Error("invalid");
      err.name = "ValidationError";
      Garbage.aggregate.mockRejectedValue(err);

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request", details: err.message });
    });

    it("maps network issues to 503", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-03" };
      const err = new Error("network");
      err.name = "MongoNetworkError";
      Garbage.aggregate.mockRejectedValue(err);

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database unavailable, please try again later",
      });
    });

    it("returns 500 for unexpected errors", async () => {
      req.query = { startDate: "2024-01-01", endDate: "2024-01-03" };
      Garbage.aggregate.mockRejectedValue(new Error("boom"));

      await garbageController.getGarbageTrend(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server Error" });
    });
  });

  describe("getCurrentGarbageLevel", () => {
    beforeEach(() => {
      delete req.user; // handler reads from query, not req.user
    });

    it("rejects invalid userId filters", async () => {
      req.query.userId = "bad";

      await garbageController.getCurrentGarbageLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid userId" });
      expect(Garbage.aggregate).not.toHaveBeenCalled();
    });

    it("returns aggregated bin utilisation", async () => {
      process.env.DEFAULT_BIN_CAPACITY = "150";
      req.query = {};
      Garbage.aggregate.mockResolvedValue([
        {
          binId: "bin-1",
          binName: "Alpha",
          totalWeight: 90,
          capacity: 120,
          percentFilled: 75,
          count: 3,
        },
        {
          binId: "bin-2",
          binName: null,
          totalWeight: 40,
          capacity: 150,
          percentFilled: 26.6666667,
          count: 2,
        },
      ]);

      await garbageController.getCurrentGarbageLevel(req, res);

      expect(Garbage.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        overall: {
          totalWeight: 130,
          totalCapacity: 270,
          percentFilled: 48.15,
        },
        bins: [
          {
            binId: "bin-1",
            binName: "Alpha",
            totalWeight: 90,
            capacity: 120,
            percentFilled: 75,
            deposits: 3,
          },
          {
            binId: "bin-2",
            binName: null,
            totalWeight: 40,
            capacity: 150,
            percentFilled: 26.67,
            deposits: 2,
          },
        ],
      });
    });

    it("maps validation failures to 400", async () => {
      req.query = {};
      const err = new Error("bad");
      err.name = "ValidationError";
      Garbage.aggregate.mockRejectedValue(err);

      await garbageController.getCurrentGarbageLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request", details: err.message });
    });

    it("maps network failures to 503", async () => {
      req.query = {};
      const err = new Error("network");
      err.name = "MongoNetworkError";
      Garbage.aggregate.mockRejectedValue(err);

      await garbageController.getCurrentGarbageLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database unavailable, please try again later",
      });
    });

    it("returns 500 for unexpected aggregation errors", async () => {
      req.query = {};
      Garbage.aggregate.mockRejectedValue(new Error("boom"));

      await garbageController.getCurrentGarbageLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Server Error" });
    });
  });
});
