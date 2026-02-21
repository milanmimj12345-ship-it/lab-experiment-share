import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, LogOut, User, Paperclip } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const BACKEND = 'https://lab-experiment-share-production.up.railway.app';

const ChatRoomPage = ({ navigate, chatUser }) => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'System', text: 'Welcome to the Lab Discussion Room.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isSystem: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [online, setOnline] = useState(1);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const username = chatUser?.username || 'Anonymous';

  useEffect(() => {
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { roomKey: 'lab_chat_global', username, collegeId: chatUser?.phone || 'anon' });
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('room_users', (users) => setOnline(users.length));

    socket.on('user_joined', (data) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'System', text: data.message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isSystem: true }]);
    });

    socket.on('user_left', (data) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'System', text: data.message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isSystem: true }]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socketRef.current?.emit('send_message', {
      roomKey: 'lab_chat_global',
      message: newMessage,
      username,
      collegeId: chatUser?.phone || 'anon'
    });
    setNewMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return toast.error('Max 40MB');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('experimentId', '000000000000000000000000');
    fd.append('group', 'A');
    fd.append('lab', 'DBMS');
    try {
      const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      socketRef.current?.emit('share_file', {
        roomKey: 'lab_chat_global',
        fileUrl: r.data.file.fileUrl,
        fileName: r.data.file.originalName,
        username,
        collegeId: chatUser?.phone || 'anon'
      });
      toast.success('File shared in chat!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const isMe = (sender) => sender === username;

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-8 px-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00c2ff] to-[#00ffcc] flex items-center justify-center font-bold text-black">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight uppercase">Lab Discussion Room</h3>
              <p className="text-[#00ff8c] text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff8c] animate-pulse" /> {online} Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs font-bold uppercase">{username}</span>
            <button onClick={() => navigate('home')} className="p-3 bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-2xl transition-all border border-white/10 flex items-center gap-2 font-black uppercase text-xs tracking-widest">
              Exit <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide min-h-[400px] max-h-[60vh]">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.isSystem ? 'items-center' : isMe(m.sender) ? 'items-end' : 'items-start'}`}>
              {m.isSystem ? (
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] bg-white/5 px-6 py-2 rounded-full border border-white/5">{m.text}</span>
              ) : (
                <div className="max-w-[75%]">
                  <div className={`flex items-center gap-3 mb-2 ${isMe(m.sender) ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-black text-zinc-500 uppercase">{m.sender}</span>
                    <span className="text-[9px] text-zinc-800 font-mono">{m.timestamp}</span>
                  </div>
                  {m.type === 'file' ? (
                    <a href={m.fileUrl} target="_blank" rel="noreferrer"
                      className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] font-bold text-sm ${isMe(m.sender) ? 'bg-[#00c2ff] text-black rounded-tr-none' : 'bg-black/50 border border-white/10 text-white rounded-tl-none'}`}>
                      <Paperclip className="w-4 h-4" /> {m.fileName}
                    </a>
                  ) : (
                    <div className={`px-6 py-4 rounded-[1.5rem] font-bold text-sm leading-relaxed ${isMe(m.sender) ? 'bg-[#00c2ff] text-black rounded-tr-none shadow-xl shadow-[#00c2ff]/10' : 'bg-black/50 border border-white/10 text-white rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-6 bg-black/60 border-t border-white/5 flex gap-4 items-center">
          <label className={`w-12 h-12 bg-zinc-900 border border-white/10 text-zinc-500 hover:text-[#00c2ff] hover:border-[#00c2ff]/40 rounded-2xl flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Paperclip className="w-5 h-5" />
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
            placeholder="Share a thought..."
            className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl px-6 py-4 focus:border-[#00c2ff] outline-none text-white font-bold placeholder:text-zinc-800" />
          <button type="submit" className="w-12 h-12 bg-[#00c2ff] text-black rounded-2xl flex items-center justify-center hover:bg-[#33ceff] transition-all shadow-xl flex-shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomPage;
