const checkoutController = require("../controllers/checkoutController");
const Payment = require("../models/Payhere");
const GarbageRequest = require("../models/GarbageRequest");
const Garbage = require("../models/Garbage");
const PaymentBin = require("../models/PaymentBin");
const WasteBin = require("../models/WasteBin");

jest.mock("../models/Payhere");
jest.mock("../models/GarbageRequest");
jest.mock("../models/Garbage");
jest.mock("../models/PaymentBin");
jest.mock("../models/WasteBin");

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

describe("checkoutController.notifyPayment", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        payment_id: "PAY-123",
        status_code: "2",
        custom_1: "2024-01-02T10:00:00Z",
        custom_2: "garbage-001",
        payhere_amount: 3500,
        payhere_currency: "LKR",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("persists payment and opens request when status is success", async () => {
    Payment.create.mockResolvedValue({ payment_id: "PAY-123" });
    GarbageRequest.create.mockResolvedValue({ _id: "req-1" });
    Garbage.findByIdAndUpdate.mockResolvedValue({ _id: "garbage-001" });

    await checkoutController.notifyPayment(req, res);

    expect(Payment.create).toHaveBeenCalledWith(req.body);
    expect(GarbageRequest.create).toHaveBeenCalledWith({
      garbageId: "garbage-001",
      dateAndTime: "2024-01-02T10:00:00Z",
      price: 3500,
      currency: "LKR",
      status: "Pending",
    });
    expect(Garbage.findByIdAndUpdate).toHaveBeenCalledWith(
      "garbage-001",
      { status: "Requested" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("skips request creation for non-successful payments", async () => {
    req.body.status_code = "0";
    Payment.create.mockResolvedValue({ payment_id: "PAY-123" });

    await checkoutController.notifyPayment(req, res);

    expect(GarbageRequest.create).not.toHaveBeenCalled();
    expect(Garbage.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("rejects callbacks without a payment id", async () => {
    delete req.body.payment_id;

    await checkoutController.notifyPayment(req, res);

    expect(Payment.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("payment_id is missing");
  });

  it("translates validation errors into 400 responses", async () => {
    const validationError = new Error("Validation failed");
    validationError.name = "ValidationError";
    Payment.create.mockRejectedValue(validationError);

    await checkoutController.notifyPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid payment data");
  });

  it("surface Mongo network interruptions as 503", async () => {
    const networkError = new Error("Network down");
    networkError.name = "MongoNetworkError";
    Payment.create.mockRejectedValue(networkError);

    await checkoutController.notifyPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.send).toHaveBeenCalledWith("Database temporarily unavailable");
  });

  it("falls back to a 500 error for unexpected failures", async () => {
    Payment.create.mockRejectedValue(new Error("Unknown failure"));

    await checkoutController.notifyPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Server Error");
  });
});

describe("checkoutController.notifyPaymentBin", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        payment_id: "BIN-100",
        status_code: "2",
        custom_1: "6.9340-79.8428",
        custom_2: "bin123-user777",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("updates waste bin metadata when a bin payment succeeds", async () => {
    PaymentBin.create.mockResolvedValue({ payment_id: "BIN-100" });
    WasteBin.findByIdAndUpdate.mockResolvedValue({ _id: "bin-555" });

    await checkoutController.notifyPaymentBin(req, res);

    expect(PaymentBin.create).toHaveBeenCalledWith(req.body);
    expect(WasteBin.findByIdAndUpdate).toHaveBeenCalledWith(
      "bin123",
      {
        status: "Purchased",
        latitude: 6.934,
        longitude: 79.8428,
  owner: "user777",
        availability: false,
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("ignores bin updates when payment status is not successful", async () => {
    req.body.status_code = "0";
    PaymentBin.create.mockResolvedValue({ payment_id: "BIN-100" });

    await checkoutController.notifyPaymentBin(req, res);

    expect(WasteBin.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("OK");
  });

  it("returns 400 when payment id is missing", async () => {
    delete req.body.payment_id;

    await checkoutController.notifyPaymentBin(req, res);

    expect(PaymentBin.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("payment_id is missing");
  });

  it("maps validation faults to client errors", async () => {
    const validationError = new Error("Invalid");
    validationError.name = "ValidationError";
    PaymentBin.create.mockRejectedValue(validationError);

    await checkoutController.notifyPaymentBin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid payment data");
  });

  it("signals temporary outages with 503", async () => {
    const networkError = new Error("Mongo hiccup");
    networkError.name = "MongoNetworkError";
    PaymentBin.create.mockRejectedValue(networkError);

    await checkoutController.notifyPaymentBin(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.send).toHaveBeenCalledWith("Database temporarily unavailable");
  });

  it("handles unexpected server errors", async () => {
    PaymentBin.create.mockRejectedValue(new Error("boom"));

    await checkoutController.notifyPaymentBin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Server Error");
  });
});
