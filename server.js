require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const payhereRoutes = require("./routes/payhereHashRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const wasteRoutes = require("./routes/wasteRoutes");
const garbageRoutes = require("./routes/garbageRouter");
const truckRoutes = require("./routes/truckRoutes");
const garbageRequestRoutes = require("./routes/garbageCollectionRequestRoutes");
const collectionRoutes = require("./routes/collectionRoutes");

const cors = require("cors");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: `${process.env.SERVER_ORIGIN}`,
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/payhere", payhereRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/garbage", garbageRoutes);
app.use("/api/truck", truckRoutes);
app.use("/api/garbage-request", garbageRequestRoutes);
app.use("/api/collection-route", collectionRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
