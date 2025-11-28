const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const imageRoutes = require("./routes/images");   // CommonJS
const authRoutes = require("./routes/auth");      // CommonJS
const connectCloudinary = require("./config/cloudinary"); // CommonJS

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✔ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Middleware
app.use(cors());
app.use(express.json());

// Cloudinary
connectCloudinary();

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/images", imageRoutes);
app.use("/api", authRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});