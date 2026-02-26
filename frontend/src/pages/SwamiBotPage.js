import React, { useState, useRef, useEffect } from 'react';
import { Upload, FolderUp, X, Copy, Check, Plus, Send, FileText, Zap, Search } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const BACKEND = 'https://lab-experiment-share-production.up.railway.app';
const IMAGE_EXTS = ['jpg','jpeg','png','webp','gif','bmp'];
const isImg = (n) => IMAGE_EXTS.includes((n||'').split('.').pop().toLowerCase());

const hashStr = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h,0x01000193)>>>0; }
  return h.toString(36);
};
const getDeviceId = () => 'hw_' + hashStr([
  navigator.platform||'', screen.width, screen.height,
  Math.round((window.devicePixelRatio||1)*10),
  navigator.hardwareConcurrency||0, navigator.deviceMemory||0,
  navigator.maxTouchPoints||0,
  Intl.DateTimeFormat().resolvedOptions().timeZone, screen.colorDepth,
].join('|'));

const PROMPTS = {
  dbms: `You are an SQL extraction engine analyzing terminal screenshots from a lab session. Images may be in random order.
1. Determine the CORRECT chronological order based on session context and command history.
2. Extract ONLY valid, successfully executed SQL statements.
Exclude: MySQL console output, error messages, warnings, failed queries, repeated corrections.
Include: All successful SQL (SELECT, SHOW, DESC, CREATE, INSERT, UPDATE, DELETE, etc.) with proper semicolons.
Return ONLY a clean executable MySQL script. No explanations, no comments, no extra text.`,
  linux: `You are a Linux command extraction engine analyzing terminal screenshots. Images may be in random order.
1. Determine the CORRECT chronological order based on command sequence and session flow.
2. Extract ONLY the commands the user typed - NOT the output.
Exclude: Command output, error messages, system messages, failed attempts.
Include: Only user-typed commands (lines starting with $ or # or the shell prompt).
Return ONLY the clean command list, one per line. No explanations.`,
  c: `You are a C program extractor. Images may be in random order.
1. Determine the CORRECT order based on program structure.
2. Reconstruct the complete clean C source code.
Return ONLY the complete compilable C source code. No explanations.`,
  python: `You are a Python code extractor. Images may be in random order.
1. Determine the CORRECT order of code fragments.
2. Extract ONLY the Python code (not output, not errors).
Return ONLY clean executable Python code in correct order. No explanations.`
};

/* ── Twinkling star field ─────────────────────────────────────────────── */
const Stars = () => {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const ctx = c.getContext('2d');
    const stars = Array.from({length:260}, () => ({
      x: Math.random()*c.width, y: Math.random()*c.height,
      r: Math.random()*1.1+0.1, a: Math.random()*0.55+0.05,
      t: Math.random()*Math.PI*2
    }));
    let raf, tick=0;
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height); tick+=0.007;
      stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${s.a*(0.65+0.35*Math.sin(s.t+tick))})`;
        ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} />;
};

/* ── Add-to-experiment modal ─────────────────────────────────────────── */
const AddModal = ({ text, onClose }) => {
  const [mode,setMode] = useState('existing');
  const [group,setGroup] = useState('A');
  const [lab,setLab] = useState('DBMS');
  const [exps,setExps] = useState([]);
  const [sel,setSel] = useState('');
  const [title,setTitle] = useState('');
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    axios.get(`/api/experiments?group=${group}&lab=${lab}`)
      .then(r=>{ setExps(r.data.experiments||[]); setSel(''); })
      .catch(()=>{});
  }, [group,lab]);

  const save = async () => {
    setBusy(true);
    try {
      let id = sel;
      if (mode==='new') {
        if (!title.trim()) { toast.error('Enter a title'); setBusy(false); return; }
        const r = await axios.post('/api/experiments',{title:title.trim(),group,lab,isRandom:false});
        id = r.data.experiment._id;
      }
      if (!id) { toast.error('Select an experiment'); setBusy(false); return; }
      const blob = new Blob([text],{type:'text/plain'});
      const file = new File([blob],`swami_${lab}_${Date.now()}.txt`,{type:'text/plain'});
      const fd = new FormData();
      fd.append('file',file); fd.append('experimentId',id);
      fd.append('group',group); fd.append('lab',lab);
      fd.append('deviceId',getDeviceId());
      await axios.post('/api/files/upload',fd,{headers:{'Content-Type':'multipart/form-data'}});
      toast.success(`Saved to Group ${group} — ${lab}!`);
      onClose();
    } catch(e) { toast.error(e.response?.data?.message||e.message); }
    finally { setBusy(false); }
  };

  const btnBase = (active,accent='#ff6b00') => ({
    flex:1, padding:'8px 0', borderRadius:8,
    border: active?`1px solid ${accent}`:'1px solid rgba(255,255,255,0.07)',
    background: active?`${accent}1a`:'rgba(255,255,255,0.02)',
    color: active?accent:'#555', fontWeight:900, fontSize:11, cursor:'pointer'
  });

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(18px)'}}>
      <div style={{background:'#0c0c10',border:'1px solid rgba(255,107,0,0.22)',borderRadius:22,width:'100%',maxWidth:440,padding:30}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <div style={{fontWeight:900,fontSize:14,textTransform:'uppercase',letterSpacing:1.5,color:'#fff'}}>Add to Experiment</div>
            <div style={{color:'#444',fontSize:9,fontWeight:700,marginTop:3,textTransform:'uppercase',letterSpacing:2}}>Save AI output</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          {[['Group',['A','B'],group,setGroup],['Lab',['DBMS','OS'],lab,setLab]].map(([lbl,vals,val,set])=>(
            <div key={lbl}>
              <div style={{color:'#333',fontSize:8,fontWeight:900,textTransform:'uppercase',letterSpacing:2,marginBottom:5}}>{lbl}</div>
              <div style={{display:'flex',gap:5}}>
                {vals.map(v=><button key={v} onClick={()=>set(v)} style={btnBase(val===v)}>{v}</button>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {[['existing','Existing'],['new','New']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setMode(id)} style={btnBase(mode===id,'#ffd700')}>{lbl}</button>
          ))}
        </div>
        {mode==='existing'
          ? <select value={sel} onChange={e=>setSel(e.target.value)}
              style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,padding:'10px 13px',color:exps.length?'#fff':'#444',fontWeight:700,fontSize:12,cursor:'pointer',outline:'none',marginBottom:14}}>
              <option value="">{exps.length?'Select…':`No experiments in ${group}·${lab}`}</option>
              {exps.map(e=><option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          : <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Experiment title…"
              style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,padding:'10px 13px',color:'#fff',fontWeight:700,fontSize:12,outline:'none',marginBottom:14,boxSizing:'border-box'}}/>
        }
        <button onClick={save} disabled={busy}
          style={{width:'100%',padding:'12px 0',borderRadius:11,background:busy?'rgba(255,107,0,0.15)':'#ff6b00',border:'none',color:'#000',fontWeight:900,fontSize:11,textTransform:'uppercase',letterSpacing:2,cursor:busy?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
          <Send size={12}/>{busy?'Saving…':'Add to Experiment'}
        </button>
      </div>
    </div>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function SwamiBotPage({ navigate }) {
  const [imgs,setImgs]   = useState([]);
  const [mode,setMode]   = useState('dbms');
  const [busy,setBusy]   = useState(false);
  const [out,setOut]     = useState('');
  const [done,setDone]   = useState(false);
  const [status,setStat] = useState('');
  const [copied,setCopied]   = useState(false);
  const [showAdd,setShowAdd] = useState(false);
  const [drag,setDrag]   = useState(false);
  const fileRef   = useRef();
  const folderRef = useRef();

  const addFiles = list => {
    const ok = Array.from(list).filter(f=>isImg(f.name))
      .map(f=>({name:f.name, url:URL.createObjectURL(f), blob:f}));
    if (list.length&&!ok.length) { toast.error('Only image files supported'); return; }
    setImgs(p=>[...p,...ok]); setDone(false); setOut('');
  };
  const onFiles  = e => { addFiles(e.target.files); e.target.value=''; };
  const onFolder = e => { addFiles(e.target.files); e.target.value=''; };
  const onDrop   = e => { e.preventDefault(); setDrag(false); const f=[]; for(let i=0;i<e.dataTransfer.items.length;i++){const x=e.dataTransfer.items[i].getAsFile?.();if(x)f.push(x);} if(f.length)addFiles(f); };

  const analyze = async () => {
    if (!imgs.length) { toast.error('Upload at least one image'); return; }
    setBusy(true); setDone(false); setOut('');
    try {
      setStat('Preparing images…');
      const imageData = await Promise.all(imgs.map(img=>new Promise(res=>{
        const r=new FileReader();
        r.onload=e=>res({base64:e.target.result.split(',')[1],mimeType:img.blob.type||'image/jpeg',name:img.name});
        r.readAsDataURL(img.blob);
      })));
      setStat(`Sending ${imgs.length} image${imgs.length>1?'s':''} to Swami…`);
      const resp = await fetch(BACKEND+'/api/swami-analyze',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({images:imageData, prompt:PROMPTS[mode]})
      });
      const data = await resp.json();
      if (!resp.ok||data.error) throw new Error(data.error||'Server error');
      setOut(data.text||'No content extracted.'); setDone(true);
    } catch(e) { setOut('Analysis failed.\n\nError: '+e.message); setDone(true); }
    finally { setBusy(false); setStat(''); }
  };
  const copy = () => { navigator.clipboard.writeText(out); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const MODES = [
    {id:'dbms',  label:'DBMS / SQL'},
    {id:'linux', label:'Linux / OS'},
    {id:'c',     label:'C Program'},
    {id:'python',label:'Python'},
  ];

  /* shared style helpers */
  const panelBg  = {background:'#0b0b0f', border:'1px solid rgba(255,255,255,0.085)'};
  const subBg    = {background:'#080810', border:'1px solid rgba(255,255,255,0.055)'};

  return (
    <div style={{minHeight:'100vh',background:'#03020a',position:'relative',overflowX:'hidden'}}>
      {showAdd && <AddModal text={out} onClose={()=>setShowAdd(false)}/>}

      {/* ── BG: swami image + gradient overlays ── */}
      <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden'}}>
        <img src="/swami.png" alt=""
          style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
            width:'auto',height:'85%',maxWidth:'100%',objectFit:'cover',objectPosition:'top center',
            opacity:0.82,
            maskImage:'linear-gradient(to bottom,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.88) 35%,rgba(0,0,0,0.35) 62%,transparent 80%)',
            WebkitMaskImage:'linear-gradient(to bottom,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.88) 35%,rgba(0,0,0,0.35) 62%,transparent 80%)',
          }}
          onError={e=>e.target.style.display='none'}
        />
        {/* side fade so cosmic bg image edges blend */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 55% at 50% 0%,transparent 0%,rgba(3,2,10,0.55) 100%)'}}/>
        {/* bottom dark fill */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 0%,transparent 42%,rgba(3,2,10,0.82) 62%,#03020a 78%)'}}/>
        <Stars/>
      </div>

      {/* ── NAVBAR — pure black ── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:200,height:52,background:'#000000',borderBottom:'1px solid rgba(255,255,255,0.065)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer'}} onClick={()=>navigate('home')}>
          <div style={{width:28,height:28,background:'#ff6b00',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#000',fontSize:12}}>A</div>
          <span style={{fontWeight:900,fontSize:14,letterSpacing:'0.06em',color:'#fff',textTransform:'uppercase'}}>ADAMVILLA<span style={{color:'#ff6b00'}}>.</span></span>
        </div>
        <button onClick={()=>navigate('home')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.32)',fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer'}}>
          ← HOME
        </button>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{position:'relative',zIndex:10,paddingTop:52}}>

        {/* ── Hero: spacer matches swami figure height, then title below ── */}
        <div style={{textAlign:'center',padding:'0 20px'}}>
          {/* Push title down into the lower chest area of the swami image */}
          <div style={{height:'clamp(260px,32vh,380px)'}}/>

          {/* Name */}
          <h1 style={{margin:'0 0 0',lineHeight:1,letterSpacing:'0.07em',
            fontFamily:"'Bebas Neue','Arial Black',sans-serif",
            fontSize:'clamp(36px,5.5vw,68px)',fontWeight:400,
            textShadow:'0 4px 40px rgba(0,0,0,0.9),0 2px 12px rgba(0,0,0,0.8)'}}>
            <span style={{color:'#ffffff'}}>VIGNESHWARA </span>
            <span style={{color:'#ff6b00'}}>SWAMI</span>
          </h1>

          {/* Oracle badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:10,margin:'10px 0 8px'}}>
            <div style={{height:1,width:36,background:'rgba(255,107,0,0.35)'}}/>
            <span style={{color:'#ff9a40',fontSize:10,fontWeight:700,letterSpacing:'0.28em',textTransform:'uppercase'}}>AI Oracle</span>
            <div style={{height:1,width:36,background:'rgba(255,107,0,0.35)'}}/>
          </div>

          <p style={{color:'rgba(255,255,255,0.38)',fontSize:12.5,fontWeight:400,margin:'0 0 28px',letterSpacing:'0.02em'}}>
            Upload lab screenshots — I'll extract clean executable code in the correct order
          </p>
        </div>

        {/* ── TOOL PANEL ── */}
        <div style={{maxWidth:680,margin:'0 auto',padding:'0 18px 60px'}}>
          <div style={{...panelBg, borderRadius:14, overflow:'hidden'}}>

            {/* Mode tabs row */}
            <div style={{padding:'12px 16px 11px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
              <span style={{color:'#2e2e2e',fontSize:8.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em',marginRight:2}}>Mode :</span>
              {MODES.map(m=>(
                <button key={m.id} onClick={()=>{setMode(m.id);setDone(false);setOut('');}}
                  style={{padding:'5px 13px',borderRadius:7,
                    border: mode===m.id?'none':'1px solid rgba(255,255,255,0.07)',
                    background: mode===m.id?'#ff6b00':'rgba(255,255,255,0.025)',
                    color: mode===m.id?'#000':'#555',
                    fontWeight:900,fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer',transition:'all 0.15s'}}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div
                onDrop={onDrop}
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onClick={()=>imgs.length===0&&fileRef.current.click()}
                style={{...subBg, borderRadius:10,
                  border:`1px dashed ${drag?'rgba(255,107,0,0.45)':'rgba(255,255,255,0.08)'}`,
                  padding: imgs.length>0?'12px':'26px 18px',
                  background: drag?'rgba(255,107,0,0.04)':'rgba(0,0,0,0.28)',
                  transition:'all 0.2s', textAlign: imgs.length>0?'left':'center',
                  cursor: imgs.length===0?'pointer':'default'}}>
                {imgs.length===0 ? (
                  <div>
                    <div style={{width:40,height:40,borderRadius:10,background:'rgba(255,107,0,0.09)',border:'1px solid rgba(255,107,0,0.18)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 11px'}}>
                      <Upload size={16} color="#ff6b00"/>
                    </div>
                    <p style={{color:'#e0e0e0',fontWeight:900,fontSize:12,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'0.12em'}}>Drop Images Here</p>
                    <p style={{color:'#2c2c2c',fontSize:10,margin:'0 0 16px'}}>or use the buttons below &nbsp;|&nbsp; JPG, PNG, WebP supported</p>
                    <div style={{display:'flex',gap:9,justifyContent:'center'}}>
                      <button onClick={e=>{e.stopPropagation();fileRef.current.click();}}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:7,background:'#ff6b00',border:'none',color:'#000',fontWeight:900,fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                        <Upload size={11}/> Upload Images
                      </button>
                      <button onClick={e=>{e.stopPropagation();folderRef.current.click();}}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:7,background:'rgba(0,180,255,0.1)',border:'1px solid rgba(0,194,255,0.22)',color:'#00c2ff',fontWeight:900,fontSize:9.5,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                        <FolderUp size={11}/> Upload Folder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:10}}>
                      {imgs.map((img,i)=>(
                        <div key={i} style={{position:'relative',width:52,height:52,borderRadius:7,overflow:'hidden',border:'1px solid rgba(255,255,255,0.09)',flexShrink:0}}>
                          <img src={img.url} alt={img.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          <button onClick={()=>setImgs(p=>p.filter((_,x)=>x!==i))}
                            style={{position:'absolute',top:2,right:2,width:15,height:15,borderRadius:999,background:'rgba(0,0,0,0.88)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
                            <X size={8}/>
                          </button>
                        </div>
                      ))}
                      <button onClick={()=>fileRef.current.click()}
                        style={{width:52,height:52,borderRadius:7,border:'1px dashed rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.02)',color:'#2a2a2a',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,flexShrink:0}}>
                        <Plus size={12}/><span style={{fontSize:7,fontWeight:900,letterSpacing:1}}>ADD</span>
                      </button>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{color:'#3a3a3a',fontSize:9.5,fontWeight:700}}>{imgs.length} image{imgs.length!==1?'s':''} loaded</span>
                      <button onClick={()=>{setImgs([]);setOut('');setDone(false);}} style={{color:'#cc3333',fontSize:9.5,fontWeight:900,background:'none',border:'none',cursor:'pointer',textTransform:'uppercase',letterSpacing:1}}>Clear All</button>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{display:'none'}} onChange={onFiles}/>
              <input ref={folderRef} type="file" webkitdirectory="true" multiple style={{display:'none'}} onChange={onFolder}/>
            </div>

            {/* Ask bar */}
            <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <button onClick={analyze} disabled={busy||!imgs.length}
                style={{width:'100%',padding:'11px 16px',borderRadius:9,
                  background: busy?'rgba(255,255,255,0.02)':imgs.length?'rgba(255,255,255,0.035)':'rgba(255,255,255,0.015)',
                  border:`1px solid ${busy?'rgba(255,107,0,0.25)':imgs.length?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.06)'}`,
                  color: imgs.length?'#777':'#252525',
                  fontWeight:600,fontSize:12,letterSpacing:'0.03em',
                  cursor: busy||!imgs.length?'not-allowed':'pointer',
                  display:'flex',alignItems:'center',gap:9,textAlign:'left',transition:'all 0.2s'}}>
                {busy
                  ? <><div style={{width:13,height:13,borderRadius:'50%',border:'1.5px solid rgba(255,107,0,0.18)',borderTop:'1.5px solid #ff6b00',animation:'spin 0.8s linear infinite',flexShrink:0}}/><span style={{color:'#ff6b00',fontWeight:700,fontSize:11}}>{status||'Swami is thinking…'}</span></>
                  : <><Search size={13} style={{flexShrink:0}}/><span>Ask Vigneshwara Swami</span>
                      {imgs.length>0&&<span style={{marginLeft:'auto',background:'#ff6b00',color:'#000',fontSize:8,fontWeight:900,padding:'3px 9px',borderRadius:999,letterSpacing:'0.1em'}}>{done?'RE-ANALYZE':'ANALYZE →'}</span>}</>
                }
              </button>
            </div>

            {/* Output */}
            <div style={{padding:'12px 16px 16px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <FileText size={12} color="#ff6b00"/>
                  <span style={{color:'#333',fontSize:8.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em'}}>Output</span>
                  {done&&out&&<div style={{width:5,height:5,borderRadius:'50%',background:'#00e87a',animation:'pulse 2s infinite'}}/>}
                </div>
                {done&&out&&(
                  <div style={{display:'flex',gap:7}}>
                    <button onClick={copy}
                      style={{display:'flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:999,border:'1px solid rgba(255,255,255,0.07)',background:copied?'rgba(0,255,140,0.07)':'rgba(255,255,255,0.025)',color:copied?'#00e87a':'#4a4a4a',fontWeight:900,fontSize:8.5,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                      {copied?<Check size={9}/>:<Copy size={9}/>}{copied?'Copied!':'Copy'}
                    </button>
                    <button onClick={()=>setShowAdd(true)}
                      style={{display:'flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:999,border:'1px solid rgba(255,107,0,0.28)',background:'rgba(255,107,0,0.07)',color:'#ff6b00',fontWeight:900,fontSize:8.5,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                      <Plus size={9}/> Add to Experiment
                    </button>
                  </div>
                )}
              </div>

              <div style={{...subBg, borderRadius:9, minHeight:140, padding:'14px 16px', position:'relative', overflow:'hidden'}}>
                {!out&&!busy&&(
                  <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7}}>
                    <Zap size={20} color="#161620"/>
                    <span style={{color:'#161620',fontSize:8.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.25em'}}>Output will appear here</span>
                  </div>
                )}
                {busy&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:110,gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',border:'2px solid rgba(255,107,0,0.1)',borderTop:'2px solid #ff6b00',animation:'spin 1s linear infinite'}}/>
                    <span style={{color:'#ff6b00',fontSize:9.5,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.18em'}}>Swami is thinking…</span>
                    <span style={{color:'#1e1e28',fontSize:9.5,fontFamily:'monospace'}}>{status}</span>
                  </div>
                )}
                {out&&(
                  <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#c2c2c8',fontFamily:"'Courier New',monospace",fontSize:12,lineHeight:1.9,margin:0}}>
                    {out}
                  </pre>
                )}
              </div>
            </div>

            {/* Footer inside panel */}
            <div style={{padding:'9px 16px 13px',borderTop:'1px solid rgba(255,255,255,0.04)',textAlign:'center'}}>
              <p style={{color:'#1c1c1c',fontSize:8.5,fontWeight:700,margin:0,textTransform:'uppercase',letterSpacing:'0.18em'}}>
                By using this tool, you agree to our{' '}
                <span style={{color:'#ff6b00',cursor:'pointer'}}>Terms of Service</span>
                {' & '}
                <span style={{color:'#ff6b00',cursor:'pointer'}}>Privacy Policy</span>
              </p>
            </div>
          </div>

          <p style={{textAlign:'center',color:'#161618',fontSize:8.5,fontWeight:700,marginTop:18,textTransform:'uppercase',letterSpacing:'0.22em'}}>
            Vigneshwara Swami · AI Oracle · Powered by Groq Vision
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.28} }
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
      `}</style>
    </div>
  );
}
