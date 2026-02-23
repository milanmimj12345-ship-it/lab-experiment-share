import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, FileText, Sparkles, Copy, Check, Loader } from 'lucide-react';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];

const isImage = (fileName) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  return IMAGE_TYPES.includes(ext);
};

const detectType = (fileName) => {
  const name = (fileName || '').toLowerCase();
  if (name.includes('sql') || name.includes('dbms') || name.includes('mysql') || name.includes('db')) return 'dbms';
  if (name.includes('.c') || name.includes('program') || name.includes('code')) return 'c';
  return 'linux'; // default
};

const GEMINI_PROMPTS = {
  dbms: `You are an SQL extraction engine.
Extract only valid MySQL statements from the provided image.
Exclude:
- MySQL console output
- Error messages
- Warning messages
- Failed queries
- Repeated corrections
Keep:
- Include all successfully executed SQL commands, including SELECT, SHOW, and DESC statements.
- Only successful SQL commands
- Proper syntax
- Correct execution order
Return a clean, executable MySQL script only. No explanations. No extra text.`,

  linux: `You are a command extraction engine.
Extract only valid Linux terminal commands from the image.
Exclude:
- Terminal output
- Error messages (e.g., "command not found")
- Permission denied messages
- Warnings
- Failed attempts
Keep:
- Only successfully executed user-typed commands
- Exact original text
- Original execution order
Do not modify anything. Do not add anything. Do not fix anything.
Return only the clean command list.`,

  c: `You are a C program extractor.
Extract only the C source code from the image.
Return only the clean C code exactly as written.
No explanations. No extra text. No modifications.`
};

const PreviewModal = ({ file, onClose }) => {
  const [mode, setMode] = useState('normal');
  const [ocrText, setOcrText] = useState('');
  const [aiText, setAiText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileType = detectType(file.originalName || file.fileName || '');

  // Run OCR when switching to text mode
  useEffect(() => {
    if (mode === 'text' && !ocrDone && !ocrLoading) {
      runOCR();
    }
  }, [mode]);

  // Run AI when switching to ai mode
  useEffect(() => {
    if (mode === 'ai' && !aiDone && !aiLoading) {
      runAI();
    }
  }, [mode]);

  const runOCR = async () => {
    setOcrLoading(true);
    setOcrProgress(0);
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file.fileUrl, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      setOcrText(result.data.text);
      setOcrDone(true);
    } catch (err) {
      setOcrText('Failed to extract text. Make sure the image is clear and accessible.');
    } finally {
      setOcrLoading(false);
    }
  };

  const runAI = async () => {
    if (!GEMINI_API_KEY) {
      setAiText('⚠️ Gemini API key not configured.\n\nAdd REACT_APP_GEMINI_API_KEY to your Render environment variables.');
      setAiDone(true);
      return;
    }
    setAiLoading(true);
    try {
      const prompt = GEMINI_PROMPTS[fileType];

      // Fetch image via CORS proxy, convert to base64 for Gemini
      const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(file.fileUrl);
      const imgResponse = await fetch(proxyUrl);
      const blob = await imgResponse.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const mimeType = blob.type || 'image/jpeg';

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } }
              ]
            }]
          })
        }
      );

      const data = await geminiRes.json();
      if (data.error) throw new Error(data.error.message);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content extracted.';
      setAiText(text);
      setAiDone(true);
    } catch (err) {
      setAiText('Failed to process with AI.\n\nError: ' + err.message);
      setAiDone(true);
    } finally {
      setAiLoading(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'normal', label: 'Normal', icon: Eye, color: '#ff6b00' },
    { id: 'text', label: 'Text Mode', icon: FileText, color: '#00c2ff' },
    { id: 'ai', label: 'AI Mode', icon: Sparkles, color: '#00ff8c' },
  ];

  const currentText = mode === 'text' ? ocrText : aiText;
  const isLoading = mode === 'text' ? ocrLoading : aiLoading;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}
    >
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', margin: 0 }}>
              Preview
            </h3>
            <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {file.originalName}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: mode === tab.id ? `1px solid ${tab.color}40` : '1px solid rgba(255,255,255,0.08)', background: mode === tab.id ? `${tab.color}12` : 'rgba(255,255,255,0.03)', color: mode === tab.id ? tab.color : '#555', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}

          {/* Copy button for text modes */}
          {mode !== 'normal' && currentText && !isLoading && (
            <button onClick={() => copyText(currentText)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: copied ? 'rgba(0,255,140,0.1)' : 'rgba(255,255,255,0.03)', color: copied ? '#00ff8c' : '#888', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', marginLeft: 'auto', transition: 'all 0.2s' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Normal Mode */}
          {mode === 'normal' && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <img
                src={file.fileUrl}
                alt={file.originalName}
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
              />
            </div>
          )}

          {/* Text Mode */}
          {mode === 'text' && (
            <div>
              {ocrLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Loader size={32} color="#00c2ff" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#00c2ff', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Extracting Text... {ocrProgress}%</p>
                  <div style={{ margin: '16px auto', width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ocrProgress}%`, background: '#00c2ff', borderRadius: '999px', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ color: '#444', fontSize: '11px', marginTop: '8px' }}>Reading all text from image...</p>
                </div>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#00c2ff', fontFamily: "'Courier New', monospace", fontSize: '13px', lineHeight: '1.7', background: 'rgba(0,194,255,0.04)', border: '1px solid rgba(0,194,255,0.1)', borderRadius: '16px', padding: '24px', margin: 0 }}>
                  {ocrText || 'No text extracted.'}
                </pre>
              )}
            </div>
          )}

          {/* AI Mode */}
          {mode === 'ai' && (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(0,255,140,0.05)', border: '1px solid rgba(0,255,140,0.15)', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Sparkles size={14} color="#00ff8c" style={{ marginTop: '1px', flexShrink: 0 }} />
                <p style={{ color: '#00ff8c', fontSize: '11px', fontWeight: 700, margin: 0, lineHeight: '1.6' }}>
                  AI Mode — Detected: <strong>{fileType.toUpperCase()}</strong> content.
                  {fileType === 'dbms' && ' Extracting only successful SQL commands.'}
                  {fileType === 'linux' && ' Extracting only successfully executed commands.'}
                  {fileType === 'c' && ' Extracting clean C source code.'}
                </p>
              </div>
              {aiLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', border: '3px solid rgba(0,255,140,0.2)', borderTop: '3px solid #00ff8c', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#00ff8c', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>AI Processing...</p>
                  <p style={{ color: '#444', fontSize: '11px', marginTop: '8px' }}>Gemini is analyzing your image...</p>
                </div>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#00ff8c', fontFamily: "'Courier New', monospace", fontSize: '13px', lineHeight: '1.7', background: 'rgba(0,255,140,0.04)', border: '1px solid rgba(0,255,140,0.1)', borderRadius: '16px', padding: '24px', margin: 0 }}>
                  {aiText || 'Click the AI Mode tab to process.'}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export { isImage, PreviewModal };
