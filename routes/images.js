const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Image = require('../models/image');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;

/* ----------------------------- Multer Storage ----------------------------- */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const random = Math.random().toString(36).substring(2, 15);
    cb(null, `${Date.now()}-${random}${ext}`);
  }
});

const upload = multer({ storage });

/* ----------------------------- Upload Image ----------------------------- */
router.post('/upload', upload.single('image'), async (req, res) => {
  let filePath;

  try {
    if (!req.file) return res.status(400).send('No image uploaded.');

    const { page, section, title, description, category, position } = req.body;

    filePath = path.join(__dirname, '../uploads', req.file.filename);

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(filePath, {
      folder: "happyTots",
    });

    // Save to MongoDB
    const newImage = new Image({
      page: page?.toLowerCase(),
      section: section?.toLowerCase(),
      title,
      description,
      category,
      position,
      imageUrl: uploaded.secure_url,
      filename: uploaded.public_id, // IMPORTANT
      size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
      dimensions: `${uploaded.width}x${uploaded.height}`
    });

    const saved = await newImage.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: saved
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });

  } finally {
    if (filePath) await fs.unlink(filePath).catch(() => {});
  }
});

/* ----------------------------- Fetch Images ----------------------------- */
router.get('/getimages', async (req, res) => {
  try {
    const { section, category } = req.query;

    const filter = {};

    if (section) filter.section = section.toLowerCase();
    if (category) filter.category = category;

    // NON-GALLERY: Return only URLs
    if (section !== "gallery") {
      const docs = await Image.find(filter).select("imageUrl -_id");
      const urls = docs.map(d => d.imageUrl);
      return res.json({ success: true, images: urls });
    }

    // GALLERY: Full details
    const images = await Image.find(filter);
    res.json({ success: true, images });

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------- Update Image ----------------------------- */
router.put('/:id', upload.single('image'), async (req, res) => {
  let filePath;

  try {
    let img = await Image.findById(req.params.id);
    if (!img) return res.status(404).json({ success: false, message: 'Image not found' });

    const { title, position, description, category, section, page } = req.body;

    img.title = title ?? img.title;
    img.position = position ?? img.position;
    img.description = description ?? img.description;
    img.category = category ?? img.category;
    img.section = section ? section.toLowerCase() : img.section;
    img.page = page ? page.toLowerCase() : img.page;

    // Replace image if uploaded new one
    if (req.file) {
      filePath = path.join(__dirname, '../uploads', req.file.filename);

      // Remove old image from Cloudinary
      await cloudinary.uploader.destroy(img.filename);

      // Upload new file
      const uploaded = await cloudinary.uploader.upload(filePath, {
        folder: "happyTots",
      });

      img.imageUrl = uploaded.secure_url;
      img.filename = uploaded.public_id;
      img.size = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';
      img.dimensions = `${uploaded.width}x${uploaded.height}`;
    }

    const updated = await img.save();

    res.json({
      success: true,
      message: 'Image updated successfully',
      image: updated
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: err.message });

  } finally {
    if (filePath) await fs.unlink(filePath).catch(() => {});
  }
});

/* ----------------------------- Delete Image ----------------------------- */
router.delete('/:id', async (req, res) => {
  try {
    const img = await Image.findByIdAndDelete(req.params.id);
    if (!img) return res.status(404).json({ success: false, message: 'Image not found' });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(img.filename);

    res.json({ success: true, message: 'Image deleted successfully' });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;