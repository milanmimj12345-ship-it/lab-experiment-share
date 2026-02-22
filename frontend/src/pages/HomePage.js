import React from 'react';
import { Share2, MessageSquare, Send, TrendingUp, Shield, ChevronRight, Gamepad2 } from 'lucide-react';

const NavCard = ({ title, description, icon: Icon, onClick, className = '', accentColor = '#ff6b00', badge }) => (
  <div onClick={onClick} className={`group relative cursor-pointer overflow-hidden p-8 rounded-[2rem] bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] shadow-2xl flex flex-col justify-between ${className}`}>
    {badge && (
      <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,50,50,0.2)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: '999px', padding: '3px 10px', fontSize: '9px', fontWeight: 900, color: '#ff5555', textTransform: 'uppercase', letterSpacing: '2px' }}>
        {badge}
      </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
        <Icon className="w-8 h-8" />
      </div>
      <ChevronRight className="w-6 h-6 text-zinc-700 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all" />
    </div>
    <div>
      <h3 className="text-2xl font-extrabold mb-2 leading-tight tracking-tight uppercase">{title}</h3>
      <p className="text-zinc-500 text-sm font-medium">{description}</p>
    </div>
    <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity" style={{ backgroundColor: accentColor }} />
  </div>
);

const HomePage = ({ navigate }) => (
  <div className="min-h-screen flex flex-col justify-center px-6 max-w-7xl mx-auto pt-24 pb-12">
    <div className="mb-12 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-[#ff6b00] mb-6 tracking-wider uppercase">
        ◉ Secure Experiment Sharing Platform
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase">
        Dashboard <span className="text-zinc-800">.</span>
      </h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      {/* Row 1 */}
      <NavCard
        title="Public Share"
        description="Browse, upload and manage lab experiments. Sorted by groups and lab rotations."
        icon={Share2}
        onClick={() => navigate('group_select')}
        className="md:col-span-2 md:row-span-2 min-h-[280px]"
      />

      <NavCard
        title="Lab Chat"
        description="Real-time discussion room. Join with your name or chat anonymously."
        icon={MessageSquare}
        onClick={() => navigate('chat_login')}
        className="md:col-span-2"
        accentColor="#00c2ff"
      />

      <div className="p-8 rounded-[2rem] bg-zinc-900/30 border border-white/5 flex flex-col justify-between md:col-span-2">
        <div className="flex justify-between items-center">
          <TrendingUp className="text-[#ff6b00] w-10 h-10" />
          <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Capacity</span>
        </div>
        <div>
          <div className="text-5xl font-black mb-1">40<span className="text-zinc-600">MB</span></div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight">Max cloud file size per upload</p>
        </div>
      </div>

      {/* Row 2 */}
      <NavCard
        title="Direct Send"
        description="Send multiple lab files via secure email instantly."
        icon={Send}
        onClick={() => navigate('direct_share')}
        className="md:col-span-2"
        accentColor="#00ff8c"
      />

      <NavCard
        title="Play Game"
        description="Take a break! Play Shadow Survival — dodge enemies and survive the dark."
        icon={Gamepad2}
        onClick={() => navigate('game')}
        className="md:col-span-2"
        accentColor="#ff3333"
        badge="NEW"
      />
    </div>

    {/* Bottom row */}
    <div className="mt-6 animate-fade-in">
      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="text-zinc-500 w-8 h-8" />
          <div>
            <h4 className="text-lg font-bold">Encrypted Storage</h4>
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest mt-0.5">Cloudinary CDN</p>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-30" />
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;
