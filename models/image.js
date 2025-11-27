const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  page: String,
  section: String,
  title: String,
  description: String,
  category: String,
  imageUrl: String, // Will now store the file path (e.g., /uploads/timestamp-filename.jpg)
  filename: String,
  uploadDate: { type: Date, default: Date.now },
  position: String,
  size: String,
  dimensions: String
});

module.exports = mongoose.model('Image', imageSchema);