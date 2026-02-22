const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ChatMessage = require('./models/ChatMessage');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/files', require('./routes/files'));
app.use('/api/share', require('./routes/share'));

// ✅ Chat history REST endpoint - simple and reliable
app.get('/api/chat/history', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomKey: 'lab_chat_global' })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io
const chatRooms = {};

io.on('connection', (socket) => {

  socket.on('join_room', ({ roomKey, username }) => {
    socket.join(roomKey);
    socket.username = username;
    socket.roomKey = roomKey;

    if (!chatRooms[roomKey]) chatRooms[roomKey] = [];
    chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.socketId !== socket.id);
    chatRooms[roomKey].push({ socketId: socket.id, username });
    io.to(roomKey).emit('room_users', chatRooms[roomKey]);

    // Notify others someone joined
    socket.to(roomKey).emit('receive_message', {
      id: Date.now().toString(),
      sender: 'System',
      text: `${username} joined the room`,
      isSystem: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('send_message', async ({ roomKey, message, username }) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: Date.now().toString(),
      sender: username,
      text: message,
      type: 'text',
      timestamp
    };
    // Broadcast to ALL in room including sender
    io.to(roomKey).emit('receive_message', msg);

    // Save to MongoDB
    try {
      await ChatMessage.create({ roomKey, username, message, messageType: 'text' });
    } catch (err) {
      console.error('❌ Save error:', err.message);
    }
  });

  socket.on('share_file', async ({ roomKey, fileUrl, fileName, username }) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: Date.now().toString(),
      sender: username,
      text: '📎 ' + fileName,
      fileUrl,
      fileName,
      type: 'file',
      timestamp
    };
    io.to(roomKey).emit('receive_message', msg);
    try {
      await ChatMessage.create({ roomKey, username, fileUrl, fileName, messageType: 'file' });
    } catch (err) {
      console.error('❌ Save file error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    for (const roomKey in chatRooms) {
      const user = chatRooms[roomKey].find(u => u.socketId === socket.id);
      if (user) {
        chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.socketId !== socket.id);
        io.to(roomKey).emit('receive_message', {
          id: Date.now().toString(),
          sender: 'System',
          text: `${user.username} left the room`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        io.to(roomKey).emit('room_users', chatRooms[roomKey]);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
