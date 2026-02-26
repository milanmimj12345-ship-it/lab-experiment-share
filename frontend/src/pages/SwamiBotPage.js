import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, FolderUp, X, Copy, Check, Sparkles, Plus, Send, ChevronDown, FileText, Zap } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const BACKEND = 'https://lab-experiment-share-production.up.railway.app';
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
const isImg = (name) => IMAGE_EXTS.includes((name || '').split('.').pop().toLowerCase());

const PROMPTS = {
  dbms: `You are an SQL extraction engine analyzing terminal screenshots from a lab session.
These images may be uploaded in random order.
1. Determine the CORRECT chronological order based on session context, command history, line numbers.
2. Extract ONLY valid, successfully executed SQL statements.
Exclude: MySQL console output, error messages, warnings, failed queries, repeated corrections.
Include: All successful SQL (SELECT, SHOW, DESC, CREATE, INSERT, UPDATE, DELETE, etc.) with proper semicolons.
Return ONLY a clean executable MySQL script. No explanations, no comments, no extra text.`,

  linux: `You are a Linux command extraction engine analyzing terminal screenshots from a lab session.
These images may be uploaded in random order.
1. Determine the CORRECT chronological order based on command sequence and session flow.
2. Extract ONLY the commands the user typed — NOT the output.
Exclude: Command output, error messages, system messages, failed attempts.
Include: Only user-typed commands (lines starting with $ or # or the shell prompt).
Return ONLY the clean command list, one per line. No explanations.`,

  c: `You are a C program extractor analyzing screenshots that together form a complete C program.
Images may be in random order.
1. Determine the CORRECT order based on program structure (includes → globals → main → functions).
2. Reconstruct the complete clean C source code.
Return ONLY the complete compilable C source code. No explanations.`,

  python: `You are a Python code extractor analyzing screenshots of a Python program.
Images may be in random order.
1. Determine the CORRECT order of code fragments.
2. Extract ONLY the Python code (not output, not errors).
Return ONLY clean executable Python code in correct order. No explanations.`
};

// ── Particle field effect ──────────────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#ff6b00' : '#ffd700',
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

// ── Add to Experiment Modal ────────────────────────────────────────────────────
const AddToExperimentModal = ({ text, onClose }) => {
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [group, setGroup] = useState('A');
  const [lab, setLab] = useState('DBMS');
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/experiments?group=${group}&lab=${lab}`)
      .then(r => { setExperiments(r.data.experiments || []); setSelectedExp(''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [group, lab]);

  const saveToExperiment = async () => {
    setSaving(true);
    try {
      let expId = selectedExp;

      if (mode === 'new') {
        if (!newTitle.trim()) { toast.error('Enter experiment title'); setSaving(false); return; }
        const r = await axios.post('/api/experiments', { title: newTitle.trim(), group, lab, isRandom: false });
        expId = r.data.experiment._id;
      }

      if (!expId) { toast.error('Select an experiment'); setSaving(false); return; }

      // Create a text file blob and upload it
      const blob = new Blob([text], { type: 'text/plain' });
      const filename = `ai_output_${lab}_${Date.now()}.txt`;
      const file = new File([blob], filename, { type: 'text/plain' });

      const fd = new FormData();
      fd.append('file', file);
      fd.append('experimentId', expId);
      fd.append('group', group);
      fd.append('lab', lab);

      await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Added to ${group} — ${lab}!`);
      onClose();
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(16px)' }}>
      <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 28, width: '100%', maxWidth: 480, padding: 32, boxShadow: '0 0 60px rgba(255,107,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, color: '#fff', margin: 0 }}>Add to Experiment</h3>
            <p style={{ color: '#555', fontSize: 10, fontWeight: 700, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: 2 }}>Save AI output to repository</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        {/* Group + Lab selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ color: '#555', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 6 }}>Group</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A', 'B'].map(g => (
                <button key={g} onClick={() => setGroup(g)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: group === g ? '1px solid #ff6b00' : '1px solid rgba(255,255,255,0.08)', background: group === g ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.03)', color: group === g ? '#ff6b00' : '#555', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: '#555', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 6 }}>Lab</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['DBMS', 'OS'].map(l => (
                <button key={l} onClick={() => setLab(l)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: lab === l ? '1px solid #ff6b00' : '1px solid rgba(255,255,255,0.08)', background: lab === l ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.03)', color: lab === l ? '#ff6b00' : '#555', fontWeight: 900, fontSize: 11, cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ id: 'existing', label: 'Existing Experiment' }, { id: 'new', label: 'New Experiment' }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: mode === m.id ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)', background: mode === m.id ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)', color: mode === m.id ? '#ffd700' : '#555', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'existing' ? (
          <div style={{ marginBottom: 20 }}>
            {loading ? (
              <div style={{ color: '#555', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: 16 }}>Loading experiments...</div>
            ) : experiments.length === 0 ? (
              <div style={{ color: '#444', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: 16 }}>No experiments in Group {group} — {lab}</div>
            ) : (
              <select value={selectedExp} onChange={e => setSelectedExp(e.target.value)}
                style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                <option value="">Select experiment...</option>
                {experiments.map(exp => <option key={exp._id} value={exp._id}>{exp.title}</option>)}
              </select>
            )}
          </div>
        ) : (
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Experiment 5: Joins and Subqueries"
            style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontWeight: 700, fontSize: 12, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
        )}

        <button onClick={saveToExperiment} disabled={saving}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: saving ? 'rgba(255,107,0,0.2)' : 'linear-gradient(135deg, #ff6b00, #ff9e00)', border: 'none', color: '#000', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Send size={14} />
          {saving ? 'Saving...' : 'Add to Experiment'}
        </button>
      </div>
    </div>
  );
};

// ── Main Bot Page ──────────────────────────────────────────────────────────────
const SwamiBotPage = ({ navigate }) => {
  const [images, setImages] = useState([]); // { name, url, blob }
  const [contentType, setContentType] = useState('dbms');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const folderRef = useRef();

  const addFiles = (fileList) => {
    const newImgs = Array.from(fileList)
      .filter(f => isImg(f.name))
      .map(f => ({ name: f.name, url: URL.createObjectURL(f), blob: f }));
    if (fileList.length > 0 && newImgs.length === 0) {
      toast.error('No image files found — only JPG, PNG, WebP etc. are supported');
    } else {
      setImages(prev => [...prev, ...newImgs]);
      setDone(false);
      setOutput('');
    }
  };

  const handleFiles = (e) => { addFiles(e.target.files); e.target.value = ''; };
  const handleFolder = (e) => { addFiles(e.target.files); e.target.value = ''; };
  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
  const clearAll = () => { setImages([]); setOutput(''); setDone(false); };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const items = e.dataTransfer.items;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry?.isFile) files.push(items[i].getAsFile());
    }
    if (files.length) addFiles(files);
  };

  const analyze = async () => {
    if (images.length === 0) { toast.error('Upload at least one image first'); return; }
    setLoading(true); setDone(false); setOutput('');

    try {
      setStatus('Uploading images to AI...');

      // Convert blobs to base64 for sending to backend
      const imageData = await Promise.all(images.map(async img => {
        // Use our backend proxy path — upload blob as base64
        const reader = new FileReader();
        return new Promise(resolve => {
          reader.onload = e => {
            const base64 = e.target.result.split(',')[1];
            const mimeType = img.blob.type || 'image/jpeg';
            resolve({ base64, mimeType, name: img.name });
          };
          reader.readAsDataURL(img.blob);
        });
      }));

      setStatus(`Analyzing ${images.length} image${images.length > 1 ? 's' : ''}...`);

      const response = await fetch(BACKEND + '/api/swami-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imageData, prompt: PROMPTS[contentType] })
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Server error');

      setOutput(data.text || 'No content extracted.');
      setDone(true);
    } catch (err) {
      setOutput('Analysis failed.\n\nError: ' + err.message);
      setDone(true);
    } finally { setLoading(false); setStatus(''); }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {showAddModal && <AddToExperimentModal text={output} onClose={() => setShowAddModal(false)} />}

      {/* ── Hero background — the Swami image with cosmic glow ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {/* Dark overlay so UI stays readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,0,0.08) 0%, rgba(0,0,0,0.97) 70%)', zIndex: 1 }} />

        {/* Swami portrait — centered, fades at edges */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', maxWidth: '80vw', zIndex: 0, opacity: 0.18 }}>
          <img
            src="/swami.png"
            alt=""
            style={{ width: '100%', objectFit: 'contain', maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, transparent 80%)' }}
            onError={e => e.target.style.display = 'none'}
          />
        </div>

        {/* Cosmic ring glow behind swami */}
        <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,165,0,0.06) 0%, transparent 70%)', zIndex: 0 }} />
        <ParticleField />
      </div>

      {/* ── Page Content ── */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', paddingTop: 88 }}>

        {/* Back button */}
        <div style={{ padding: '0 32px 0', maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => navigate('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 28, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#555'}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>

          {/* ── Bot Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* Swami avatar glow ring */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,165,0,0.3), rgba(255,107,0,0.1))', border: '2px solid rgba(255,165,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 40px rgba(255,140,0,0.3), 0 0 80px rgba(255,107,0,0.15)', animation: 'pulse-glow 3s ease-in-out infinite' }}>
                <Sparkles size={40} color="#ffd700" />
              </div>
              {/* Orbiting dots */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 130, height: 130, borderRadius: '50%', border: '1px dashed rgba(255,165,0,0.2)', transform: 'translate(-50%, -50%)', animation: 'orbit 8s linear infinite' }} />
            </div>

            <div style={{ display: 'inline-block', background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: 999, padding: '4px 16px', marginBottom: 12 }}>
              <span style={{ color: '#ffa500', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3 }}>◉ AI Oracle</span>
            </div>

            <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-1px', textTransform: 'uppercase', color: '#fff', margin: '0 0 8px', lineHeight: 1.1 }}>
              Vigneshwara <span style={{ color: '#ff6b00' }}>Swami</span>
            </h1>
            <p style={{ color: '#555', fontSize: 13, fontWeight: 600, margin: 0 }}>
              Upload lab screenshots — I'll extract clean executable code in the correct order
            </p>
          </div>

          {/* ── Main card ── */}
          <div style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 28, overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>

            {/* Content type selector */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#444', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, flexShrink: 0 }}>Mode:</span>
              {[
                { id: 'dbms', label: 'DBMS / SQL', color: '#ff6b00' },
                { id: 'linux', label: 'Linux / OS', color: '#00c2ff' },
                { id: 'c', label: 'C Program', color: '#a855f7' },
                { id: 'python', label: 'Python', color: '#00ff8c' },
              ].map(t => (
                <button key={t.id} onClick={() => { setContentType(t.id); setDone(false); setOutput(''); }}
                  style={{ padding: '6px 16px', borderRadius: 999, border: contentType === t.id ? `1px solid ${t.color}60` : '1px solid rgba(255,255,255,0.06)', background: contentType === t.id ? `${t.color}14` : 'rgba(255,255,255,0.02)', color: contentType === t.id ? t.color : '#555', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Upload zone */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{ border: `2px dashed ${dragOver ? 'rgba(255,107,0,0.6)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: images.length > 0 ? '16px' : '32px 24px', background: dragOver ? 'rgba(255,107,0,0.04)' : 'transparent', transition: 'all 0.2s', textAlign: images.length > 0 ? 'left' : 'center' }}>

                {images.length === 0 ? (
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Upload size={20} color="#ff6b00" />
                    </div>
                    <p style={{ color: '#fff', fontWeight: 900, fontSize: 13, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Drop images here</p>
                    <p style={{ color: '#444', fontSize: 11, margin: '0 0 20px' }}>or use the buttons below • JPG, PNG, WebP supported</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => fileRef.current.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(255,107,0,0.3)', background: 'rgba(255,107,0,0.08)', color: '#ff6b00', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>
                        <Upload size={13} /> Upload Images
                      </button>
                      <button onClick={() => folderRef.current.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(0,194,255,0.3)', background: 'rgba(0,194,255,0.06)', color: '#00c2ff', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>
                        <FolderUp size={13} /> Upload Folder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Thumbnail strip */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                      {images.map((img, i) => (
                        <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                          <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => removeImage(i)}
                            style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 999, background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {/* Add more */}
                      <button onClick={() => fileRef.current.click()}
                        style={{ width: 64, height: 64, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#444', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                        <Plus size={14} />
                        <span style={{ fontSize: 8, fontWeight: 900 }}>ADD</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#555', fontSize: 10, fontWeight: 700 }}>{images.length} image{images.length !== 1 ? 's' : ''} ready</span>
                      <button onClick={clearAll} style={{ color: '#ff4444', fontSize: 10, fontWeight: 900, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>Clear All</button>
                    </div>
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" style={{ display: 'none' }} onChange={handleFiles} />
              <input ref={folderRef} type="file" webkitdirectory="true" multiple style={{ display: 'none' }} onChange={handleFolder} />
            </div>

            {/* Analyze button */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={analyze} disabled={loading || images.length === 0}
                style={{ width: '100%', padding: '16px 0', borderRadius: 16, background: loading ? 'rgba(255,107,0,0.1)' : images.length === 0 ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #ff6b00 0%, #ff9e00 100%)', border: loading || images.length === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: images.length === 0 ? '#333' : '#000', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, cursor: loading || images.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' }}>
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,107,0,0.3)', borderTop: '2px solid #ff6b00', animation: 'spin 1s linear infinite' }} />
                    {status || 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {done ? 'Re-Analyze' : `Ask Vigneshwara Swami`}
                  </>
                )}
              </button>
            </div>

            {/* Output box */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="#ff6b00" />
                  <span style={{ color: '#555', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Output</span>
                  {done && output && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff8c', boxShadow: '0 0 6px #00ff8c', animation: 'pulse 2s infinite' }} />
                  )}
                </div>
                {done && output && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={copy}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: copied ? 'rgba(0,255,140,0.1)' : 'rgba(255,255,255,0.03)', color: copied ? '#00ff8c' : '#666', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,107,0,0.3)', background: 'rgba(255,107,0,0.08)', color: '#ff6b00', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>
                      <Plus size={11} /> Add to Experiment
                    </button>
                  </div>
                )}
              </div>

              <div style={{ background: '#060606', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, minHeight: 200, padding: 20, position: 'relative' }}>
                {!output && !loading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#222' }}>
                    <Zap size={28} />
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3 }}>Output will appear here</span>
                  </div>
                )}
                {loading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,107,0,0.15)', borderTop: '3px solid #ff6b00', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#ff6b00', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Swami is thinking...</span>
                    <span style={{ color: '#333', fontSize: 10, fontFamily: 'monospace' }}>{status}</span>
                  </div>
                )}
                {output && (
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e0e0e0', fontFamily: "'Courier New', monospace", fontSize: 12.5, lineHeight: 1.8, margin: 0 }}>
                    {output}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', color: '#2a2a2a', fontSize: 10, fontWeight: 700, marginTop: 24, textTransform: 'uppercase', letterSpacing: 2 }}>
            Vigneshwara Swami • AI Oracle of Code • Powered by Groq Vision
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 40px rgba(255,140,0,0.3), 0 0 80px rgba(255,107,0,0.15); } 50% { box-shadow: 0 0 60px rgba(255,140,0,0.5), 0 0 120px rgba(255,107,0,0.25); } }
        @keyframes orbit { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SwamiBotPage;
