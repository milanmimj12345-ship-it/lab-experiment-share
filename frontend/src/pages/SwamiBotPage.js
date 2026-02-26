import React, { useState, useRef, useEffect } from 'react';
import { Upload, FolderUp, X, Copy, Check, Plus, Send, FileText, Zap, Search } from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const BACKEND = 'https://lab-experiment-share-production.up.railway.app';
const IMAGE_EXTS = ['jpg','jpeg','png','webp','gif','bmp'];
const isImg = (n) => IMAGE_EXTS.includes((n||'').split('.').pop().toLowerCase());

const hashStr = (s) => { let h=0x811c9dc5; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;} return h.toString(36); };
const getDeviceId = () => 'hw_'+hashStr([navigator.platform||'',screen.width,screen.height,Math.round((window.devicePixelRatio||1)*10),navigator.hardwareConcurrency||0,navigator.deviceMemory||0,navigator.maxTouchPoints||0,Intl.DateTimeFormat().resolvedOptions().timeZone,screen.colorDepth].join('|'));

const PROMPTS = {
  dbms:`You are an SQL extraction engine analyzing terminal screenshots from a lab session. Images may be in random order.\n1. Determine the CORRECT chronological order.\n2. Extract ONLY valid, successfully executed SQL statements.\nExclude: console output, errors, warnings, failed queries.\nReturn ONLY a clean executable MySQL script. No explanations.`,
  linux:`You are a Linux command extraction engine. Images may be in random order.\n1. Determine the CORRECT chronological order.\n2. Extract ONLY user-typed commands, NOT the output.\nReturn ONLY the clean command list, one per line.`,
  c:`You are a C program extractor. Images may be in random order.\n1. Determine correct order by program structure.\n2. Reconstruct complete C source code.\nReturn ONLY complete compilable C code.`,
  python:`You are a Python code extractor. Images may be in random order.\n1. Determine correct order.\n2. Extract ONLY Python code, not output.\nReturn ONLY clean executable Python code.`
};

const Stars = () => {
  const ref = useRef();
  useEffect(()=>{
    const c=ref.current; if(!c) return;
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize(); window.addEventListener('resize',resize);
    const ctx=c.getContext('2d');
    const stars=Array.from({length:300},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.2+0.1,a:Math.random()*0.6+0.05,t:Math.random()*Math.PI*2}));
    let raf,tick=0;
    const draw=()=>{ctx.clearRect(0,0,c.width,c.height);tick+=0.006;stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${s.a*(0.6+0.4*Math.sin(s.t+tick))})`;ctx.fill();});raf=requestAnimationFrame(draw);};
    draw(); return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={ref} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>;
};

const AddModal = ({ text, onClose }) => {
  const [mode,setMode]=useState('existing'); const [group,setGroup]=useState('A'); const [lab,setLab]=useState('DBMS');
  const [exps,setExps]=useState([]); const [sel,setSel]=useState(''); const [title,setTitle]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{axios.get(`/api/experiments?group=${group}&lab=${lab}`).then(r=>{setExps(r.data.experiments||[]);setSel('');}).catch(()=>{});},[group,lab]);
  const save=async()=>{
    setBusy(true);
    try{
      let id=sel;
      if(mode==='new'){if(!title.trim()){toast.error('Enter a title');setBusy(false);return;} const r=await axios.post('/api/experiments',{title:title.trim(),group,lab,isRandom:false});id=r.data.experiment._id;}
      if(!id){toast.error('Select an experiment');setBusy(false);return;}
      const blob=new Blob([text],{type:'text/plain'}); const file=new File([blob],`swami_${lab}_${Date.now()}.txt`,{type:'text/plain'});
      const fd=new FormData(); fd.append('file',file); fd.append('experimentId',id); fd.append('group',group); fd.append('lab',lab); fd.append('deviceId',getDeviceId());
      await axios.post('/api/files/upload',fd,{headers:{'Content-Type':'multipart/form-data'}});
      toast.success(`Saved to Group ${group} — ${lab}!`); onClose();
    }catch(e){toast.error(e.response?.data?.message||e.message);}finally{setBusy(false);}
  };
  const tab=(active,accent='#ff6b00')=>({flex:1,padding:'9px 0',borderRadius:8,border:active?`1px solid ${accent}50`:'1px solid rgba(255,255,255,0.08)',background:active?`${accent}18`:'rgba(255,255,255,0.03)',color:active?accent:'#555',fontWeight:900,fontSize:11,cursor:'pointer'});
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.93)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(20px)'}}>
      <div style={{background:'#0c0c10',border:'1px solid rgba(255,107,0,0.25)',borderRadius:24,width:'100%',maxWidth:460,padding:32}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <div><div style={{fontWeight:900,fontSize:15,textTransform:'uppercase',letterSpacing:1.5,color:'#fff'}}>Add to Experiment</div><div style={{color:'#444',fontSize:9,fontWeight:700,marginTop:3,textTransform:'uppercase',letterSpacing:2}}>Save AI output</div></div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {[['Group',['A','B'],group,setGroup],['Lab',['DBMS','OS'],lab,setLab]].map(([lbl,vals,val,set])=>(
            <div key={lbl}><div style={{color:'#333',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:2,marginBottom:6}}>{lbl}</div>
            <div style={{display:'flex',gap:6}}>{vals.map(v=><button key={v} onClick={()=>set(v)} style={tab(val===v)}>{v}</button>)}</div></div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>{[['existing','Existing'],['new','New']].map(([id,lbl])=><button key={id} onClick={()=>setMode(id)} style={tab(mode===id,'#ffd700')}>{lbl}</button>)}</div>
        {mode==='existing'
          ?<select value={sel} onChange={e=>setSel(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'11px 14px',color:exps.length?'#fff':'#444',fontWeight:700,fontSize:12,cursor:'pointer',outline:'none',marginBottom:16}}>
            <option value="">{exps.length?'Select experiment…':`No experiments in ${group}·${lab}`}</option>
            {exps.map(e=><option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          :<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Experiment title…" style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'11px 14px',color:'#fff',fontWeight:700,fontSize:12,outline:'none',marginBottom:16,boxSizing:'border-box'}}/>
        }
        <button onClick={save} disabled={busy} style={{width:'100%',padding:'13px 0',borderRadius:12,background:busy?'rgba(255,107,0,0.15)':'#ff6b00',border:'none',color:'#000',fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:2,cursor:busy?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <Send size={13}/>{busy?'Saving…':'Add to Experiment'}
        </button>
      </div>
    </div>
  );
};

export default function SwamiBotPage({ navigate }) {
  const [imgs,setImgs]=useState([]); const [mode,setMode]=useState('dbms');
  const [busy,setBusy]=useState(false); const [out,setOut]=useState(''); const [done,setDone]=useState(false);
  const [status,setStat]=useState(''); const [copied,setCopied]=useState(false);
  const [showAdd,setShowAdd]=useState(false); const [drag,setDrag]=useState(false);
  const fileRef=useRef(); const folderRef=useRef();

  const addFiles=list=>{
    const ok=Array.from(list).filter(f=>isImg(f.name)).map(f=>({name:f.name,url:URL.createObjectURL(f),blob:f}));
    if(list.length&&!ok.length){toast.error('Only image files supported');return;}
    setImgs(p=>[...p,...ok]);setDone(false);setOut('');
  };
  const onFiles=e=>{addFiles(e.target.files);e.target.value='';};
  const onFolder=e=>{addFiles(e.target.files);e.target.value='';};
  const onDrop=e=>{e.preventDefault();setDrag(false);const f=[];for(let i=0;i<e.dataTransfer.items.length;i++){const x=e.dataTransfer.items[i].getAsFile?.();if(x)f.push(x);}if(f.length)addFiles(f);};

  const analyze=async()=>{
    if(!imgs.length){toast.error('Upload at least one image');return;}
    setBusy(true);setDone(false);setOut('');
    try{
      setStat('Preparing images…');
      const imageData=await Promise.all(imgs.map(img=>new Promise(res=>{const r=new FileReader();r.onload=e=>res({base64:e.target.result.split(',')[1],mimeType:img.blob.type||'image/jpeg',name:img.name});r.readAsDataURL(img.blob);})));
      setStat(`Analyzing ${imgs.length} image${imgs.length>1?'s':''}…`);
      const resp=await fetch(BACKEND+'/api/swami-analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({images:imageData,prompt:PROMPTS[mode]})});
      const data=await resp.json();
      if(!resp.ok||data.error)throw new Error(data.error||'Server error');
      setOut(data.text||'No content extracted.');setDone(true);
    }catch(e){setOut('Analysis failed.\n\nError: '+e.message);setDone(true);}
    finally{setBusy(false);setStat('');}
  };
  const copy=()=>{navigator.clipboard.writeText(out);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  const MODES=[{id:'dbms',label:'DBMS / SQL'},{id:'linux',label:'Linux / OS'},{id:'c',label:'C Program'},{id:'python',label:'Python'}];

  return(
    <div style={{minHeight:'100vh',width:'100vw',background:'#03020a',position:'relative',overflowX:'hidden'}}>
      {showAdd&&<AddModal text={out} onClose={()=>setShowAdd(false)}/>}

      {/* ── FULL-SCREEN BACKGROUND ── */}
      <div style={{position:'fixed',inset:0,zIndex:0}}>
        {/* swami image — full cover */}
        <img src="/swami.png" alt=""
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',
            opacity:0.88,
            maskImage:'linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,0.95) 30%,rgba(0,0,0,0.55) 55%,rgba(0,0,0,0.1) 72%,transparent 82%)',
            WebkitMaskImage:'linear-gradient(to bottom,rgba(0,0,0,1) 0%,rgba(0,0,0,0.95) 30%,rgba(0,0,0,0.55) 55%,rgba(0,0,0,0.1) 72%,transparent 82%)'}}
          onError={e=>e.target.style.display='none'}/>
        {/* gradient: sides dark, bottom dark */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 0%,transparent 50%,rgba(3,2,10,0.75) 65%,#03020a 80%)'}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 90% 100% at 50% 0%,transparent 50%,rgba(3,2,10,0.3) 100%)'}}/>
        <Stars/>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:200,height:54,background:'#000',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer'}} onClick={()=>navigate('home')}>
          <div style={{width:30,height:30,background:'#ff6b00',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#000',fontSize:13}}>A</div>
          <span style={{fontWeight:900,fontSize:15,letterSpacing:'0.05em',color:'#fff',textTransform:'uppercase'}}>ADAMVILLA<span style={{color:'#ff6b00'}}>.</span></span>
        </div>
        <button onClick={()=>navigate('home')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer'}}>← HOME</button>
      </nav>

      {/* ── PAGE CONTENT — full width, no max-width cap on outer ── */}
      <div style={{position:'relative',zIndex:10,paddingTop:54,width:'100%'}}>

        {/* Hero section — full viewport width */}
        <div style={{width:'100%',textAlign:'center',padding:'0 20px',boxSizing:'border-box'}}>
          <div style={{height:'clamp(240px,30vh,360px)'}}/>
          <h1 style={{margin:'0 0 0',lineHeight:1,letterSpacing:'0.06em',fontFamily:"'Bebas Neue','Arial Black',sans-serif",fontSize:'clamp(44px,7vw,90px)',fontWeight:400,textShadow:'0 4px 40px rgba(0,0,0,0.95),0 1px 8px rgba(0,0,0,0.8)'}}>
            <span style={{color:'#fff'}}>VIGNESHWARA </span><span style={{color:'#ff6b00'}}>SWAMI</span>
          </h1>
          <div style={{display:'inline-flex',alignItems:'center',gap:12,margin:'12px 0 10px'}}>
            <div style={{height:1,width:44,background:'rgba(255,107,0,0.35)'}}/>
            <span style={{color:'#ff9a40',fontSize:11,fontWeight:700,letterSpacing:'0.28em',textTransform:'uppercase'}}>AI Oracle</span>
            <div style={{height:1,width:44,background:'rgba(255,107,0,0.35)'}}/>
          </div>
          <p style={{color:'rgba(255,255,255,0.38)',fontSize:13,margin:'0 0 32px',letterSpacing:'0.02em'}}>
            Upload lab screenshots — I'll extract clean executable code in the correct order
          </p>
        </div>

        {/* ── TOOL PANEL — full width with generous padding ── */}
        <div style={{width:'100%',padding:'0 40px 60px',boxSizing:'border-box'}}>
          <div style={{background:'rgba(11,11,15,0.96)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:18,overflow:'hidden',backdropFilter:'blur(24px)',maxWidth:1200,margin:'0 auto'}}>

            {/* Mode tabs */}
            <div style={{padding:'16px 28px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span style={{color:'#2a2a2a',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em',marginRight:4}}>Mode :</span>
              {MODES.map(m=>(
                <button key={m.id} onClick={()=>{setMode(m.id);setDone(false);setOut('');}}
                  style={{padding:'7px 18px',borderRadius:8,border:mode===m.id?'none':'1px solid rgba(255,255,255,0.07)',background:mode===m.id?'#ff6b00':'rgba(255,255,255,0.03)',color:mode===m.id?'#000':'#555',fontWeight:900,fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer',transition:'all 0.15s'}}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Two-column layout for large screens */}
            <div className='swami-grid' style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>

              {/* LEFT: Upload zone */}
              <div style={{padding:'24px 28px',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{marginBottom:10,color:'#333',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.18em'}}>Upload</div>
                <div
                  onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
                  onClick={()=>imgs.length===0&&fileRef.current.click()}
                  style={{border:`2px dashed ${drag?'rgba(255,107,0,0.5)':'rgba(255,255,255,0.09)'}`,borderRadius:14,padding:imgs.length>0?'18px':'36px 24px',background:drag?'rgba(255,107,0,0.04)':'rgba(0,0,0,0.3)',transition:'all 0.2s',textAlign:imgs.length>0?'left':'center',cursor:imgs.length===0?'pointer':'default',minHeight:200,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  {imgs.length===0?(
                    <div>
                      <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,107,0,0.09)',border:'1px solid rgba(255,107,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                        <Upload size={22} color="#ff6b00"/>
                      </div>
                      <p style={{color:'#ddd',fontWeight:900,fontSize:14,margin:'0 0 6px',textTransform:'uppercase',letterSpacing:'0.1em'}}>Drop Images Here</p>
                      <p style={{color:'#2e2e2e',fontSize:11,margin:'0 0 22px'}}>or use the buttons below &nbsp;|&nbsp; JPG, PNG, WebP supported</p>
                      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                        <button onClick={e=>{e.stopPropagation();fileRef.current.click();}}
                          style={{display:'flex',alignItems:'center',gap:7,padding:'11px 24px',borderRadius:9,background:'#ff6b00',border:'none',color:'#000',fontWeight:900,fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                          <Upload size={13}/> Upload Images
                        </button>
                        <button onClick={e=>{e.stopPropagation();folderRef.current.click();}}
                          style={{display:'flex',alignItems:'center',gap:7,padding:'11px 24px',borderRadius:9,background:'rgba(0,180,255,0.1)',border:'1px solid rgba(0,194,255,0.25)',color:'#00c2ff',fontWeight:900,fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                          <FolderUp size={13}/> Upload Folder
                        </button>
                      </div>
                    </div>
                  ):(
                    <div style={{width:'100%'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(68px,1fr))',gap:8,marginBottom:14}}>
                        {imgs.map((img,i)=>(
                          <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:10,overflow:'hidden',border:'1px solid rgba(255,255,255,0.1)'}}>
                            <img src={img.url} alt={img.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            <button onClick={()=>setImgs(p=>p.filter((_,x)=>x!==i))}
                              style={{position:'absolute',top:3,right:3,width:17,height:17,borderRadius:999,background:'rgba(0,0,0,0.88)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
                              <X size={9}/>
                            </button>
                          </div>
                        ))}
                        <div onClick={()=>fileRef.current.click()}
                          style={{aspectRatio:'1',borderRadius:10,border:'1px dashed rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.02)',color:'#2a2a2a',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3}}>
                          <Plus size={14}/><span style={{fontSize:8,fontWeight:900,letterSpacing:1}}>ADD</span>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:10}}>
                        <span style={{color:'#3a3a3a',fontSize:10,fontWeight:700}}>{imgs.length} image{imgs.length!==1?'s':''} loaded</span>
                        <button onClick={()=>{setImgs([]);setOut('');setDone(false);}} style={{color:'#cc3333',fontSize:10,fontWeight:900,background:'none',border:'none',cursor:'pointer',textTransform:'uppercase',letterSpacing:1}}>Clear All</button>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" multiple accept="image/*" style={{display:'none'}} onChange={onFiles}/>
                <input ref={folderRef} type="file" webkitdirectory="true" multiple style={{display:'none'}} onChange={onFolder}/>

                {/* Analyze button */}
                <button onClick={analyze} disabled={busy||!imgs.length}
                  style={{width:'100%',marginTop:14,padding:'14px 20px',borderRadius:11,
                    background:busy?'rgba(255,255,255,0.03)':imgs.length?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.02)',
                    border:`1px solid ${busy?'rgba(255,107,0,0.3)':imgs.length?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.05)'}`,
                    color:imgs.length?'#888':'#252525',fontWeight:600,fontSize:13,letterSpacing:'0.04em',
                    cursor:busy||!imgs.length?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:10,transition:'all 0.2s'}}>
                  {busy?(
                    <><div style={{width:15,height:15,borderRadius:'50%',border:'2px solid rgba(255,107,0,0.18)',borderTop:'2px solid #ff6b00',animation:'spin 0.8s linear infinite',flexShrink:0}}/><span style={{color:'#ff6b00',fontWeight:700}}>{status||'Swami is thinking…'}</span></>
                  ):(
                    <><Search size={14} style={{flexShrink:0}}/><span>Ask Vigneshwara Swami</span>
                    {imgs.length>0&&<span style={{marginLeft:'auto',background:'#ff6b00',color:'#000',fontSize:9,fontWeight:900,padding:'3px 10px',borderRadius:999,letterSpacing:'0.1em'}}>{done?'RE-ANALYZE':'ANALYZE →'}</span>}</>
                  )}
                </button>
              </div>

              {/* RIGHT: Output */}
              <div style={{padding:'24px 28px',display:'flex',flexDirection:'column'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <FileText size={14} color="#ff6b00"/>
                    <span style={{color:'#333',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em'}}>Output</span>
                    {done&&out&&<div style={{width:6,height:6,borderRadius:'50%',background:'#00e87a',animation:'pulse 2s infinite'}}/>}
                  </div>
                  {done&&out&&(
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={copy}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'5px 13px',borderRadius:999,border:'1px solid rgba(255,255,255,0.07)',background:copied?'rgba(0,255,140,0.07)':'rgba(255,255,255,0.025)',color:copied?'#00e87a':'#4a4a4a',fontWeight:900,fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                        {copied?<Check size={10}/>:<Copy size={10}/>}{copied?'Copied!':'Copy'}
                      </button>
                      <button onClick={()=>setShowAdd(true)}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'5px 13px',borderRadius:999,border:'1px solid rgba(255,107,0,0.3)',background:'rgba(255,107,0,0.08)',color:'#ff6b00',fontWeight:900,fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',cursor:'pointer'}}>
                        <Plus size={10}/> Add to Experiment
                      </button>
                    </div>
                  )}
                </div>

                <div style={{flex:1,background:'rgba(5,5,10,0.7)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:12,padding:'18px 20px',position:'relative',minHeight:240,overflow:'auto'}}>
                  {!out&&!busy&&(
                    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:9}}>
                      <Zap size={26} color="#141420"/>
                      <span style={{color:'#141420',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.25em'}}>Output will appear here</span>
                    </div>
                  )}
                  {busy&&(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',minHeight:200,gap:12}}>
                      <div style={{width:40,height:40,borderRadius:'50%',border:'2px solid rgba(255,107,0,0.12)',borderTop:'2px solid #ff6b00',animation:'spin 1s linear infinite'}}/>
                      <span style={{color:'#ff6b00',fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.18em'}}>Swami is thinking…</span>
                      <span style={{color:'#1e1e28',fontSize:10,fontFamily:'monospace'}}>{status}</span>
                    </div>
                  )}
                  {out&&(
                    <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',color:'#c4c4cc',fontFamily:"'Courier New',monospace",fontSize:12.5,lineHeight:1.85,margin:0}}>
                      {out}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{padding:'11px 28px 14px',borderTop:'1px solid rgba(255,255,255,0.04)',textAlign:'center'}}>
              <p style={{color:'#1c1c1c',fontSize:9,fontWeight:700,margin:0,textTransform:'uppercase',letterSpacing:'0.18em'}}>
                By using this tool, you agree to our <span style={{color:'#ff6b00',cursor:'pointer'}}>Terms of Service</span> &amp; <span style={{color:'#ff6b00',cursor:'pointer'}}>Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.25}}
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @media(max-width:768px){
          .swami-grid{grid-template-columns:1fr !important;}
          .swami-grid > div:first-child{border-right:none !important;border-bottom:1px solid rgba(255,255,255,0.06);}
        }
      `}</style>
    </div>
  );
}
