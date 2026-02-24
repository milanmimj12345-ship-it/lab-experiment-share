import React, { useState, useEffect, useRef } from 'react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Folder, FolderOpen, Download, ThumbsUp, ThumbsDown,
  AlertTriangle, Trash2, Eye, Upload, FolderPlus, FolderUp, X, ChevronDown, ChevronRight, File as FileIcon
} from 'lucide-react';
import { isImage, PreviewModal } from './PreviewModal';

// ─── File Card ────────────────────────────────────────────────────────────────
const FileCard = ({ file, onLike, onDislike, onDelete, onPreview }) => {
  const flagged = (file.dislikes || 0) >= 5;
  const canPreview = isImage(file.originalName);
  return (
    <div className={`relative bg-black/40 border p-5 rounded-[1.5rem] flex flex-col justify-between h-52 shadow-xl group transition-all hover:border-white/20 ${flagged ? 'border-red-500/40' : 'border-white/5'}`}>
      {flagged && (
        <div className="absolute top-0 right-0 p-2 bg-red-600/20 text-red-500 rounded-bl-2xl rounded-tr-[1.5rem] border-l border-b border-red-500/30 flex items-center gap-1 text-[9px] font-black uppercase">
          <AlertTriangle className="w-3 h-3" /> May Contain Errors
        </div>
      )}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-[#ff6b00] transition-colors">
            <FileIcon className="w-5 h-5" />
          </div>
          <span className="text-[9px] text-zinc-600 font-mono uppercase bg-white/5 px-2 py-1 rounded-full">
            {file.originalName?.split('.').pop() || 'file'}
          </span>
        </div>
        <h5 className="font-black text-sm mb-1 truncate">{file.originalName}</h5>
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
          {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Just now'}
        </p>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={() => onLike(file._id)} className="flex items-center gap-1 text-zinc-500 hover:text-green-400 text-xs font-bold transition-colors">
            <ThumbsUp className="w-3 h-3" /> {file.likes || 0}
          </button>
          <button onClick={() => onDislike(file._id)} className="flex items-center gap-1 text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors">
            <ThumbsDown className="w-3 h-3" /> {file.dislikes || 0}
          </button>
        </div>
        <div className="flex gap-1.5">
          {canPreview && (
            <button onClick={() => onPreview(file)}
              className="w-8 h-8 bg-zinc-900 border border-white/5 text-[#00c2ff] rounded-xl hover:bg-[#00c2ff] hover:text-black transition-all flex items-center justify-center"
              title="Preview">
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={async () => {
              try {
                const response = await fetch(file.fileUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = file.originalName || 'download';
                document.body.appendChild(a); a.click(); a.remove();
                window.URL.revokeObjectURL(url);
              } catch { window.open(file.fileUrl, '_blank'); }
            }}
            className="w-8 h-8 bg-zinc-900 border border-white/5 text-[#ff6b00] rounded-xl hover:bg-[#ff6b00] hover:text-black transition-all flex items-center justify-center">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(file._id)} className="w-8 h-8 bg-zinc-900 border border-white/5 text-zinc-600 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Folder Section (files inside a folder) ──────────────────────────────────
const FolderSection = ({ folderName, files, experimentId, group, lab, onLike, onDislike, onDelete, onPreview, onFolderDelete, onFilesAdded }) => {
  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleAddFiles = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    const oversized = selectedFiles.find(f => f.size > 40 * 1024 * 1024);
    if (oversized) return toast.error('Max 40MB per file!');
    setUploading(true);
    try {
      const results = [];
      for (const file of selectedFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('experimentId', experimentId);
        fd.append('group', group);
        fd.append('lab', lab);
        fd.append('folderName', folderName);
        const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        results.push(r.data.file);
      }
      onFilesAdded(folderName, results);
      toast.success(`${results.length} file(s) added to "${folderName}"!`);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const realFiles = files.filter(f => !f.isFolder);

  return (
    <div className="bg-zinc-950/60 border border-white/8 rounded-[1.5rem] overflow-hidden">
      {/* Folder header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left flex-1">
          <div className="w-9 h-9 bg-[#ff6b00]/10 rounded-xl flex items-center justify-center">
            {open ? <FolderOpen className="w-5 h-5 text-[#ff6b00]" /> : <Folder className="w-5 h-5 text-[#ff6b00]" />}
          </div>
          <div>
            <p className="font-black text-sm text-white">{folderName}</p>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{realFiles.length} file{realFiles.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="text-zinc-600 ml-2">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Add files to this folder */}
          <label className={`cursor-pointer flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full font-black border border-white/10 tracking-widest uppercase transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Plus className="w-3 h-3" />
            {uploading ? 'Uploading...' : 'Add Files'}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAddFiles} disabled={uploading} />
          </label>
          {/* Delete folder */}
          <button onClick={() => onFolderDelete(folderName)}
            className="w-7 h-7 bg-zinc-900 border border-white/5 text-zinc-600 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
            title="Delete folder">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Files grid */}
      {open && (
        <div className="p-6">
          {realFiles.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-[1.5rem] text-zinc-700 font-black uppercase tracking-widest text-[10px]">
              Empty Folder — Click "Add Files" to upload
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {realFiles.map(f => (
                <FileCard key={f._id} file={f} onLike={onLike} onDislike={onDislike} onDelete={onDelete} onPreview={onPreview} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Create Folder Modal ──────────────────────────────────────────────────────
const CreateFolderModal = ({ onConfirm, onClose }) => {
  const [name, setName] = useState('');
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 0 60px rgba(255,107,0,0.1)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff6b00]/15 rounded-xl flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-[#ff6b00]" />
            </div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest">New Folder</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">Enter a name for your new folder</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
          placeholder="e.g. Group A Screenshots"
          autoFocus
          className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3.5 mb-5 outline-none text-white font-bold focus:border-[#ff6b00] transition-all text-sm"
        />
        <div className="flex gap-3">
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="flex-1 bg-[#ff6b00] text-black px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-[#ff9e00] transition-colors disabled:opacity-40 disabled:pointer-events-none">
            Create Folder
          </button>
          <button onClick={onClose} className="bg-white/5 text-white px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Upload Menu ─────────────────────────────────────────────────────────────
const UploadMenu = ({ onSingleFile, onFolderUpload, onCreateFolder, uploading }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={uploading}
        className={`flex items-center gap-2 text-[10px] bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full font-black border border-white/10 tracking-widest uppercase transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Upload className="w-3 h-3" />
        {uploading ? 'Uploading...' : 'Upload'}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
          {/* Upload single file */}
          <label className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
            <FileIcon className="w-4 h-4 text-[#ff6b00]" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Upload File</span>
            <input type="file" className="hidden" onChange={(e) => { onSingleFile(e); setOpen(false); }} />
          </label>

          {/* Upload folder */}
          <label className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-t border-white/5">
            <FolderUp className="w-4 h-4 text-[#00c2ff]" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Upload Folder</span>
            <input type="file" className="hidden" webkitdirectory="true" multiple onChange={(e) => { onFolderUpload(e); setOpen(false); }} />
          </label>

          {/* Create empty folder */}
          <button
            onClick={() => { onCreateFolder(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-t border-white/5">
            <FolderPlus className="w-4 h-4 text-[#00ff8c]" />
            <span className="text-xs font-black text-white uppercase tracking-wider">New Empty Folder</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Experiment Section ───────────────────────────────────────────────────────
const ExperimentSection = ({ experiment, group, lab, isRandom, onPreview }) => {
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  useEffect(() => {
    axios.get(`/api/files?experiment=${experiment._id}`)
      .then(r => setFiles(r.data.files || []))
      .catch(() => {});
  }, [experiment._id]);

  // Group files: root files + folders
  const rootFiles = files.filter(f => !f.folderName && !f.isFolder);
  const folderMap = {};
  files.filter(f => f.folderName).forEach(f => {
    if (!folderMap[f.folderName]) folderMap[f.folderName] = [];
    folderMap[f.folderName].push(f);
  });
  const folderNames = Object.keys(folderMap);

  // Single file upload (root)
  const handleSingleUpload = async (e) => {
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

  // Folder upload (webkitdirectory)
  const handleFolderUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    // Get folder name from path
    const firstPath = selectedFiles[0].webkitRelativePath || selectedFiles[0].name;
    const folderName = firstPath.includes('/') ? firstPath.split('/')[0] : `Folder_${Date.now()}`;
    const oversized = selectedFiles.find(f => f.size > 40 * 1024 * 1024);
    if (oversized) return toast.error('Max 40MB per file!');
    setUploading(true);
    try {
      const fd = new FormData();
      selectedFiles.forEach(f => fd.append('files', f));
      fd.append('experimentId', experiment._id);
      fd.append('group', group);
      fd.append('lab', lab);
      fd.append('folderName', folderName);
      const r = await axios.post('/api/files/upload-folder', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles(prev => [...(r.data.files || []), ...prev.filter(f => !(f.folderName === folderName && f.isFolder))]);
      toast.success(`Folder "${folderName}" uploaded with ${r.data.files.length} file(s)!`);
    } catch { toast.error('Folder upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  // Create empty folder
  const handleCreateFolder = async (folderName) => {
    try {
      const r = await axios.post('/api/files/create-folder', {
        experimentId: experiment._id, group, lab, folderName
      });
      setFiles(prev => [r.data.file, ...prev]);
      setShowFolderModal(false);
      toast.success(`Folder "${folderName}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    }
  };

  // Delete folder
  const handleFolderDelete = async (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all its files?`)) return;
    try {
      await axios.delete(`/api/files/folder/${experiment._id}/${encodeURIComponent(folderName)}`);
      setFiles(prev => prev.filter(f => f.folderName !== folderName));
      toast.success(`Folder "${folderName}" deleted`);
    } catch { toast.error('Failed to delete folder'); }
  };

  // Files added to a folder
  const handleFilesAdded = (folderName, newFiles) => {
    setFiles(prev => [...newFiles, ...prev.filter(f => !(f.folderName === folderName && f.isFolder))]);
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
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
      {showFolderModal && (
        <CreateFolderModal onConfirm={handleCreateFolder} onClose={() => setShowFolderModal(false)} />
      )}

      {/* Experiment header */}
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-4 text-left">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isRandom ? 'text-[#00c2ff] bg-[#00c2ff]' : 'text-[#ff6b00] bg-[#ff6b00]'}`} />
          <h4 className="text-2xl font-black uppercase tracking-tight">{experiment.title}</h4>
          <span className="text-zinc-600 text-sm">{open ? '▾' : '▸'}</span>
        </button>

        <UploadMenu
          uploading={uploading}
          onSingleFile={handleSingleUpload}
          onFolderUpload={handleFolderUpload}
          onCreateFolder={() => setShowFolderModal(true)}
        />
      </div>

      {open && (
        <div className="space-y-6">
          {/* Root files */}
          {rootFiles.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Files</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rootFiles.map(f => (
                  <FileCard key={f._id} file={f} onLike={handleLike} onDislike={handleDislike} onDelete={handleDelete} onPreview={onPreview} />
                ))}
              </div>
            </div>
          )}

          {/* Folders */}
          {folderNames.length > 0 && (
            <div>
              {rootFiles.length > 0 && <div className="border-t border-white/5 my-4" />}
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Folders</p>
              <div className="space-y-4">
                {folderNames.map(fn => (
                  <FolderSection
                    key={fn}
                    folderName={fn}
                    files={folderMap[fn]}
                    experimentId={experiment._id}
                    group={group}
                    lab={lab}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onDelete={handleDelete}
                    onPreview={onPreview}
                    onFolderDelete={handleFolderDelete}
                    onFilesAdded={handleFilesAdded}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {rootFiles.length === 0 && folderNames.length === 0 && (
            <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">
              No Files Yet — Use Upload Menu Above
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Repository Page ─────────────────────────────────────────────────────────
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
      setNewTitle(''); setShowForm(false); setShowRandomForm(false);
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
                <ExperimentSection experiment={exp} group={group} lab={lab} isRandom={false} onPreview={setPreviewFile} />
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
                <ExperimentSection experiment={exp} group={group} lab={lab} isRandom={true} onPreview={setPreviewFile} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RepositoryPage;
