const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  page: { type: String, lowercase: true },
  section: { type: String, lowercase: true },
  title: String,
  description: String,
  category: String,

  // Cloudinary URL
  imageUrl: { type: String, required: true },

  // Cloudinary public_id (NOT local filename)
  filename: { type: String, required: true },

  uploadDate: { type: Date, default: Date.now },
  position: String,
  size: String,
  dimensions: String
});

module.exports = mongoose.model('Image', imageSchema);