// backend/routes/auth.js (or modify your existing route file)
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Retrieve email and password from .env file
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail2 = process.env.ADMIN_EMAIL2;
  const adminPassword2 = process.env.ADMIN_PASSWORD2;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  if ((email == adminEmail && password == adminPassword) || (email == adminEmail2 && password == adminPassword2)) {

    return res.status(200).json({ success: true, message: 'Login successful!', token: 'dummy-jwt-token' });
    // In a real application, you would likely generate and send a JWT token here
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
});

module.exports = router;