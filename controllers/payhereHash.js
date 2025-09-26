import crypto from "crypto";

export const generatePayHereHash = (req, res) => {
  const { order_id, amount, currency } = req.body;

  const merchant_id = process.env.PAYHERE_MERCHANT_ID;
  const merchant_secret = process.env.PAYHERE_SECRET;
  const formattedAmount = Number(amount).toFixed(2);

  const hash = crypto
    .createHash("md5")
    .update(
      merchant_id +
        order_id +
        formattedAmount +
        currency +
        crypto
          .createHash("md5")
          .update(merchant_secret)
          .digest("hex")
          .toUpperCase()
    )
    .digest("hex")
    .toUpperCase();

  res.json({ hash });
};
