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


// CORS Configuration

const allowedOrigins = [
  "http://localhost:5173",            // local admin panel
  "https://happytots.in",             // main website
  "https://admin.happytots.in",       // admin on subdomain (recommended)
  "https://happytots-admin.pages.dev" // cloudflare pages default domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);
