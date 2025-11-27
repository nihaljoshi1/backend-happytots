const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Image = require('../models/image');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomString}${ext}`);
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Please upload an image file.');
    }

    const { page, section, title, description, category } = req.body;

    const filePath = path.join(__dirname, '../uploads', req.file.filename);

    const uploadResult = await cloudinary.uploader.upload(filePath);

    const newImage = new Image({
      page,
      section,
      title,
      description,
      category,
      imageUrl: uploadResult.secure_url,
      filename: req.file.filename,
      size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
    });

    const savedImage = await newImage.save();
    res.status(201).json({ message: 'Image uploaded successfully!', image: savedImage });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).send('Error uploading image.');
  } finally {
    await fs.unlink(filePath);
  }
});


router.get('/', async (req, res) => {
  const { page, section } = req.query;
  const query = { page };
  if (section && section !== 'all') {
    if (page === 'gallery') {
      query.category = category;
    } else {
      query.section = section;
    }
  }
  try {
    const images = await Image.find(query);
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Error fetching images.');
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send('Image not found.');
    }

    const { title, position, description, category } = req.body;
    image.title = title || image.title;
    image.position = position || image.position;
    image.description = description || image.description;
    image.category = category || image.category;

    if (req.file) {
      if (image.filename) {
        const oldImagePath = path.join(__dirname, '../uploads', image.filename);
        try {
          await fs.unlink(oldImagePath);
        } catch (unlinkError) {
          console.error('Error deleting old image file:', unlinkError);
        }
      }

      image.imageUrl = `/uploads/${req.file.filename}`;
      image.filename = req.file.filename;
      image.size = (req.file.size / 1024 / 1024).toFixed(2) + ' MB';
    }

    const updatedImage = await image.save();
    res.json({ message: 'Image updated successfully!', image: updatedImage });

  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).send('Error updating image.');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).send('Image not found.');
    }

    const imagePath = path.join(__dirname, '../uploads', image.filename);
    await fs.unlink(imagePath);

    res.json({ message: 'Image deleted successfully!' });
  } catch (error) {
    console.error('Error deleting image:', error);
    console.error('Error object:', error);
    res.status(500).send('Error deleting image.');
  }
});

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

router.get('/getimages', async (req, res) => {
  try {
    const { section, category } = req.query;

    // Normalize section
    const filter = {};
    if (section) filter.section = section.toLowerCase();

    if (section === "gallery") {
      if (category?.trim()) {
        filter.category = category;
      }

      console.log("Gallery filter:", filter); //  Debug this

      const images = await Image.find(filter);
      return res.json({ success: true, images });
    } else {
      const imgs = await Image.find(filter).select('imageUrl -_id');
      const images = imgs.map(img => img.imageUrl);
      res.json({ success: true, images });
    }

  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});



router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send('Image not found.');
    }
    res.json(image);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Error fetching image.');
  }
});

module.exports = router;