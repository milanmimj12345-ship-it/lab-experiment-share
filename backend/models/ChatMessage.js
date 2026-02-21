const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomKey: {
    type: String,
    required: true,
    index: true
  },
  group: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
