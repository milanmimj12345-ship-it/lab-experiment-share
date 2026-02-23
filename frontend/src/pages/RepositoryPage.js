import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Folder, Download, ThumbsUp, ThumbsDown, AlertTriangle, Trash2, Eye } from 'lucide-react';
import { isImage, PreviewModal } from './PreviewModal';

const FileCard = ({ file, onLike, onDislike, onDelete, onPreview }) => {
  const flagged = (file.dislikes || 0) >= 5;
  const canPreview = isImage(file.originalName);
  return (
    <div className={`relative bg-black/40 border p-6 rounded-[1.5rem] flex flex-col justify-between h-56 shadow-xl group transition-all hover:border-white/20 ${flagged ? 'border-red-500/40' : 'border-white/5'}`}>
      {flagged && (
        <div className="absolute top-0 right-0 p-2 bg-red-600/20 text-red-500 rounded-bl-2xl rounded-tr-[1.5rem] border-l border-b border-red-500/30 flex items-center gap-1 text-[9px] font-black uppercase">
          <AlertTriangle className="w-3 h-3" /> May Contain Errors
        </div>
      )}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-[#ff6b00] transition-colors">
            <Folder className="w-7 h-7" />
          </div>
          <span className="text-[9px] text-zinc-600 font-mono uppercase bg-white/5 px-2 py-1 rounded-full">
            {file.originalName?.split('.').pop() || 'file'}
          </span>
        </div>
        <h5 className="font-black text-base mb-1 truncate">{file.originalName}</h5>
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
          {file.uploadedAt ? new Date(file.createdAt).toLocaleDateString() : 'Just now'}
        </p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => onLike(file._id)} className="flex items-center gap-1 text-zinc-500 hover:text-green-400 text-xs font-bold transition-colors">
            <ThumbsUp className="w-4 h-4" /> {file.likes || 0}
          </button>
          <button onClick={() => onDislike(file._id)} className="flex items-center gap-1 text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors">
            <ThumbsDown className="w-4 h-4" /> {file.dislikes || 0}
          </button>
        </div>
        <div className="flex gap-2">
          {canPreview && (
            <button onClick={() => onPreview(file)}
              className="w-9 h-9 bg-zinc-900 border border-white/5 text-[#00c2ff] rounded-xl hover:bg-[#00c2ff] hover:text-black transition-all flex items-center justify-center"
              title="Preview">
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={async () => {
              try {
                const response = await fetch(file.fileUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.originalName || 'download';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch {
                window.open(file.fileUrl, '_blank');
              }
            }}
            className="w-9 h-9 bg-zinc-900 border border-white/5 text-[#ff6b00] rounded-xl hover:bg-[#ff6b00] hover:text-black transition-all flex items-center justify-center">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(file._id)} className="w-9 h-9 bg-zinc-900 border border-white/5 text-zinc-600 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ExperimentSection = ({ experiment, group, lab, isRandom }) => {
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axios.get(`/api/files?experiment=${experiment._id}`)
      .then(r => setFiles(r.data.files || []))
      .catch(() => {});
  }, [experiment._id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return toast.error('Max 40MB!');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('experimentId', experiment._id);
    fd.append('group', group);
    fd.append('lab', lab);
    try {
      const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles(prev => [r.data.file, ...prev]);
      toast.success('File uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleLike = async (id) => {
    try {
      const r = await axios.post(`/api/files/${id}/like`);
      setFiles(prev => prev.map(f => f._id === id ? { ...f, likes: r.data.likes } : f));
    } catch {}
  };

  const handleDislike = async (id) => {
    try {
      const r = await axios.post(`/api/files/${id}/dislike`);
      setFiles(prev => prev.map(f => f._id === id ? { ...f, dislikes: r.data.dislikes, isFlagged: r.data.isFlagged } : f));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await axios.delete(`/api/files/${id}`);
      setFiles(prev => prev.filter(f => f._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-4 text-left">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isRandom ? 'text-[#00c2ff] bg-[#00c2ff]' : 'text-[#ff6b00] bg-[#ff6b00]'}`} />
          <h4 className="text-2xl font-black uppercase tracking-tight">{experiment.title}</h4>
          <span className="text-zinc-600 text-sm">{open ? '▾' : '▸'}</span>
        </button>
        <label className={`cursor-pointer text-[10px] bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-full font-black border border-white/10 tracking-widest uppercase transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">
              No Files Yet — Upload First
            </div>
          ) : (
            files.map(f => <FileCard key={f._id} file={f} onLike={handleLike} onDislike={handleDislike} onDelete={handleDelete} onPreview={setPreviewFile} />)
          )}
        </div>
      )}
    </div>
  );
};

const RepositoryPage = ({ navigate, group, lab }) => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRandomForm, setShowRandomForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const regular = experiments.filter(e => !e.isRandom);
  const random = experiments.filter(e => e.isRandom);

  useEffect(() => {
    axios.get(`/api/experiments?group=${group}&lab=${lab}`)
      .then(r => setExperiments(r.data.experiments || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [group, lab]);

  const createExp = async (isRandom = false) => {
    if (!newTitle.trim()) return toast.error('Enter a title');
    setCreating(true);
    try {
      const r = await axios.post('/api/experiments', { title: newTitle, group, lab, isRandom });
      setExperiments(prev => [...prev, r.data.experiment]);
      setNewTitle('');
      setShowForm(false);
      setShowRandomForm(false);
      toast.success('Created!');
    } catch { toast.error('Failed'); }
    finally { setCreating(false); }
  };

  const deleteExp = async (id) => {
    if (!window.confirm('Delete this experiment and all its files?')) return;
    try {
      await axios.delete(`/api/experiments/${id}`);
      setExperiments(prev => prev.filter(e => e._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const CreateForm = ({ isRandom, onClose }) => (
    <div className="bg-zinc-900/80 border border-[#ff6b00]/40 rounded-[2rem] p-8 mb-8 animate-fade-in">
      <h3 className="text-white font-black mb-4 uppercase text-sm tracking-widest">{isRandom ? 'New Random Experiment' : 'New Experiment Header'}</h3>
      <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createExp(isRandom)}
        placeholder="e.g. Experiment 1: Introduction to SQL"
        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 mb-4 outline-none text-white font-bold focus:border-[#ff6b00] transition-all" autoFocus />
      <div className="flex gap-3">
        <button onClick={() => createExp(isRandom)} disabled={creating}
          className="bg-white text-black px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {creating ? 'Creating...' : 'Create'}
        </button>
        <button onClick={onClose} className="bg-white/5 text-white px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-wider hover:bg-white/10 transition-colors">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 pt-32 max-w-7xl mx-auto animate-fade-in">
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <button onClick={() => navigate('group_select')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-xs font-black uppercase tracking-widest transition-all group">
        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5"><ArrowLeft className="w-4 h-4" /></div>
        Back to Selection
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h2 className="text-5xl font-black tracking-tighter uppercase">
          Group {group} <span className="text-zinc-800">/</span> <span className="text-[#ff6b00]">{lab}</span>
        </h2>
        <button onClick={() => { setShowForm(true); setShowRandomForm(false); setNewTitle(''); }}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-black hover:bg-zinc-200 transition-colors shadow-lg text-sm uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Create Header
        </button>
      </div>

      {showForm && <CreateForm isRandom={false} onClose={() => setShowForm(false)} />}

      {/* Regular Experiments */}
      <section className="mb-16">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-6">Course Experiments</h3>
        {loading ? (
          <div className="text-zinc-600 font-black uppercase tracking-widest text-xs text-center py-20">Loading...</div>
        ) : regular.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">
            No Experiments Yet — Click "Create Header" to add one
          </div>
        ) : (
          <div className="space-y-8">
            {regular.map(exp => (
              <div key={exp._id} className="relative">
                <button onClick={() => deleteExp(exp._id)} className="absolute top-6 right-6 z-10 w-8 h-8 bg-black/40 border border-white/5 text-zinc-600 hover:text-red-400 rounded-xl flex items-center justify-center transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <ExperimentSection experiment={exp} group={group} lab={lab} isRandom={false} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Random Experiments */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Random Experiments</h3>
          <button onClick={() => { setShowRandomForm(true); setShowForm(false); setNewTitle(''); }}
            className="flex items-center gap-2 bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#00c2ff]/20 transition-colors">
            <Plus className="w-3 h-3" /> Add Random
          </button>
        </div>

        {showRandomForm && <CreateForm isRandom={true} onClose={() => setShowRandomForm(false)} />}

        {random.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">
            No Random Experiments Yet
          </div>
        ) : (
          <div className="space-y-8">
            {random.map(exp => (
              <div key={exp._id} className="relative">
                <button onClick={() => deleteExp(exp._id)} className="absolute top-6 right-6 z-10 w-8 h-8 bg-black/40 border border-white/5 text-zinc-600 hover:text-red-400 rounded-xl flex items-center justify-center transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <ExperimentSection experiment={exp} group={group} lab={lab} isRandom={true} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RepositoryPage;
