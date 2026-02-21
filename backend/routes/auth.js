const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { collegeId, phone } = req.body;
  if (!collegeId || !phone) {
    return res.status(400).json({ success: false, message: 'College ID and phone required' });
  }
  try {
    const user = await User.findOne({ collegeId: collegeId.toUpperCase() });
    if (!user || !await user.matchPhone(phone)) {
      return res.status(401).json({ success: false, message: 'Invalid College ID or phone number' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }
    res.json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, collegeId: user.collegeId, group: user.group, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register (Admin creates students, or first-time self-register if allowed)
router.post('/register', async (req, res) => {
  const { collegeId, username, phone, group } = req.body;
  if (!collegeId || !username || !phone || !group) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  try {
    const existing = await User.findOne({ collegeId: collegeId.toUpperCase() });
    if (existing) return res.status(409).json({ success: false, message: 'College ID already exists' });

    const user = await User.create({ collegeId, username, phone, group: group.toUpperCase() });
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, collegeId: user.collegeId, group: user.group, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
