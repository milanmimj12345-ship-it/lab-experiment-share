import React, { useState } from 'react';
import { Folder, ArrowLeft } from 'lucide-react';

const GroupSelectPage = ({ navigate }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pt-24 animate-fade-in">
      <div className="w-full max-w-4xl mb-6">
        <button onClick={() => navigate('home')} className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all group">
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/5"><ArrowLeft className="w-4 h-4" /></div>
          Back to Dashboard
        </button>
      </div>

      <h2 className="text-4xl font-black mb-12 uppercase tracking-tighter">
        Select Your <span className="text-[#ff6b00]">Group</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {['A', 'B'].map(grp => (
          <div key={grp} onClick={() => setSelectedGroup(grp)}
            className={`cursor-pointer group p-12 rounded-[2.5rem] border transition-all flex flex-col items-center gap-6 ${selectedGroup === grp ? 'bg-[#ff6b00]/10 border-[#ff6b00] shadow-[0_0_30px_rgba(255,107,0,0.2)]' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black transition-transform group-hover:scale-110 ${selectedGroup === grp ? 'bg-[#ff6b00] text-black' : 'bg-white/5 text-white'}`}>
              {grp}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black mb-1 uppercase">Group {grp}</h3>
              <p className="text-zinc-500 text-sm">Access Lab Rotations for Group {grp}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="mt-16 w-full max-w-4xl animate-fade-in">
          <h2 className="text-4xl font-black mb-8 text-center uppercase tracking-tighter">
            Select <span className="text-[#ff6b00]">Lab</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { id: 'DBMS', label: 'DBMS Lab', desc: 'Database Management Systems' },
              { id: 'OS', label: 'Operating System Lab', desc: 'Operating Systems' }
            ].map(lb => (
              <div key={lb.id} onClick={() => navigate('repository', { group: selectedGroup, lab: lb.id })}
                className="cursor-pointer group p-10 rounded-[2rem] bg-zinc-900/50 border border-white/5 hover:border-[#ff6b00] hover:bg-[#ff6b00]/5 transition-all flex items-center gap-6">
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#ff6b00] group-hover:bg-[#ff6b00]/10 transition-colors">
                  <Folder className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase">{lb.label}</h3>
                  <p className="text-zinc-500 text-sm">{lb.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSelectPage;
