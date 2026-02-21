const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// GET /api/chat/messages?group=A — Load chat history
router.get('/messages', protect, async (req, res) => {
  try {
    const { group } = req.query;
    if (!group) return res.status(400).json({ success: false, message: 'group required' });

    const roomKey = `group-${group.toUpperCase()}`;
    const messages = await ChatMessage.find({ roomKey })
      .populate('sender', 'username collegeId')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/chat/save — Save message to DB (called after socket emit)
router.post('/save', protect, async (req, res) => {
  try {
    const { group, message, messageType } = req.body;
    const roomKey = `group-${group.toUpperCase()}`;

    const msg = await ChatMessage.create({
      roomKey,
      group: group.toUpperCase(),
      sender: req.user._id,
      username: req.user.username,
      message,
      messageType: messageType || 'text'
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/chat/upload — Upload file in chat
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const { group } = req.body;
    const roomKey = `group-${group.toUpperCase()}`;

    const msg = await ChatMessage.create({
      roomKey,
      group: group.toUpperCase(),
      sender: req.user._id,
      username: req.user.username,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      messageType: 'file'
    });

    res.json({
      success: true,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      message: msg
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
