const express = require('express');
const router = express.Router();
const File = require('../models/File');
const { upload, cloudinary } = require('../config/cloudinary');

// GET files
router.get('/', async (req, res) => {
  try {
    const { experiment } = req.query;
    const filter = {};
    if (experiment) filter.experiment = experiment;
    const files = await File.find(filter).populate('experiment', 'title').sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { experimentId, group, lab } = req.body;
    if (!experimentId || !group || !lab) {
      return res.status(400).json({ success: false, message: 'experimentId, group, and lab required' });
    }

    const file = await File.create({
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      fileUrl: req.file.path,
      publicId: req.file.filename || req.file.public_id || req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      experiment: experimentId,
      group: group.toUpperCase(),
      lab: lab.toUpperCase(),
      uploadedBy: null
    });
    res.status(201).json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST like
router.post('/:id/like', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    file.likes = (file.likes || 0) + 1;
    await file.save();
    res.json({ success: true, likes: file.likes, dislikes: file.dislikes || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST dislike
router.post('/:id/dislike', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    file.dislikes = (file.dislikes || 0) + 1;
    if (file.dislikes >= 5) file.isFlagged = true;
    await file.save();
    res.json({ success: true, likes: file.likes || 0, dislikes: file.dislikes, isFlagged: file.isFlagged });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE file
router.delete('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'Not found' });
    if (file.publicId) {
      try { await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' }); } catch (e) {}
    }
    await file.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
