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

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io
const chatRooms = {};
const ROOM_KEY = 'lab_chat_global';

io.on('connection', (socket) => {

  socket.on('join_room', async ({ roomKey, username }) => {
    socket.join(roomKey);
    socket.username = username;
    socket.roomKey = roomKey;

    // Track online users
    if (!chatRooms[roomKey]) chatRooms[roomKey] = [];
    chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.socketId !== socket.id);
    chatRooms[roomKey].push({ socketId: socket.id, username });
    io.to(roomKey).emit('room_users', chatRooms[roomKey]);

    // Send full message history to the newly joined user
    try {
      const history = await ChatMessage.find({ roomKey })
        .sort({ createdAt: 1 })
        .limit(200);
      socket.emit('message_history', history.map(m => ({
        id: m._id.toString(),
        sender: m.username,
        text: m.message || '',
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        type: m.messageType,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (err) {
      console.error('History load error:', err);
    }

    // Notify others
    const joinMsg = {
      id: Date.now().toString(),
      sender: 'System',
      text: `${username} joined the room`,
      isSystem: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.to(roomKey).emit('receive_message', joinMsg);
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

    // Broadcast to ALL users in room (including sender)
    io.to(roomKey).emit('receive_message', msg);

    // Save to MongoDB
    try {
      await ChatMessage.create({ roomKey, username, message, messageType: 'text' });
    } catch (err) {
      console.error('Save message error:', err);
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
      console.error('Save file message error:', err);
    }
  });

  socket.on('disconnect', () => {
    for (const roomKey in chatRooms) {
      const user = chatRooms[roomKey].find(u => u.socketId === socket.id);
      if (user) {
        chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.socketId !== socket.id);
        const leaveMsg = {
          id: Date.now().toString(),
          sender: 'System',
          text: `${user.username} left the room`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        io.to(roomKey).emit('receive_message', leaveMsg);
        io.to(roomKey).emit('room_users', chatRooms[roomKey]);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
