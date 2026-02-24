import React, { useState, useEffect, useRef } from 'react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, Folder, FolderOpen, Download, ThumbsUp, ThumbsDown,
  AlertTriangle, Trash2, Eye, Upload, FolderPlus, FolderUp, X,
  ChevronDown, ChevronRight, File as FileIcon, ArrowDownToLine, User, Monitor
} from 'lucide-react';
import { isImage, PreviewModal } from './PreviewModal';

// ─── Get or create a stable browser device ID ────────────────────────────────
const getDeviceId = () => {
  let id = localStorage.getItem('adamvilla_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('adamvilla_device_id', id);
  }
  return id;
};

// ─── IP color palette ─────────────────────────────────────────────────────────
const IP_COLORS = [
  { accent: '#ff6b00', bg: 'rgba(255,107,0,0.07)', border: 'rgba(255,107,0,0.2)', dot: '#ff6b00' },
  { accent: '#00c2ff', bg: 'rgba(0,194,255,0.07)', border: 'rgba(0,194,255,0.2)', dot: '#00c2ff' },
  { accent: '#00ff8c', bg: 'rgba(0,255,140,0.07)', border: 'rgba(0,255,140,0.2)', dot: '#00ff8c' },
  { accent: '#a855f7', bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.2)', dot: '#a855f7' },
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  { accent: '#ec4899', bg: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.2)', dot: '#ec4899' },
];
const getColor = (index) => IP_COLORS[index % IP_COLORS.length];

// ─── Small File Card ──────────────────────────────────────────────────────────
const FileCard = ({ file, onLike, onDislike, onDelete, onPreview, compact = false }) => {
  const flagged = (file.dislikes || 0) >= 5;
  const canPreview = isImage(file.originalName);
  const ext = file.originalName?.split('.').pop()?.toLowerCase() || 'file';

  const downloadFile = async () => {
    try {
      const response = await fetch(file.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.originalName || 'download';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { window.open(file.fileUrl, '_blank'); }
  };

  return (
    <div className={`relative bg-black/50 border rounded-2xl flex flex-col justify-between group transition-all hover:border-white/20 shadow-lg ${flagged ? 'border-red-500/40' : 'border-white/8'} ${compact ? 'p-3 h-36' : 'p-4 h-44'}`}>
      {flagged && (
        <div className="absolute top-0 right-0 p-1.5 bg-red-600/20 text-red-500 rounded-bl-xl rounded-tr-2xl border-l border-b border-red-500/30 flex items-center gap-1 text-[8px] font-black uppercase">
          <AlertTriangle className="w-2.5 h-2.5" /> Errors
        </div>
      )}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className={`bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-[#ff6b00] transition-colors ${compact ? 'w-8 h-8' : 'w-9 h-9'}`}>
            <FileIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <span className="text-[8px] text-zinc-600 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded-full">{ext}</span>
        </div>
        <h5 className={`font-black truncate leading-tight ${compact ? 'text-[11px] mb-0.5' : 'text-xs mb-1'}`} title={file.originalName}>{file.originalName}</h5>
        <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-wider">
          {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Just now'}
        </p>
      </div>
      <div className={`flex items-center justify-between border-t border-white/5 ${compact ? 'pt-2' : 'pt-3'}`}>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onLike(file._id)} className="flex items-center gap-0.5 text-zinc-600 hover:text-green-400 text-[10px] font-bold transition-colors">
            <ThumbsUp className="w-3 h-3" /> {file.likes || 0}
          </button>
          <button onClick={() => onDislike(file._id)} className="flex items-center gap-0.5 text-zinc-600 hover:text-red-400 text-[10px] font-bold transition-colors">
            <ThumbsDown className="w-3 h-3" /> {file.dislikes || 0}
          </button>
        </div>
        <div className="flex gap-1">
          {canPreview && (
            <button onClick={() => onPreview(file)} className="w-7 h-7 bg-zinc-900 border border-white/5 text-[#00c2ff] rounded-lg hover:bg-[#00c2ff] hover:text-black transition-all flex items-center justify-center" title="Preview">
              <Eye className="w-3 h-3" />
            </button>
          )}
          <button onClick={downloadFile} className="w-7 h-7 bg-zinc-900 border border-white/5 text-[#ff6b00] rounded-lg hover:bg-[#ff6b00] hover:text-black transition-all flex items-center justify-center" title="Download">
            <Download className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(file._id)} className="w-7 h-7 bg-zinc-900 border border-white/5 text-zinc-600 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center" title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Folder Card ──────────────────────────────────────────────────────────────
const FolderCard = ({ folderName, files, experimentId, group, lab, onLike, onDislike, onDelete, onPreview, onFolderDelete, onFilesAdded }) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const realFiles = files.filter(f => !f.isFolder);

  const handleAddFiles = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    if (selectedFiles.find(f => f.size > 40 * 1024 * 1024)) return toast.error('Max 40MB per file!');
    setUploading(true);
    const deviceId = getDeviceId();
    try {
      const results = [];
      for (const file of selectedFiles) {
        const fd = new FormData();
        fd.append('file', file); fd.append('experimentId', experimentId);
        fd.append('group', group); fd.append('lab', lab);
        fd.append('folderName', folderName); fd.append('deviceId', deviceId);
        const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        results.push(r.data.file);
      }
      onFilesAdded(folderName, results);
      toast.success(`${results.length} file(s) added!`);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const downloadFolder = async () => {
    if (realFiles.length === 0) return toast.error('Folder is empty!');
    toast.success(`Downloading ${realFiles.length} file(s)...`);
    for (const file of realFiles) {
      try {
        const response = await fetch(file.fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.originalName || 'file';
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
        await new Promise(r => setTimeout(r, 300));
      } catch { window.open(file.fileUrl, '_blank'); }
    }
  };

  return (
    <>
      <div className="relative bg-black/50 border border-white/8 rounded-2xl p-4 h-44 flex flex-col justify-between group transition-all hover:border-[#ff6b00]/40 shadow-lg cursor-pointer"
        onClick={() => setOpen(true)}>
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="w-9 h-9 bg-[#ff6b00]/10 rounded-xl flex items-center justify-center group-hover:bg-[#ff6b00]/20 transition-colors">
              <Folder className="w-5 h-5 text-[#ff6b00]" />
            </div>
            <span className="text-[8px] text-[#ff6b00]/60 font-mono uppercase bg-[#ff6b00]/5 px-1.5 py-0.5 rounded-full border border-[#ff6b00]/10">folder</span>
          </div>
          <h5 className="font-black text-xs truncate leading-tight mb-0.5" title={folderName}>{folderName}</h5>
          <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-wider">{realFiles.length} file{realFiles.length !== 1 ? 's' : ''} inside</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-[9px] text-zinc-600 font-black uppercase tracking-wider">Click to open</span>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={downloadFolder} className="w-7 h-7 bg-zinc-900 border border-white/5 text-[#ff6b00] rounded-lg hover:bg-[#ff6b00] hover:text-black transition-all flex items-center justify-center" title="Download all">
              <ArrowDownToLine className="w-3 h-3" />
            </button>
            <button onClick={() => onFolderDelete(folderName)} className="w-7 h-7 bg-zinc-900 border border-white/5 text-zinc-600 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center" title="Delete folder">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '28px', width: '100%', maxWidth: '1000px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 80px rgba(0,0,0,0.9)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff6b00]/15 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-[#ff6b00]" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', margin: 0 }}>{folderName}</h3>
                  <p style={{ color: '#555', fontSize: '10px', fontWeight: 700, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{realFiles.length} file{realFiles.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadFolder} className="flex items-center gap-2 px-4 py-2 bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#ff6b00]/20 transition-all">
                  <ArrowDownToLine className="w-3 h-3" /> Download All
                </button>
                <label className={`flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Plus className="w-3 h-3" /> {uploading ? 'Uploading...' : 'Add Files'}
                  <input type="file" multiple className="hidden" onChange={handleAddFiles} disabled={uploading} />
                </label>
                <button onClick={() => setOpen(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {realFiles.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">Empty Folder — Click "Add Files" to upload</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {realFiles.map(f => <FileCard key={f._id} file={f} compact onLike={onLike} onDislike={onDislike} onDelete={onDelete} onPreview={onPreview} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Device User Section — one collapsible block per unique deviceId ──────────
const DeviceUserSection = ({ deviceId, userNumber, colorScheme, deviceFiles, experimentId, group, lab, onLike, onDislike, onDelete, onPreview, onFolderDelete, onFilesAdded }) => {
  const [open, setOpen] = useState(true);
  const myDeviceId = getDeviceId();
  const isMe = deviceId === myDeviceId;

  const rootFiles = deviceFiles.filter(f => !f.folderName && !f.isFolder);
  const folderMap = {};
  deviceFiles.filter(f => f.folderName).forEach(f => {
    if (!folderMap[f.folderName]) folderMap[f.folderName] = [];
    folderMap[f.folderName].push(f);
  });
  const folderNames = Object.keys(folderMap);
  const totalItems = rootFiles.length + folderNames.length;

  return (
    <div style={{ border: `1px solid ${colorScheme.border}`, borderRadius: '18px', overflow: 'hidden', background: colorScheme.bg, marginBottom: '10px' }}>
      {/* Header bar */}
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:brightness-110 transition-all" style={{ background: 'transparent' }}>
        <div className="flex items-center gap-3">
          {/* Color dot */}
          <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: colorScheme.dot, boxShadow: `0 0 6px ${colorScheme.dot}`, flexShrink: 0 }} />

          {/* User label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${colorScheme.border}`, borderRadius: '999px', padding: '3px 10px' }}>
            <User style={{ width: '9px', height: '9px', color: colorScheme.accent }} />
            <span style={{ color: colorScheme.accent, fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              User {userNumber}
            </span>
          </div>

          {/* "You" badge if this is the current browser */}
          {isMe && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', padding: '2px 8px' }}>
              <Monitor style={{ width: '8px', height: '8px', color: '#aaa' }} />
              <span style={{ color: '#aaa', fontWeight: 900, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>This Device</span>
            </div>
          )}

          {/* Item count */}
          <span style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '999px', padding: '2px 8px', color: '#555', fontWeight: 900, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ color: '#444', fontSize: '11px' }}>{open ? '▾' : '▸'}</span>
      </button>

      {/* Files grid */}
      {open && (
        <div style={{ padding: '4px 14px 14px' }}>
          {totalItems === 0 ? (
            <div className="py-6 text-center text-zinc-700 font-black uppercase tracking-widest text-[9px]">No files</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {folderNames.map(fn => (
                <FolderCard key={fn} folderName={fn} files={folderMap[fn]}
                  experimentId={experimentId} group={group} lab={lab}
                  onLike={onLike} onDislike={onDislike} onDelete={onDelete} onPreview={onPreview}
                  onFolderDelete={onFolderDelete} onFilesAdded={onFilesAdded}
                />
              ))}
              {rootFiles.map(f => (
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
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#ff6b00]/15 rounded-xl flex items-center justify-center"><FolderPlus className="w-4 h-4 text-[#ff6b00]" /></div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest">New Folder</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
          placeholder="e.g. Group A Screenshots" autoFocus
          className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 mb-4 outline-none text-white font-bold focus:border-[#ff6b00] transition-all text-sm" />
        <div className="flex gap-3">
          <button onClick={() => name.trim() && onConfirm(name.trim())} disabled={!name.trim()}
            className="flex-1 bg-[#ff6b00] text-black px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-[#ff9e00] transition-colors disabled:opacity-40 disabled:pointer-events-none">
            Create Folder
          </button>
          <button onClick={onClose} className="bg-white/5 text-white px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Upload Dropdown ──────────────────────────────────────────────────────────
const UploadMenu = ({ onSingleFile, onFolderUpload, onCreateFolder, uploading }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} disabled={uploading}
        className={`flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full font-black border border-white/10 tracking-widest uppercase transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload'}<ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
          <label className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
            <FileIcon className="w-4 h-4 text-[#ff6b00]" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">Upload File</span>
            <input type="file" className="hidden" onChange={(e) => { onSingleFile(e); setOpen(false); }} />
          </label>
          <label className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-t border-white/5">
            <FolderUp className="w-4 h-4 text-[#00c2ff]" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">Upload Folder</span>
            <input type="file" className="hidden" webkitdirectory="true" multiple onChange={(e) => { onFolderUpload(e); setOpen(false); }} />
          </label>
          <button onClick={() => { onCreateFolder(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-t border-white/5">
            <FolderPlus className="w-4 h-4 text-[#00ff8c]" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">New Empty Folder</span>
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

  // Group by deviceId — maintain first-seen order
  const deviceOrder = [];
  const deviceMap = {};
  files.forEach(f => {
    const key = f.deviceId && f.deviceId !== 'unknown' ? f.deviceId : (f.uploaderIp || 'unknown');
    if (!deviceMap[key]) { deviceMap[key] = []; deviceOrder.push(key); }
    deviceMap[key].push(f);
  });

  const handleSingleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return toast.error('Max 40MB!');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file); fd.append('experimentId', experiment._id);
    fd.append('group', group); fd.append('lab', lab);
    fd.append('deviceId', getDeviceId());
    try {
      const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles(prev => [...prev, r.data.file]);
      toast.success('File uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleFolderUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    const firstPath = selectedFiles[0].webkitRelativePath || selectedFiles[0].name;
    const folderName = firstPath.includes('/') ? firstPath.split('/')[0] : `Folder_${Date.now()}`;
    if (selectedFiles.find(f => f.size > 40 * 1024 * 1024)) return toast.error('Max 40MB per file!');
    setUploading(true);
    try {
      const fd = new FormData();
      selectedFiles.forEach(f => fd.append('files', f));
      fd.append('experimentId', experiment._id); fd.append('group', group);
      fd.append('lab', lab); fd.append('folderName', folderName);
      fd.append('deviceId', getDeviceId());
      const r = await axios.post('/api/files/upload-folder', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles(prev => [...prev.filter(f => !(f.folderName === folderName && f.isFolder)), ...(r.data.files || [])]);
      toast.success(`Folder "${folderName}" uploaded with ${r.data.files.length} file(s)!`);
    } catch { toast.error('Folder upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      const r = await axios.post('/api/files/create-folder', { experimentId: experiment._id, group, lab, folderName, deviceId: getDeviceId() });
      setFiles(prev => [...prev, r.data.file]);
      setShowFolderModal(false);
      toast.success(`Folder "${folderName}" created!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create folder'); }
  };

  const handleFolderDelete = async (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all its files?`)) return;
    try {
      await axios.delete(`/api/files/folder/${experiment._id}/${encodeURIComponent(folderName)}`);
      setFiles(prev => prev.filter(f => f.folderName !== folderName));
      toast.success(`Folder "${folderName}" deleted`);
    } catch { toast.error('Failed to delete folder'); }
  };

  const handleFilesAdded = (folderName, newFiles) => {
    setFiles(prev => [...prev.filter(f => !(f.folderName === folderName && f.isFolder)), ...newFiles]);
  };

  const handleLike = async (id) => {
    try { const r = await axios.post(`/api/files/${id}/like`); setFiles(prev => prev.map(f => f._id === id ? { ...f, likes: r.data.likes } : f)); } catch {}
  };
  const handleDislike = async (id) => {
    try { const r = await axios.post(`/api/files/${id}/dislike`); setFiles(prev => prev.map(f => f._id === id ? { ...f, dislikes: r.data.dislikes, isFlagged: r.data.isFlagged } : f)); } catch {}
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try { await axios.delete(`/api/files/${id}`); setFiles(prev => prev.filter(f => f._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm">
      {showFolderModal && <CreateFolderModal onConfirm={handleCreateFolder} onClose={() => setShowFolderModal(false)} />}
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-5">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left">
          <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${isRandom ? 'text-[#00c2ff] bg-[#00c2ff]' : 'text-[#ff6b00] bg-[#ff6b00]'}`} />
          <h4 className="text-lg font-black uppercase tracking-tight">{experiment.title}</h4>
          <span className="text-zinc-600 text-xs">{open ? '▾' : '▸'}</span>
        </button>
        <UploadMenu uploading={uploading} onSingleFile={handleSingleUpload} onFolderUpload={handleFolderUpload} onCreateFolder={() => setShowFolderModal(true)} />
      </div>

      {open && (
        <div>
          {deviceOrder.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[1.5rem] text-zinc-700 font-black uppercase tracking-widest text-[10px]">
              No Files Yet — Use Upload Menu Above
            </div>
          ) : (
            deviceOrder.map((key, idx) => (
              <DeviceUserSection
                key={key}
                deviceId={key}
                userNumber={idx + 1}
                colorScheme={getColor(idx)}
                deviceFiles={deviceMap[key]}
                experimentId={experiment._id}
                group={group} lab={lab}
                onLike={handleLike} onDislike={handleDislike}
                onDelete={handleDelete} onPreview={onPreview}
                onFolderDelete={handleFolderDelete} onFilesAdded={handleFilesAdded}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Repository Page ──────────────────────────────────────────────────────────
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
    try { await axios.delete(`/api/experiments/${id}`); setExperiments(prev => prev.filter(e => e._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const CreateForm = ({ isRandom, onClose }) => (
    <div className="bg-zinc-900/80 border border-[#ff6b00]/30 rounded-[1.5rem] p-6 mb-6">
      <h3 className="text-white font-black mb-3 uppercase text-xs tracking-widest">{isRandom ? 'New Random Experiment' : 'New Experiment Header'}</h3>
      <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createExp(isRandom)}
        placeholder="e.g. Experiment 1: Introduction to SQL"
        className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3 mb-3 outline-none text-white font-bold focus:border-[#ff6b00] transition-all text-sm" autoFocus />
      <div className="flex gap-2">
        <button onClick={() => createExp(isRandom)} disabled={creating}
          className="bg-white text-black px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50">
          {creating ? 'Creating...' : 'Create'}
        </button>
        <button onClick={onClose} className="bg-white/5 text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-colors">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 pt-28 max-w-7xl mx-auto">
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      <button onClick={() => navigate('group_select')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 text-xs font-black uppercase tracking-widest transition-all group">
        <div className="w-7 h-7 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5"><ArrowLeft className="w-3.5 h-3.5" /></div>
        Back
      </button>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <h2 className="text-4xl font-black tracking-tighter uppercase">
          Group {group} <span className="text-zinc-800">/</span> <span className="text-[#ff6b00]">{lab}</span>
        </h2>
        <button onClick={() => { setShowForm(true); setShowRandomForm(false); setNewTitle(''); }}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-black hover:bg-zinc-200 transition-colors shadow-lg text-xs uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Create Header
        </button>
      </div>

      {showForm && <CreateForm isRandom={false} onClose={() => setShowForm(false)} />}

      <section className="mb-12">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-5">Course Experiments</h3>
        {loading ? (
          <div className="text-zinc-600 font-black uppercase tracking-widest text-xs text-center py-16">Loading...</div>
        ) : regular.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">No Experiments Yet — Click "Create Header"</div>
        ) : (
          <div className="space-y-6">
            {regular.map(exp => (
              <div key={exp._id} className="relative">
                <button onClick={() => deleteExp(exp._id)} className="absolute top-5 right-5 z-10 w-7 h-7 bg-black/40 border border-white/5 text-zinc-600 hover:text-red-400 rounded-xl flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ExperimentSection experiment={exp} group={group} lab={lab} isRandom={false} onPreview={setPreviewFile} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Random Experiments</h3>
          <button onClick={() => { setShowRandomForm(true); setShowForm(false); setNewTitle(''); }}
            className="flex items-center gap-1.5 bg-[#00c2ff]/10 text-[#00c2ff] border border-[#00c2ff]/20 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#00c2ff]/20 transition-colors">
            <Plus className="w-3 h-3" /> Add Random
          </button>
        </div>
        {showRandomForm && <CreateForm isRandom={true} onClose={() => setShowRandomForm(false)} />}
        {random.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-zinc-700 font-black uppercase tracking-widest text-xs">No Random Experiments Yet</div>
        ) : (
          <div className="space-y-6">
            {random.map(exp => (
              <div key={exp._id} className="relative">
                <button onClick={() => deleteExp(exp._id)} className="absolute top-5 right-5 z-10 w-7 h-7 bg-black/40 border border-white/5 text-zinc-600 hover:text-red-400 rounded-xl flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
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
