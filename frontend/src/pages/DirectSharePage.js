import React, { useState } from 'react';
import { Mail, Send, ArrowLeft, Paperclip, X } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const EMAILJS_SERVICE_ID = 'service_7gzl6qe';
const EMAILJS_TEMPLATE_ID = 'template_cvsrzp5';
const EMAILJS_PUBLIC_KEY = 'ILEUCJEfvPa-YokfN';

const DirectSharePage = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleAddFiles = (e) => {
    const selected = Array.from(e.target.files);
    const tooBig = selected.filter((f) => f.size > 40 * 1024 * 1024);
    if (tooBig.length > 0) {
      toast.error(tooBig.map((f) => f.name).join(', ') + ' exceeds 40MB');
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter an email address');
    if (files.length === 0) return toast.error('Please select at least one file');
    setSending(true);

    try {
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('file', file);
        fd.append('experimentId', '000000000000000000000000');
        fd.append('group', 'A');
        fd.append('lab', 'DBMS');
        const res = await axios.post('/api/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedFiles.push({
          name: res.data.file.originalName,
          url: res.data.file.fileUrl,
        });
      }

      const fileListHtml = uploadedFiles
        .map(
          (f, idx) =>
            '<div style="margin-bottom:12px;"><strong>' +
            (idx + 1) + '. ' + f.name +
            '</strong><br/><a href="' + f.url +
            '" style="color:#ff6b00;">Download File</a></div>'
        )
        .join('');

      const emailjs = await import('@emailjs/browser');
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          file_name: uploadedFiles.length === 1 ? uploadedFiles[0].name : uploadedFiles.length + ' files',
          file_url: fileListHtml,
          message: message || 'Lab files have been shared with you.',
          from_name: 'Lab Experiment Share',
        },
        EMAILJS_PUBLIC_KEY
      );

      toast.success(uploadedFiles.length + ' file(s) sent to ' + email + '!');
      setEmail('');
      setFiles([]);
      setMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send. Please try again.');
    }
    setSending(false);
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
      <div className="w-full max-w-3xl mb-6">
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all group"
        >
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Dashboard
        </button>
      </div>

      <h2 className="text-6xl font-black mb-12 tracking-tighter uppercase">
        Direct <span className="text-[#00ff8c]">Send</span>
      </h2>

      <div className="w-full max-w-3xl">
        <div className="bg-zinc-900/50 border border-white/5 p-12 rounded-[3rem] backdrop-blur-xl hover:border-[#ff6b00]/30 transition-all shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-[#ff6b00]/10 text-[#ff6b00] rounded-[2rem] flex items-center justify-center mb-6 shadow-lg shadow-[#ff6b00]/10">
              <Mail className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Secure Email</h3>
            <p className="text-zinc-500 mt-2 text-sm text-center">Send multiple lab files in one email</p>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">
                Recipient Email
              </label>
              <input
                type="email"
                required
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#ff6b00] transition-all font-bold text-white placeholder:text-zinc-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Files{' '}
                  {files.length > 0 && (
                    <span className="text-[#ff6b00]">
                      ({files.length} selected &bull; {(totalSize / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  )}
                </label>
                {files.length > 0 && (
                  <label className="cursor-pointer text-[10px] font-black text-[#ff6b00] hover:text-[#ff9e00] uppercase tracking-widest transition-colors">
                    + Add More
                    <input type="file" multiple className="hidden" onChange={handleAddFiles} />
                  </label>
                )}
              </div>

              {files.length === 0 ? (
                <label className="flex flex-col items-center justify-center gap-3 w-full bg-black border-2 border-dashed border-white/10 rounded-2xl px-6 py-10 cursor-pointer hover:border-[#ff6b00]/40 transition-all">
                  <Paperclip className="w-8 h-8 text-zinc-600" />
                  <div className="text-center">
                    <p className="text-zinc-400 font-bold text-sm">Click to select files</p>
                    <p className="text-zinc-700 text-xs mt-1">Multiple files supported &bull; Max 40MB each</p>
                  </div>
                  <input type="file" multiple className="hidden" onChange={handleAddFiles} />
                </label>
              ) : (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-black border border-[#ff6b00]/20 rounded-2xl px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-[#ff6b00] flex-shrink-0" />
                        <span className="font-bold text-sm truncate max-w-xs">{file.name}</span>
                        <span className="text-zinc-600 text-xs flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-widest">
                Message (Optional)
              </label>
              <textarea
                placeholder="Add a note..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#ff6b00] transition-all font-bold text-white placeholder:text-zinc-700 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-5 bg-[#ff6b00] text-black font-black rounded-2xl hover:bg-[#ff9e00] transition-all uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 mt-2"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Uploading & Sending...' : ('Send ' + (files.length > 1 ? files.length + ' Files' : 'File'))}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectSharePage;
