const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const sampleRoutes = require("./routes/sampleRoutes");
const supplierRoutes = require("./routes/supplierRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/samples", sampleRoutes);
app.use("/suppliers", supplierRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  const status = error.name === "ValidationError" ? 400 : 500;
  res.status(status).json({
    message: error.message || "Server error",
  });
});

module.exports = app;
