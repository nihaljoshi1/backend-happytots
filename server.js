const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const imageRoutes = require("./routes/images");
const authRoutes = require("./routes/auth");
const connectCloudinary = require("./config/cloudinary");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ----------------------
// 1. ALLOWED ORIGINS (TOP)
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://happytots.in",
  "https://admin.happytots.in",
  "https://happytots-admin.pages.dev"
];

// ----------------------
// 2. CORS MIDDLEWARE (TOP, BEFORE ROUTES)
// ----------------------
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

// ----------------------
// 3. JSON PARSER
// ----------------------
app.use(express.json());

// ----------------------
// 4. CONNECT MONGODB
// ----------------------
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✔ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// ----------------------
// 5. CLOUDINARY CONFIG
// ----------------------
connectCloudinary();

// ----------------------
// 6. STATIC FOLDER
// ----------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------
// 7. ROUTES
// ----------------------
app.use("/api/images", imageRoutes);
app.use("/api", authRoutes);

// ----------------------
// 8. START SERVER
// ----------------------
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});