import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import GroupSelectPage from './pages/GroupSelectPage';
import RepositoryPage from './pages/RepositoryPage';
import ChatLoginPage from './pages/ChatLoginPage';
import ChatRoomPage from './pages/ChatRoomPage';
import DirectSharePage from './pages/DirectSharePage';
import GamePage from './pages/GamePage';

const App = () => {
  const [view, setView] = useState('home');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  const [chatUser, setChatUser] = useState(null);

  const navigate = (v, opts = {}) => {
    if (opts.group) setSelectedGroup(opts.group);
    if (opts.lab) setSelectedLab(opts.lab);
    if (opts.chatUser) setChatUser(opts.chatUser);
    setView(v);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: '700' }
      }} />

      {/* Background waves */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
        <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none">
          <path d="M0 400C120 350 240 350 360 400C480 450 600 450 720 400C840 350 960 350 1080 400C1200 450 1320 450 1440 400V800H0V400Z" fill="url(#wg)" />
          <defs>
            <linearGradient id="wg" x1="720" y1="400" x2="720" y2="800" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff6b00" stopOpacity="0.08" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Navbar - hide on game and chat room */}
      {view !== 'game' && view !== 'chat_room' && (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b00] to-[#ff9e00] rounded-lg flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(255,107,0,0.4)]">A</div>
            <span className="text-lg font-extrabold tracking-tighter text-white uppercase">Adamvilla <span className="text-[#ff6b00]">.</span></span>
          </div>
          {view !== 'home' && (
            <button onClick={() => navigate('home')} className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all">← Home</button>
          )}
        </nav>
      )}

      {/* Navbar for game/chat */}
      {(view === 'game' || view === 'chat_room') && (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b00] to-[#ff9e00] rounded-lg flex items-center justify-center font-bold text-black text-sm">A</div>
            <span className="text-lg font-extrabold tracking-tighter text-white uppercase">Adamvilla <span className="text-[#ff6b00]">.</span></span>
          </div>
        </nav>
      )}

      {/* Main */}
      <main className="relative z-10">
        {view === 'home' && <HomePage navigate={navigate} />}
        {view === 'group_select' && <GroupSelectPage navigate={navigate} />}
        {view === 'repository' && <RepositoryPage navigate={navigate} group={selectedGroup} lab={selectedLab} />}
        {view === 'chat_login' && <ChatLoginPage navigate={navigate} />}
        {view === 'chat_room' && <ChatRoomPage navigate={navigate} chatUser={chatUser} />}
        {view === 'direct_share' && <DirectSharePage navigate={navigate} />}
        {view === 'game' && <GamePage navigate={navigate} />}
      </main>

      {view !== 'chat_room' && view !== 'game' && (
        <footer className="relative z-10 border-t border-white/5 py-10 px-8 mt-20 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center font-black text-zinc-500 border border-white/5">A</div>
              <span className="text-lg font-black tracking-tighter text-zinc-600 uppercase">Adamvilla <span className="text-[#ff6b00]">.</span></span>
            </div>
            <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest">© 2025 Adamvilla. Academic Experiment Platform.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
