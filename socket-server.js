const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { initSocket } = require("./utils/socket");

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration matching the main server
const allowedOrigins = [
  "https://admin.rehabmedico.in",
  "https://www.admin.rehabmedico.in",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Simple health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Medico Standalone Socket Server is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Socket Server is healthy",
  });
});

// Database Connection
if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not found in environment variables");
  process.exit(1);
}

const DB = process.env.MONGODB_URI;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Atlas connected successfully for Sockets");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Initialize Socket.IO on the HTTP server
initSocket(server);

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`🚀 Standalone Socket server running on port ${PORT}`);
});
