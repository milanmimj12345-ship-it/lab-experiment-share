import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, Shield, Trash2, Plus, LogOut, RefreshCw, Users,
  FlaskConical, MessageSquare, ChevronDown, ChevronRight, X, Check,
  AlertTriangle, Database, Layers
} from 'lucide-react';
import axios from '../axiosConfig';
import toast from 'react-hot-toast';

const ADMIN_USER = 'milan';
const ADMIN_PASS = 'milan@8603';

/* ── tiny helpers ── */
const Tag = ({children, color='#ff6b00'}) => (
  <span style={{background:`${color}18`,border:`1px solid ${color}35`,borderRadius:6,padding:'2px 8px',fontSize:9,fontWeight:900,color,textTransform:'uppercase',letterSpacing:1}}>{children}</span>
);
const Btn = ({children,onClick,danger,disabled,small,outline,color='#ff6b00',icon:Icon,...rest}) => (
  <button onClick={onClick} disabled={disabled} {...rest}
    style={{display:'flex',alignItems:'center',gap:6,padding:small?'6px 12px':'9px 18px',borderRadius:9,
      border:outline?`1px solid ${danger?'rgba(255,60,60,0.35)':color+'40'}`:'none',
      background:outline?(danger?'rgba(255,60,60,0.06)':`${color}10`):danger?'rgba(255,60,60,0.85)':color,
      color:outline?(danger?'#ff5555':color):(danger||!outline)?'#000':'#000',
      fontWeight:900,fontSize:small?10:11,textTransform:'uppercase',letterSpacing:1,
      cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.45:1,transition:'all 0.15s',flexShrink:0}}>
    {Icon&&<Icon size={small?11:13}/>}{children}
  </button>
);

/* ── Login screen ── */
const LoginScreen = ({onLogin}) => {
  const [u,setU]=useState(''); const [p,setP]=useState(''); const [err,setErr]=useState('');
  const submit = e => {
    e.preventDefault();
    if(u===ADMIN_USER && p===ADMIN_PASS){ onLogin(); }
    else{ setErr('Invalid credentials'); setU(''); setP(''); }
  };
  return(
    <div style={{minHeight:'100vh',background:'#040408',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:64,height:64,background:'rgba(255,107,0,0.1)',border:'1px solid rgba(255,107,0,0.25)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Shield size={28} color="#ff6b00"/>
          </div>
          <h1 style={{fontWeight:900,fontSize:22,textTransform:'uppercase',letterSpacing:2,color:'#fff',margin:'0 0 4px'}}>Admin Panel</h1>
          <p style={{color:'#444',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:2,margin:0}}>Adamvilla · Restricted Access</p>
        </div>
        <form onSubmit={submit} style={{background:'#0b0b10',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:28,display:'flex',flexDirection:'column',gap:14}}>
          {['Username','Password'].map((lbl,i)=>(
            <div key={lbl}>
              <label style={{display:'block',color:'#444',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:2,marginBottom:6}}>{lbl}</label>
              <input type={i?'password':'text'} value={i?p:u} onChange={e=>i?setP(e.target.value):setU(e.target.value)}
                placeholder={lbl} autoComplete={i?'current-password':'username'}
                style={{width:'100%',background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'11px 14px',color:'#fff',fontWeight:700,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
          ))}
          {err&&<div style={{display:'flex',alignItems:'center',gap:7,padding:'8px 12px',background:'rgba(255,60,60,0.08)',border:'1px solid rgba(255,60,60,0.2)',borderRadius:8}}><AlertTriangle size={12} color="#ff5555"/><span style={{color:'#ff5555',fontSize:11,fontWeight:700}}>{err}</span></div>}
          <button type="submit" style={{padding:'13px 0',borderRadius:11,background:'#ff6b00',border:'none',color:'#000',fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:2,cursor:'pointer',marginTop:4,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <Lock size={13}/> Access Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── Confirm dialog ── */
const Confirm = ({msg,onYes,onNo}) => (
  <div style={{position:'fixed',inset:0,zIndex:5000,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(12px)'}}>
    <div style={{background:'#0d0d12',border:'1px solid rgba(255,60,60,0.25)',borderRadius:18,padding:28,maxWidth:380,width:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <AlertTriangle size={20} color="#ff5555"/>
        <span style={{color:'#fff',fontWeight:900,fontSize:14}}>Confirm Delete</span>
      </div>
      <p style={{color:'#888',fontSize:13,margin:'0 0 22px',lineHeight:1.6}}>{msg}</p>
      <div style={{display:'flex',gap:10}}>
        <Btn onClick={onNo} outline color="#888" style={{flex:1,justifyContent:'center'}}>Cancel</Btn>
        <Btn onClick={onYes} danger style={{flex:1,justifyContent:'center'}} icon={Trash2}>Delete</Btn>
      </div>
    </div>
  </div>
);

/* ── Section wrapper ── */
const Section = ({title,icon:Icon,color='#ff6b00',count,children,actions}) => {
  const [open,setOpen]=useState(true);
  return(
    <div style={{background:'#0b0b10',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,overflow:'hidden',marginBottom:20}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'16px 20px',background:'none',border:'none',cursor:'pointer',borderBottom:open?'1px solid rgba(255,255,255,0.06)':'none'}}>
        <div style={{width:34,height:34,borderRadius:10,background:`${color}14`,border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon size={16} color={color}/>
        </div>
        <span style={{fontWeight:900,fontSize:13,color:'#fff',textTransform:'uppercase',letterSpacing:1}}>{title}</span>
        {count!=null&&<Tag color={color}>{count}</Tag>}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
          {actions&&<div onClick={e=>e.stopPropagation()}>{actions}</div>}
          {open?<ChevronDown size={14} color="#444"/>:<ChevronRight size={14} color="#444"/>}
        </div>
      </button>
      {open&&<div style={{padding:'16px 20px'}}>{children}</div>}
    </div>
  );
};

/* ═══════════════ MAIN ADMIN PANEL ═══════════════ */
const AdminDashboard = ({onLogout}) => {
  /* state */
  const [labs,setLabs]   = useState(['DBMS','OS']);
  const [groups,setGroups] = useState(['A','B']);
  const [experiments,setExps] = useState([]);
  const [chats,setChats] = useState([]);
  const [files,setFiles] = useState([]);
  const [loading,setLoading] = useState({exps:false,chats:false,files:false});
  const [confirm,setConfirm] = useState(null); // {msg, onYes}

  /* new-item inputs */
  const [newLab,setNewLab]   = useState('');
  const [newGroup,setNewGroup] = useState('');
  const [newExp,setNewExp]   = useState({title:'',group:'A',lab:'DBMS'});

  /* fetch all data */
  const loadExps = useCallback(async()=>{
    setLoading(l=>({...l,exps:true}));
    try{ const r=await axios.get('/api/admin-panel/experiments'); setExps(r.data.experiments||[]); }
    catch(e){ toast.error('Failed to load experiments'); }
    finally{ setLoading(l=>({...l,exps:false})); }
  },[]);

  const loadChats = useCallback(async()=>{
    setLoading(l=>({...l,chats:true}));
    try{ const r=await axios.get('/api/chat/history'); setChats(r.data.messages||[]); }
    catch(e){ toast.error('Failed to load chats'); }
    finally{ setLoading(l=>({...l,chats:false})); }
  },[]);

  const loadFiles = useCallback(async()=>{
    setLoading(l=>({...l,files:true}));
    try{ const r=await axios.get('/api/files'); setFiles(r.data.files||[]); }
    catch(e){ toast.error('Failed to load files'); }
    finally{ setLoading(l=>({...l,files:false})); }
  },[]);

  useEffect(()=>{ loadExps(); loadChats(); loadFiles(); },[]);

  const ask = (msg,onYes) => setConfirm({msg,onYes});
  const closeConfirm = () => setConfirm(null);

  /* ── Lab management (local only — used as filter for experiments) ── */
  const addLab = () => {
    const v = newLab.trim().toUpperCase();
    if(!v){ toast.error('Enter lab name'); return; }
    if(labs.includes(v)){ toast.error('Lab already exists'); return; }
    setLabs(l=>[...l,v]); setNewLab(''); toast.success(`Lab "${v}" added`);
  };
  const deleteLab = (lab) => ask(
    `Delete lab "${lab}"? This will also delete all its experiments and files permanently.`,
    async()=>{
      try{
        const expIds = experiments.filter(e=>e.lab===lab).map(e=>e._id);
        await Promise.all(expIds.map(id=>axios.delete(`/api/experiments/${id}`)));
        setLabs(l=>l.filter(x=>x!==lab)); setExps(e=>e.filter(x=>x.lab!==lab));
        toast.success(`Lab "${lab}" deleted`);
      }catch(e){ toast.error(e.message); } finally{ closeConfirm(); }
    }
  );

  /* ── Group management ── */
  const addGroup = () => {
    const v = newGroup.trim().toUpperCase();
    if(!v){ toast.error('Enter group name'); return; }
    if(groups.includes(v)){ toast.error('Group already exists'); return; }
    setGroups(g=>[...g,v]); setNewGroup(''); toast.success(`Group "${v}" added`);
  };
  const deleteGroup = (grp) => ask(
    `Delete group "${grp}"? All experiments and files in this group will be permanently deleted.`,
    async()=>{
      try{
        const expIds = experiments.filter(e=>e.group===grp).map(e=>e._id);
        await Promise.all(expIds.map(id=>axios.delete(`/api/experiments/${id}`)));
        setGroups(g=>g.filter(x=>x!==grp)); setExps(e=>e.filter(x=>x.group!==grp));
        toast.success(`Group "${grp}" deleted`);
      }catch(e){ toast.error(e.message); } finally{ closeConfirm(); }
    }
  );

  /* ── Experiment management ── */
  const addExp = async() => {
    if(!newExp.title.trim()){ toast.error('Enter experiment title'); return; }
    try{
      const r=await axios.post('/api/experiments',{title:newExp.title.trim(),group:newExp.group,lab:newExp.lab,isRandom:false});
      setExps(e=>[...e,r.data.experiment]); setNewExp(n=>({...n,title:''}));
      toast.success('Experiment created');
    }catch(e){ toast.error(e.response?.data?.message||e.message); }
  };
  const deleteExp = (exp) => ask(
    `Delete experiment "${exp.title}" (${exp.group}·${exp.lab})? All files inside will be permanently deleted.`,
    async()=>{
      try{ await axios.delete(`/api/experiments/${exp._id}`); setExps(e=>e.filter(x=>x._id!==exp._id)); toast.success('Deleted'); }
      catch(e){ toast.error(e.message); } finally{ closeConfirm(); }
    }
  );

  /* ── Chat management ── */
  const clearAllChats = () => ask(
    'Delete ALL chat messages? This cannot be undone.',
    async()=>{
      try{ await axios.delete('/api/admin-panel/chats'); setChats([]); toast.success('All chats cleared'); }
      catch(e){ toast.error(e.message); } finally{ closeConfirm(); }
    }
  );
  const deleteChat = (id) => ask('Delete this message?', async()=>{
    try{ await axios.delete(`/api/admin-panel/chats/${id}`); setChats(c=>c.filter(x=>x._id!==id)); toast.success('Message deleted'); }
    catch(e){ toast.error(e.message); } finally{ closeConfirm(); }
  });

  /* ── File management ── */
  const deleteFile = (file) => ask(
    `Delete file "${file.fileName}"?`,
    async()=>{
      try{ await axios.delete(`/api/files/${file._id}`); setFiles(f=>f.filter(x=>x._id!==file._id)); toast.success('File deleted'); }
      catch(e){ toast.error(e.message); } finally{ closeConfirm(); }
    }
  );

  /* helpers */
  const inp = (val,set,ph,onKey)=>(
    <input value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onKey&&onKey()}
      placeholder={ph} style={{flex:1,background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'9px 13px',color:'#fff',fontWeight:700,fontSize:12,outline:'none'}}/>
  );
  const sel=(val,set,opts,style={})=>(
    <select value={val} onChange={e=>set(e.target.value)}
      style={{background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'9px 12px',color:'#fff',fontWeight:700,fontSize:11,cursor:'pointer',outline:'none',...style}}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );

  /* stats */
  const totalFiles = files.length;
  const totalChats = chats.length;
  const totalExps  = experiments.length;

  return(
    <div style={{minHeight:'100vh',background:'#040408',padding:'0 0 60px'}}>
      {confirm&&<Confirm msg={confirm.msg} onYes={confirm.onYes} onNo={closeConfirm}/>}

      {/* ── Navbar ── */}
      <nav style={{background:'#000',borderBottom:'1px solid rgba(255,255,255,0.07)',padding:'0 28px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,background:'#ff6b00',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#000',fontSize:13}}>A</div>
          <span style={{fontWeight:900,fontSize:14,color:'#fff',textTransform:'uppercase',letterSpacing:'0.05em'}}>Adamvilla<span style={{color:'#ff6b00'}}>.</span></span>
          <span style={{color:'#333',fontSize:10,fontWeight:700,marginLeft:6,textTransform:'uppercase',letterSpacing:2}}>Admin Panel</span>
        </div>
        <Btn onClick={onLogout} outline color="#888" small icon={LogOut}>Logout</Btn>
      </nav>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 24px 0'}}>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          {[
            {label:'Labs',val:labs.length,icon:Database,color:'#ff6b00'},
            {label:'Groups',val:groups.length,icon:Layers,color:'#00c2ff'},
            {label:'Experiments',val:totalExps,icon:FlaskConical,color:'#a855f7'},
            {label:'Files',val:totalFiles,icon:Users,color:'#00ff8c'},
            {label:'Chat Messages',val:totalChats,icon:MessageSquare,color:'#ffd700'},
          ].map(s=>(
            <div key={s.label} style={{background:'#0b0b10',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'16px 18px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:11,background:`${s.color}12`,border:`1px solid ${s.color}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <s.icon size={16} color={s.color}/>
              </div>
              <div>
                <div style={{fontWeight:900,fontSize:22,color:'#fff',lineHeight:1}}>{s.val}</div>
                <div style={{color:'#444',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ LABS ══ */}
        <Section title="Lab Subjects" icon={Database} color="#ff6b00" count={labs.length}>
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {inp(newLab,setNewLab,'New lab name (e.g. DSA)',addLab)}
            <Btn onClick={addLab} icon={Plus}>Add Lab</Btn>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {labs.map(lab=>(
              <div key={lab} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 12px',borderRadius:10,background:'rgba(255,107,0,0.07)',border:'1px solid rgba(255,107,0,0.2)'}}>
                <span style={{color:'#ff6b00',fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:1}}>{lab}</span>
                {!['DBMS','OS'].includes(lab)&&(
                  <button onClick={()=>deleteLab(lab)} style={{width:16,height:16,borderRadius:999,background:'rgba(255,60,60,0.15)',border:'none',color:'#ff5555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
                    <X size={9}/>
                  </button>
                )}
                {['DBMS','OS'].includes(lab)&&<span style={{color:'#333',fontSize:8,fontWeight:700}}>default</span>}
              </div>
            ))}
          </div>
        </Section>

        {/* ══ GROUPS ══ */}
        <Section title="Groups" icon={Layers} color="#00c2ff" count={groups.length}>
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {inp(newGroup,setNewGroup,'New group name (e.g. C)',addGroup)}
            <Btn onClick={addGroup} color="#00c2ff" icon={Plus}>Add Group</Btn>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {groups.map(grp=>(
              <div key={grp} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 12px',borderRadius:10,background:'rgba(0,194,255,0.07)',border:'1px solid rgba(0,194,255,0.2)'}}>
                <span style={{color:'#00c2ff',fontWeight:900,fontSize:12,textTransform:'uppercase',letterSpacing:1}}>Group {grp}</span>
                {!['A','B'].includes(grp)&&(
                  <button onClick={()=>deleteGroup(grp)} style={{width:16,height:16,borderRadius:999,background:'rgba(255,60,60,0.15)',border:'none',color:'#ff5555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
                    <X size={9}/>
                  </button>
                )}
                {['A','B'].includes(grp)&&<span style={{color:'#333',fontSize:8,fontWeight:700}}>default</span>}
              </div>
            ))}
          </div>
        </Section>

        {/* ══ EXPERIMENTS ══ */}
        <Section title="Experiments" icon={FlaskConical} color="#a855f7" count={totalExps}
          actions={<Btn onClick={loadExps} outline color="#a855f7" small icon={RefreshCw}>Refresh</Btn>}>
          {/* Add experiment */}
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',padding:'14px',background:'rgba(168,85,247,0.04)',borderRadius:12,border:'1px solid rgba(168,85,247,0.12)'}}>
            <input value={newExp.title} onChange={e=>setNewExp(n=>({...n,title:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&addExp()}
              placeholder="Experiment title…"
              style={{flex:1,minWidth:180,background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'9px 13px',color:'#fff',fontWeight:700,fontSize:12,outline:'none'}}/>
            {sel(newExp.group,v=>setNewExp(n=>({...n,group:v})),groups)}
            {sel(newExp.lab,v=>setNewExp(n=>({...n,lab:v})),labs)}
            <Btn onClick={addExp} color="#a855f7" icon={Plus}>Add</Btn>
          </div>

          {/* Group by lab then group */}
          {loading.exps?<div style={{color:'#444',fontSize:12,textAlign:'center',padding:20}}>Loading…</div>:(
            labs.map(lab=>(
              <div key={lab} style={{marginBottom:16}}>
                <div style={{color:'#555',fontSize:9,fontWeight:900,textTransform:'uppercase',letterSpacing:2,marginBottom:8,paddingLeft:2}}>{lab} Lab</div>
                {groups.map(grp=>{
                  const expList = experiments.filter(e=>e.lab===lab&&e.group===grp);
                  return(
                    <div key={grp} style={{marginBottom:8}}>
                      <div style={{color:'#333',fontSize:8,fontWeight:900,textTransform:'uppercase',letterSpacing:2,marginBottom:6,paddingLeft:2}}>Group {grp}</div>
                      {expList.length===0
                        ?<div style={{color:'#222',fontSize:10,padding:'8px 12px',background:'rgba(255,255,255,0.02)',borderRadius:8}}>No experiments</div>
                        :(
                          <div style={{display:'flex',flexDirection:'column',gap:5}}>
                            {expList.map(exp=>(
                              <div key={exp._id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',background:'rgba(168,85,247,0.04)',border:'1px solid rgba(168,85,247,0.1)',borderRadius:10}}>
                                <span style={{color:'#888',fontSize:10,fontWeight:700,minWidth:20}}>{exp.experimentNumber||'—'}</span>
                                <span style={{color:'#ccc',fontSize:12,fontWeight:700,flex:1}}>{exp.title}</span>
                                <Tag color="#a855f7">{exp.group}</Tag>
                                <Tag color="#ff6b00">{exp.lab}</Tag>
                                <button onClick={()=>deleteExp(exp)}
                                  style={{width:26,height:26,borderRadius:7,background:'rgba(255,60,60,0.08)',border:'1px solid rgba(255,60,60,0.15)',color:'#ff5555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,flexShrink:0}}>
                                  <Trash2 size={11}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </Section>

        {/* ══ CHAT ══ */}
        <Section title="Chat Messages" icon={MessageSquare} color="#ffd700" count={totalChats}
          actions={
            <div style={{display:'flex',gap:8}}>
              <Btn onClick={loadChats} outline color="#ffd700" small icon={RefreshCw}>Refresh</Btn>
              {chats.length>0&&<Btn onClick={clearAllChats} danger small icon={Trash2}>Clear All</Btn>}
            </div>
          }>
          {loading.chats?<div style={{color:'#444',fontSize:12,textAlign:'center',padding:20}}>Loading…</div>
          :chats.length===0?<div style={{color:'#333',fontSize:11,textAlign:'center',padding:20,fontWeight:700}}>No chat messages</div>
          :(
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:400,overflowY:'auto'}}>
              {[...chats].reverse().map(msg=>(
                <div key={msg._id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',background:'rgba(255,215,0,0.03)',border:'1px solid rgba(255,215,0,0.08)',borderRadius:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <span style={{color:'#ffd700',fontSize:10,fontWeight:900}}>{msg.username||'Anonymous'}</span>
                      <span style={{color:'#333',fontSize:9}}>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{color:'#888',fontSize:12,margin:0,wordBreak:'break-word'}}>{msg.message||'[file]'}</p>
                  </div>
                  <button onClick={()=>deleteChat(msg._id)}
                    style={{width:24,height:24,borderRadius:7,background:'rgba(255,60,60,0.08)',border:'1px solid rgba(255,60,60,0.15)',color:'#ff5555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,flexShrink:0}}>
                    <Trash2 size={10}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ══ FILES ══ */}
        <Section title="All Files" icon={Users} color="#00ff8c" count={totalFiles}
          actions={<Btn onClick={loadFiles} outline color="#00ff8c" small icon={RefreshCw}>Refresh</Btn>}>
          {loading.files?<div style={{color:'#444',fontSize:12,textAlign:'center',padding:20}}>Loading…</div>
          :files.length===0?<div style={{color:'#333',fontSize:11,textAlign:'center',padding:20,fontWeight:700}}>No files</div>
          :(
            <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:500,overflowY:'auto'}}>
              {files.map(f=>(
                <div key={f._id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',background:'rgba(0,255,140,0.03)',border:'1px solid rgba(0,255,140,0.08)',borderRadius:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:'#ccc',fontSize:11,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.fileName||f.originalName}</div>
                    <div style={{display:'flex',gap:6,marginTop:3}}>
                      <Tag color="#00ff8c">{f.group}</Tag>
                      <Tag color="#ff6b00">{f.lab}</Tag>
                      {f.folderName&&<Tag color="#00c2ff">{f.folderName}</Tag>}
                      <span style={{color:'#333',fontSize:9}}>{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={()=>deleteFile(f)}
                    style={{width:26,height:26,borderRadius:7,background:'rgba(255,60,60,0.08)',border:'1px solid rgba(255,60,60,0.15)',color:'#ff5555',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,flexShrink:0}}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
};

/* ── Root ── */
export default function AdminPage({ navigate }) {
  const [auth,setAuth] = useState(false);
  if (!auth) return <LoginScreen onLogin={()=>setAuth(true)}/>;
  return <AdminDashboard onLogout={()=>setAuth(false)}/>;
}
