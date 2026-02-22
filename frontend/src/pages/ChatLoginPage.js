import React, { useState } from 'react';
import { MessageSquare, ArrowLeft, User, Shuffle } from 'lucide-react';

const adjectives = ['Swift', 'Bright', 'Cool', 'Clever', 'Bold', 'Quick', 'Sharp', 'Calm', 'Wise', 'Keen'];
const nouns = ['Panda', 'Eagle', 'Tiger', 'Falcon', 'Wolf', 'Fox', 'Hawk', 'Bear', 'Lion', 'Shark'];

const randomName = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
};

const ChatLoginPage = ({ navigate }) => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState(null); // 'named' or 'anonymous'
  const [anonName] = useState(randomName());

  const handleNamed = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    navigate('chat_room', { chatUser: { username: name.trim() } });
  };

  const handleAnonymous = () => {
    navigate('chat_room', { chatUser: { username: anonName } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
      <div className="w-full max-w-md mb-4">
        <button onClick={() => navigate('home')} className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all group">
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Dashboard
        </button>
      </div>

      <div className="w-full max-w-md bg-zinc-900/80 border border-white/5 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl">
        <div className="w-20 h-20 bg-[#00c2ff]/10 text-[#00c2ff] rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_20px_rgba(0,194,255,0.1)]">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black text-center mb-2 tracking-tighter uppercase">Lab Chat</h2>
        <p className="text-zinc-600 text-center mb-10 font-bold uppercase text-[10px] tracking-[0.2em]">Join the Discussion Room</p>

        {/* Option buttons */}
        {!mode && (
          <div className="space-y-4">
            <button onClick={() => setMode('named')}
              className="w-full flex items-center gap-4 bg-black border border-white/10 hover:border-[#00c2ff]/50 hover:bg-[#00c2ff]/5 rounded-2xl px-6 py-5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#00c2ff]/10 text-[#00c2ff] flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-black text-white uppercase text-sm tracking-wide">Enter My Name</p>
                <p className="text-zinc-600 text-xs mt-0.5">Chat with your own name</p>
              </div>
            </button>

            <button onClick={handleAnonymous}
              className="w-full flex items-center gap-4 bg-black border border-white/10 hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/5 rounded-2xl px-6 py-5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#ff6b00]/10 text-[#ff6b00] flex items-center justify-center flex-shrink-0">
                <Shuffle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-black text-white uppercase text-sm tracking-wide">Chat Anonymously</p>
                <p className="text-zinc-600 text-xs mt-0.5">You'll be called <span className="text-[#ff6b00] font-bold">{anonName}</span></p>
              </div>
            </button>
          </div>
        )}

        {/* Name input */}
        {mode === 'named' && (
          <form onSubmit={handleNamed} className="space-y-4 animate-fade-in">
            <button type="button" onClick={() => setMode(null)} className="text-zinc-600 hover:text-white text-xs font-black uppercase tracking-widest transition-all mb-2">
              ← Back
            </button>
            <div>
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">Your Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 focus:border-[#00c2ff] outline-none transition-all text-white font-bold tracking-wide placeholder:text-zinc-800"
              />
            </div>
            <button type="submit"
              className="w-full bg-[#00c2ff] text-black font-black py-5 rounded-2xl hover:bg-[#33ceff] transition-all uppercase tracking-[0.2em] shadow-lg shadow-[#00c2ff]/20">
              Join Chat Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatLoginPage;
