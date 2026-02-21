const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware - allow ALL origins
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/files', require('./routes/files'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/share', require('./routes/share'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io
const chatRooms = {};
io.on('connection', (socket) => {
  socket.on('join_room', ({ roomKey, username, collegeId }) => {
    socket.join(roomKey);
    if (!chatRooms[roomKey]) chatRooms[roomKey] = [];
    chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.collegeId !== collegeId);
    chatRooms[roomKey].push({ socketId: socket.id, username, collegeId });
    io.to(roomKey).emit('user_joined', { username, message: `${username} joined`, timestamp: new Date(), type: 'system' });
    io.to(roomKey).emit('room_users', chatRooms[roomKey]);
  });
  socket.on('send_message', ({ roomKey, message, username, collegeId }) => {
    io.to(roomKey).emit('receive_message', { id: Date.now().toString(), username, collegeId, message, timestamp: new Date(), type: 'text' });
  });
  socket.on('share_file', ({ roomKey, fileUrl, fileName, username, collegeId }) => {
    io.to(roomKey).emit('receive_message', { id: Date.now().toString(), username, collegeId, fileUrl, fileName, timestamp: new Date(), type: 'file' });
  });
  socket.on('disconnect', () => {
    for (const roomKey in chatRooms) {
      const user = chatRooms[roomKey].find(u => u.socketId === socket.id);
      if (user) {
        chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.socketId !== socket.id);
        io.to(roomKey).emit('user_left', { username: user.username, message: `${user.username} left`, timestamp: new Date(), type: 'system' });
        io.to(roomKey).emit('room_users', chatRooms[roomKey]);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
