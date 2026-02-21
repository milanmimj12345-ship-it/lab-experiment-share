import React, { useState } from 'react';
import { Mail, Send, ArrowLeft, Paperclip, X } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const DirectSharePage = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter an email address');
    if (!file) return toast.error('Please select a file to send');
    setSending(true);

    try {
      // First upload the file to get its URL
      const fd = new FormData();
      fd.append('file', file);
      fd.append('experimentId', '000000000000000000000000');
      fd.append('group', 'A');
      fd.append('lab', 'DBMS');
      const uploadRes = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileUrl = uploadRes.data.file.fileUrl;
      const fileName = uploadRes.data.file.originalName;

      // Send email via backend
      await axios.post('/api/share/email', { email, fileUrl, fileName, message });
      toast.success(`File sent to ${email}!`);
      setEmail('');
      setFile(null);
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
      <div className="w-full max-w-3xl mb-6">
        <button onClick={() => navigate('home')} className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all group">
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5"><ArrowLeft className="w-4 h-4" /></div>
          Back to Dashboard
        </button>
      </div>

      <h2 className="text-6xl font-black mb-12 tracking-tighter uppercase">Direct <span className="text-[#00ff8c]">Send</span></h2>

      <div className="w-full max-w-3xl">
        <div className="bg-zinc-900/50 border border-white/5 p-12 rounded-[3rem] backdrop-blur-xl group hover:border-[#ff6b00]/30 transition-all shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-[#ff6b00]/10 text-[#ff6b00] rounded-[2rem] flex items-center justify-center mb-6 shadow-lg shadow-[#ff6b00]/10">
              <Mail className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Secure Email</h3>
            <p className="text-zinc-500 mt-2 text-sm text-center">Send lab files directly via email to anyone</p>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">Recipient Email</label>
              <input type="email" required placeholder="recipient@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#ff6b00] transition-all font-bold text-white placeholder:text-zinc-700" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">File to Send</label>
              {file ? (
                <div className="flex items-center justify-between bg-black border border-[#ff6b00]/30 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-[#ff6b00]" />
                    <span className="font-bold text-sm truncate max-w-xs">{file.name}</span>
                    <span className="text-zinc-600 text-xs">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="text-zinc-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-3 w-full bg-black border-2 border-dashed border-white/10 rounded-2xl px-6 py-8 cursor-pointer hover:border-[#ff6b00]/40 transition-all">
                  <Paperclip className="w-5 h-5 text-zinc-500" />
                  <span className="text-zinc-500 font-bold text-sm">Click to select file (max 40MB)</span>
                  <input type="file" className="hidden" onChange={e => { if (e.target.files[0]?.size > 40 * 1024 * 1024) { toast.error('Max 40MB'); return; } setFile(e.target.files[0]); }} />
                </label>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">Message (Optional)</label>
              <textarea placeholder="Add a note..." value={message} onChange={e => setMessage(e.target.value)} rows={3}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#ff6b00] transition-all font-bold text-white placeholder:text-zinc-700 resize-none" />
            </div>

            <button type="submit" disabled={sending}
              className="w-full py-5 bg-[#ff6b00] text-black font-black rounded-2xl hover:bg-[#ff9e00] transition-all uppercase tracking-[0.2em] shadow-xl shadow-[#ff6b00]/10 disabled:opacity-50 flex items-center justify-center gap-3 mt-2">
              <Send className="w-5 h-5" />
              {sending ? 'Sending...' : 'Dispatch Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectSharePage;
