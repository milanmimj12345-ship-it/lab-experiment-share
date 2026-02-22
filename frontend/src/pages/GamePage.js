import React from 'react';
import { ArrowLeft, Maximize2 } from 'lucide-react';

const GamePage = ({ navigate }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: '64px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={() => navigate('home')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all group"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '10px', padding: '6px 14px' }}>
            <span style={{ color: '#ff3333', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>🎮 Shadow Survival</span>
          </div>
          <button onClick={() => {
            const el = document.getElementById('game-frame');
            if (el.requestFullscreen) el.requestFullscreen();
          }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#999', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}>
            <Maximize2 size={14} /> Fullscreen
          </button>
        </div>
      </div>

      {/* Game */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
        <iframe
          id="game-frame"
          src="/shadow_survival.html"
          title="Shadow Survival"
          style={{
            width: '100%',
            maxWidth: '920px',
            height: '620px',
            border: 'none',
            borderRadius: '24px',
            boxShadow: '0 0 60px rgba(255,0,0,0.2), 0 0 120px rgba(0,0,0,0.8)',
            background: '#000'
          }}
        />
        <p style={{ color: '#333', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px' }}>
          Use Arrow Keys / WASD to move • Survive the shadows
        </p>
      </div>
    </div>
  );
};

export default GamePage;
