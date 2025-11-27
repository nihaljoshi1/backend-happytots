const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const imageRoutes = require('./routes/images');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const connectCloudinary = require('./config/cloudinary');

connectCloudinary();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

// Serve static files from the 'uploads' directory (where images will be stored)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Use image routes
app.use('/api/images', imageRoutes);
app.use('/api', authRoutes);   // Use the authentication routes under /api

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});