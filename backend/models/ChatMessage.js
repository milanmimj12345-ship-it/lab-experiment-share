const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomKey: { type: String, default: 'lab_chat_global' },
  username: { type: String, default: 'Anonymous' },
  message: { type: String, default: '' },
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  messageType: { type: String, default: 'text' }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
