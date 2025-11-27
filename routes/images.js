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

    const { page, section, title, description, category } = req.body;

    filePath = path.join(__dirname, '../uploads', req.file.filename);

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(filePath);

    const newImage = new Image({
      page: page?.toLowerCase(),
      section: section?.toLowerCase(),
      title,
      description,
      category,
      imageUrl: uploaded.secure_url,
      filename: req.file.filename,
      size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    const saved = await newImage.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: saved
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed' });

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

    // NORMAL SECTIONS → return only URLs
    if (section !== "gallery") {
      const docs = await Image.find(filter).select("imageUrl -_id");
      const urls = docs.map(d => d.imageUrl);

      return res.json({ success: true, images: urls });
    }

    // GALLERY → return full objects
    const images = await Image.find(filter);
    res.json({ success: true, images });

  } catch (err) {
    console.error("Error fetching images:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ----------------------------- Get Single Image ----------------------------- */
router.get('/:id', async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, image: img });

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

    // Update text fields
    img.title = title ?? img.title;
    img.position = position ?? img.position;
    img.description = description ?? img.description;
    img.category = category ?? img.category;
    img.section = section ? section.toLowerCase() : img.section;
    img.page = page ? page.toLowerCase() : img.page;

    // If new file uploaded → replace Cloudinary image
    if (req.file) {
      filePath = path.join(__dirname, '../uploads', req.file.filename);

      // Upload new file
      const uploaded = await cloudinary.uploader.upload(filePath);

      img.imageUrl = uploaded.secure_url;
      img.filename = req.file.filename;
      img.size = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';
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

    // local file is irrelevant (Cloudinary handles storage)

    res.json({ success: true, message: 'Image deleted' });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// router.get('/getimages', async (req, res) => {
//   try {
//     const { section } = req.query;

//     // Optional filter based on `section`
//     const filter = section ? { section } : {};

//     // Only return imageUrl fields (and _id for keys if needed)
//     const imgs = await Image.find(filter).select('imageUrl -_id');
//     const images = imgs.map(img => img.imageUrl);
//     res.json({ success: true, images });
//   } catch (error) {
//     console.error("Error fetching images:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });