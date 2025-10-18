const path = require("path");
const fs = require("fs");
const vm = require("vm");
const crypto = require("crypto");

const loadGeneratePayHereHash = () => {
  const modulePath = path.join(__dirname, "..", "controllers", "payhereHash.js");
  const source = fs.readFileSync(modulePath, "utf8");
  const transformed = source
    .replace('import crypto from "crypto";', 'const crypto = require("crypto");')
    .replace(
      "export const generatePayHereHash =",
      "const generatePayHereHash ="
    )
    .concat("\nmodule.exports = { generatePayHereHash };\n");

  const sandbox = {
    require,
    module: { exports: {} },
    exports: {},
    process,
  };

  vm.runInNewContext(transformed, sandbox, { filename: "payhereHash.js" });
  return sandbox.module.exports.generatePayHereHash;
};

describe("generatePayHereHash", () => {
  let generatePayHereHash;

  beforeAll(() => {
    generatePayHereHash = loadGeneratePayHereHash();
  });

  beforeEach(() => {
    process.env.PAYHERE_MERCHANT_ID = "MERCHANT123";
    process.env.PAYHERE_SECRET = "SUPER-SECRET";
  });

  it("returns a deterministic uppercase MD5 signature", () => {
    const req = {
      body: {
        order_id: "ORDER-789",
        amount: "250.5",
        currency: "LKR",
      },
    };
    const res = {
      json: jest.fn(),
    };

    generatePayHereHash(req, res);

    const formattedAmount = Number(req.body.amount).toFixed(2);
    const secretDigest = crypto
      .createHash("md5")
      .update(process.env.PAYHERE_SECRET)
      .digest("hex")
      .toUpperCase();

    const expectedHash = crypto
      .createHash("md5")
      .update(
        process.env.PAYHERE_MERCHANT_ID +
          req.body.order_id +
          formattedAmount +
          req.body.currency +
          secretDigest
      )
      .digest("hex")
      .toUpperCase();

    expect(res.json).toHaveBeenCalledWith({ hash: expectedHash });
  });

  it("formats the amount to two decimals before hashing", () => {
    const capturedUpdates = [];
    const originalCreateHash = crypto.createHash;

    jest.spyOn(crypto, "createHash").mockImplementation(function (algorithm) {
      const instance = originalCreateHash.call(crypto, algorithm);
      const originalUpdate = instance.update;
      instance.update = function (data, inputEncoding) {
        if (algorithm === "md5") {
          capturedUpdates.push(String(data));
        }
        return originalUpdate.call(this, data, inputEncoding);
      };
      return instance;
    });

    const req = {
      body: {
        order_id: "ORDER-123",
        amount: 25,
        currency: "USD",
      },
    };
    const res = { json: jest.fn() };

    generatePayHereHash(req, res);

    const containsFormattedAmount = capturedUpdates.some((payload) =>
      payload.includes("25.00")
    );

    expect(containsFormattedAmount).toBe(true);

    crypto.createHash.mockRestore();
  });
});
