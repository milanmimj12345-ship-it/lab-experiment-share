import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, LogOut, User, Paperclip } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const BACKEND = 'https://lab-experiment-share-production.up.railway.app';

const ChatRoomPage = ({ navigate, chatUser }) => {
  const username = chatUser?.username || 'Anonymous';
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [online, setOnline] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const mountedRef = useRef(true);

  // ✅ Load history via HTTP on mount - reliable
  useEffect(() => {
    axios.get('/api/chat/history')
      .then(res => {
        if (!mountedRef.current) return;
        const history = (res.data.messages || []).map(m => ({
          id: m._id,
          sender: m.username,
          text: m.message || '',
          fileUrl: m.fileUrl,
          fileName: m.fileName,
          type: m.messageType,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(history);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ✅ Socket for real-time only
  useEffect(() => {
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { roomKey: 'lab_chat_global', username });
    });

    socket.on('receive_message', (msg) => {
      if (!mountedRef.current) return;
      setMessages(prev => {
        // Avoid duplicates by id
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('room_users', (users) => {
      if (!mountedRef.current) return;
      setOnline(Array.isArray(users) ? users.length : 1);
    });

    return () => {
      mountedRef.current = false;
      socket.disconnect();
    };
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socketRef.current?.emit('send_message', {
      roomKey: 'lab_chat_global',
      message: newMessage,
      username
    });
    setNewMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return toast.error('Max 40MB');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('experimentId', '000000000000000000000000');
      fd.append('group', 'A');
      fd.append('lab', 'DBMS');
      const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      socketRef.current?.emit('share_file', {
        roomKey: 'lab_chat_global',
        fileUrl: r.data.file.fileUrl,
        fileName: r.data.file.originalName,
        username
      });
      toast.success('File shared!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const isMe = (sender) => sender === username;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: '64px', background: '#000' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #00c2ff, #00ffcc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="#000" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff' }}>Lab Discussion Room</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff8c' }} />
              <span style={{ color: '#00ff8c', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>{online} Online</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '10px', padding: '6px 14px' }}>
            <span style={{ color: '#ff6b00', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>{username}</span>
          </div>
          <button onClick={() => navigate('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#999', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Exit <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#444', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '40px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#333', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '40px' }}>
            No messages yet — say hello! 👋
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.isSystem ? 'center' : isMe(m.sender) ? 'flex-end' : 'flex-start' }}>
              {m.isSystem ? (
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#444', textTransform: 'uppercase', letterSpacing: '3px', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {m.text}
                </span>
              ) : (
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexDirection: isMe(m.sender) ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: isMe(m.sender) ? '#00c2ff' : '#ff6b00', textTransform: 'uppercase' }}>{m.sender}</span>
                    <span style={{ fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>{m.timestamp}</span>
                  </div>
                  {m.type === 'file' ? (
                    <a href={m.fileUrl} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: isMe(m.sender) ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: isMe(m.sender) ? '#00c2ff' : 'rgba(255,255,255,0.08)', color: isMe(m.sender) ? '#000' : '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', wordBreak: 'break-all' }}>
                      <Paperclip size={14} style={{ flexShrink: 0 }} /> {m.fileName || m.text}
                    </a>
                  ) : (
                    <div style={{ padding: '12px 18px', borderRadius: isMe(m.sender) ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: isMe(m.sender) ? '#00c2ff' : 'rgba(255,255,255,0.08)', color: isMe(m.sender) ? '#000' : '#fff', fontWeight: 600, fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      {m.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.95)', flexShrink: 0 }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', color: '#555', flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
            <Paperclip size={18} />
            <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={`Message as ${username}...`}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 20px', color: '#fff', fontWeight: 600, fontSize: '14px', outline: 'none', fontFamily: 'Space Grotesk, sans-serif' }}
          />
          <button type="submit"
            style={{ width: '44px', height: '44px', background: '#00c2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <Send size={18} color="#000" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomPage;
