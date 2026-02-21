const express = require('express');
const router = express.Router();
const User = require('../models/User');
const File = require('../models/File');
const Experiment = require('../models/Experiment');
const { protect, adminOnly } = require('../middleware/auth');
const { cloudinary } = require('../config/cloudinary');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-phone').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id/toggle
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/flagged-files
router.get('/flagged-files', async (req, res) => {
  try {
    const files = await File.find({ isFlagged: true })
      .populate('uploadedBy', 'username collegeId')
      .populate('experiment', 'title');
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalFiles, totalExperiments, flaggedFiles] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      Experiment.countDocuments(),
      File.countDocuments({ isFlagged: true })
    ]);
    const groupAUsers = await User.countDocuments({ group: 'A' });
    const groupBUsers = await User.countDocuments({ group: 'B' });

    res.json({ success: true, stats: { totalUsers, totalFiles, totalExperiments, flaggedFiles, groupAUsers, groupBUsers } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/files/:id
router.delete('/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    await cloudinary.uploader.destroy(file.publicId, { resource_type: 'auto' });
    await file.deleteOne();
    res.json({ success: true, message: 'File deleted by admin' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/bulk-register — Register multiple students at once
router.post('/bulk-register', async (req, res) => {
  try {
    const { students } = req.body; // Array of { collegeId, username, phone, group }
    const bcrypt = require('bcryptjs');
    const results = [];
    for (const student of students) {
      try {
        const user = await User.create(student);
        results.push({ success: true, collegeId: student.collegeId });
      } catch (e) {
        results.push({ success: false, collegeId: student.collegeId, error: e.message });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
