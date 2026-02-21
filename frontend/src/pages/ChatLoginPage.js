import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatLoginPage = ({ navigate }) => {
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!dob || phone.length < 8) {
      toast.error('Please enter valid DOB and phone number');
      return;
    }
    // Simple validation - DOB + phone as access key
    const username = `Student_${phone.slice(-4)}`;
    navigate('chat_room', { chatUser: { username, phone, dob } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
      <div className="w-full max-w-md mb-4">
        <button onClick={() => navigate('home')} className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all group">
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5"><ArrowLeft className="w-4 h-4" /></div>
          Back to Dashboard
        </button>
      </div>

      <div className="w-full max-w-md bg-zinc-900/80 border border-white/5 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl">
        <div className="w-20 h-20 bg-[#00c2ff]/10 text-[#00c2ff] rounded-[1.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_20px_rgba(0,194,255,0.1)]">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black text-center mb-2 tracking-tighter uppercase">Private Room</h2>
        <p className="text-zinc-600 text-center mb-10 font-bold uppercase text-[10px] tracking-[0.2em]">Lab Discussion Hub</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">Date of Birth</label>
            <input type="date" required value={dob} onChange={e => setDob(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 focus:border-[#00c2ff] outline-none transition-all text-white font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">Phone Number (Password)</label>
            <input type="tel" required placeholder="Enter your phone number" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 focus:border-[#00c2ff] outline-none transition-all text-white font-bold tracking-widest placeholder:text-zinc-800" />
          </div>
          <button type="submit" className="w-full bg-[#00c2ff] text-black font-black py-5 rounded-2xl hover:bg-[#33ceff] transition-all uppercase tracking-[0.2em] shadow-lg shadow-[#00c2ff]/20 mt-4">
            Authorize Entry
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatLoginPage;
