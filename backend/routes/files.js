const express = require('express');
const router = express.Router();
const File = require('../models/File');
const { upload, cloudinary } = require('../config/cloudinary');

// Helper: extract real IP from request (works behind Railway/Render proxy)
const getIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
};

// GET files
router.get('/', async (req, res) => {
  try {
    const { experiment } = req.query;
    const filter = {};
    if (experiment) filter.experiment = experiment;
    const files = await File.find(filter).populate('experiment', 'title').sort({ createdAt: 1 });
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST upload single file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { experimentId, group, lab, folderName } = req.body;
    if (!experimentId || !group || !lab) {
      return res.status(400).json({ success: false, message: 'experimentId, group, and lab required' });
    }
    const uploaderIp = getIp(req);
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
      folderName: folderName || null,
      uploaderIp,
      uploadedBy: null
    });
    res.status(201).json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST upload multiple files from a folder
router.post('/upload-folder', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });
    const { experimentId, group, lab, folderName } = req.body;
    if (!experimentId || !group || !lab || !folderName) {
      return res.status(400).json({ success: false, message: 'experimentId, group, lab, and folderName required' });
    }
    const uploaderIp = getIp(req);
    await File.deleteMany({ experiment: experimentId, folderName, isFolder: true });
    const created = await Promise.all(req.files.map(f =>
      File.create({
        fileName: f.originalname,
        originalName: f.originalname,
        fileUrl: f.path,
        publicId: f.filename || f.public_id || f.originalname,
        fileType: f.mimetype,
        fileSize: f.size,
        experiment: experimentId,
        group: group.toUpperCase(),
        lab: lab.toUpperCase(),
        folderName,
        uploaderIp,
        uploadedBy: null
      })
    ));
    res.status(201).json({ success: true, files: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create empty folder
router.post('/create-folder', async (req, res) => {
  try {
    const { experimentId, group, lab, folderName } = req.body;
    if (!experimentId || !group || !lab || !folderName) {
      return res.status(400).json({ success: false, message: 'experimentId, group, lab, and folderName required' });
    }
    const existing = await File.findOne({ experiment: experimentId, folderName: folderName.trim() });
    if (existing) return res.status(400).json({ success: false, message: 'A folder with this name already exists' });
    const uploaderIp = getIp(req);
    const folder = await File.create({
      fileName: folderName.trim(),
      originalName: folderName.trim(),
      fileUrl: 'folder',
      fileType: 'folder',
      experiment: experimentId,
      group: group.toUpperCase(),
      lab: lab.toUpperCase(),
      folderName: folderName.trim(),
      isFolder: true,
      uploaderIp,
      uploadedBy: null
    });
    res.status(201).json({ success: true, file: folder });
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
    if (file.publicId && file.fileUrl !== 'folder') {
      try { await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' }); } catch (e) {}
    }
    await file.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE entire folder
router.delete('/folder/:experimentId/:folderName', async (req, res) => {
  try {
    const { experimentId, folderName } = req.params;
    const files = await File.find({ experiment: experimentId, folderName });
    await Promise.all(files.map(async f => {
      if (f.publicId && f.fileUrl !== 'folder') {
        try { await cloudinary.uploader.destroy(f.publicId, { resource_type: 'raw' }); } catch (e) {}
      }
    }));
    await File.deleteMany({ experiment: experimentId, folderName });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
