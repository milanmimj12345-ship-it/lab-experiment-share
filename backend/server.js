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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/files', require('./routes/files'));
app.use('/api/share', require('./routes/share'));

// Chat history - returns all messages forever
app.get('/api/chat/history', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomKey: 'lab_chat_global' })
      .sort({ createdAt: 1 })
      .limit(500);
    console.log(`📨 History requested: ${messages.length} messages`);
    res.json({ success: true, messages });
  } catch (err) {
    console.error('❌ History error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

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

    socket.to(roomKey).emit('receive_message', {
      id: 'sys_' + Date.now(),
      sender: 'System',
      text: `${username} joined the room`,
      isSystem: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('send_message', async ({ roomKey, message, username }) => {
    if (!message || !message.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const msg = {
      id: msgId,
      sender: username,
      text: message,
      type: 'text',
      timestamp
    };

    // Broadcast to everyone in room
    io.to(roomKey).emit('receive_message', msg);

    // Save to MongoDB
    try {
      const saved = await ChatMessage.create({
        roomKey: roomKey || 'lab_chat_global',
        username: username || 'Anonymous',
        message: message,
        messageType: 'text'
      });
      console.log(`✅ Message saved: ${username}: ${message.substring(0, 30)} [${saved._id}]`);
    } catch (err) {
      console.error('❌ Failed to save message:', err.message);
    }
  });

  socket.on('share_file', async ({ roomKey, fileUrl, fileName, username }) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: 'file_' + Date.now(),
      sender: username,
      text: '📎 ' + fileName,
      fileUrl,
      fileName,
      type: 'file',
      timestamp
    };
    io.to(roomKey).emit('receive_message', msg);
    try {
      await ChatMessage.create({
        roomKey: roomKey || 'lab_chat_global',
        username: username || 'Anonymous',
        fileUrl,
        fileName,
        messageType: 'file'
      });
      console.log(`✅ File message saved: ${username}: ${fileName}`);
    } catch (err) {
      console.error('❌ Failed to save file message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    for (const roomKey in chatRooms) {
      const user = chatRooms[roomKey].find(u => u.socketId === socket.id);
      if (user) {
        chatRooms[roomKey] = chatRooms[roomKey].filter(u => u.socketId !== socket.id);
        io.to(roomKey).emit('receive_message', {
          id: 'sys_' + Date.now(),
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




// ── Admin Panel endpoints (no JWT — protected by frontend login) ──────────────

// GET all experiments (admin view — all groups/labs)
app.get('/api/admin-panel/experiments', async (req, res) => {
  try {
    const Experiment = require('./models/Experiment');
    const experiments = await Experiment.find().sort({ lab:1, group:1, experimentNumber:1 });
    res.json({ success: true, experiments });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// DELETE all chat messages
app.delete('/api/admin-panel/chats', async (req, res) => {
  try {
    await ChatMessage.deleteMany({});
    res.json({ success: true, message: 'All chats cleared' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// DELETE single chat message
app.delete('/api/admin-panel/chats/:id', async (req, res) => {
  try {
    await ChatMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// DELETE a file (with Cloudinary cleanup)
app.delete('/api/files/:id', async (req, res) => {
  try {
    const File = require('./models/File');
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    // Try to delete from Cloudinary
    const { cloudinary } = require('./config/cloudinary');
    if (file.publicId) {
      try { await cloudinary.uploader.destroy(file.publicId); } catch(e) { console.warn('Cloudinary delete failed:', e.message); }
    }
    await File.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// Swami Bot — receives base64 images directly, sends to Groq vision API
app.post('/api/swami-analyze', async (req, res) => {
  try {
    const { images, prompt } = req.body;
    if (!images || images.length === 0) return res.status(400).json({ error: 'No images provided' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    // Build message with all images
    const userContent = [];
    images.forEach((img, idx) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
      });
      userContent.push({ type: 'text', text: `[Image ${idx + 1}: ${img.name}]` });
    });
    userContent.push({ type: 'text', text: prompt });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: userContent }],
        max_tokens: 4096,
        temperature: 0.1
      })
    });

    const data = await groqRes.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    res.json({ success: true, text: data?.choices?.[0]?.message?.content || 'No content.' });
  } catch (err) {
    console.error('Swami analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Folder AI — fetches multiple images and sends to Groq vision API
// Called by FolderAIPreviewModal in frontend (avoids CORS)
app.post('/api/folder-ai', async (req, res) => {
  try {
    const { imageUrls, prompt } = req.body;
    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: 'No image URLs provided' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
    }

    // Fetch all images as base64 server-side (no CORS issues)
    const imageParts = [];
    for (const url of imageUrls) {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        imageParts.push({ base64, mimeType, url });
      } catch (e) {
        console.warn('Could not fetch image:', url, e.message);
      }
    }

    if (imageParts.length === 0) {
      return res.status(400).json({ error: 'Could not load any images' });
    }

    // Build Groq message with all images
    const userContent = [];
    imageParts.forEach((img, idx) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
      });
      userContent.push({
        type: 'text',
        text: `[Image ${idx + 1}]`
      });
    });
    userContent.push({ type: 'text', text: prompt });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: userContent }],
        max_tokens: 4096,
        temperature: 0.1
      })
    });

    const data = await groqRes.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    const text = data?.choices?.[0]?.message?.content || 'No content extracted.';
    res.json({ success: true, text });

  } catch (err) {
    console.error('Folder AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Image proxy - fetches Cloudinary image server-side to avoid CORS
app.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL' });
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.json({ base64, mimeType: contentType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
