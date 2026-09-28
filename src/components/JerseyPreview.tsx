interface JerseyPreviewProps {
  jerseyName: string;
  jerseyNumber: string;
  jerseySize?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'navy' | 'dark' | 'emerald';
}

export function JerseyPreview({
  jerseyName,
  jerseyNumber,
  jerseySize,
  size = 'md',
  variant = 'blue',
}: JerseyPreviewProps) {
  const displayName = (jerseyName || 'PLAYER').toUpperCase();
  const displayNumber = jerseyNumber || '00';

  const colorThemes = {
    blue: {
      body: 'from-blue-600 via-blue-700 to-indigo-900',
      collar: 'bg-amber-400',
      trim: 'border-amber-400/60',
      stripes: 'bg-white/10',
      numColor: 'text-amber-400',
      nameColor: 'text-white',
    },
    navy: {
      body: 'from-slate-800 via-blue-950 to-slate-900',
      collar: 'bg-cyan-400',
      trim: 'border-cyan-400/50',
      stripes: 'bg-cyan-400/10',
      numColor: 'text-cyan-300',
      nameColor: 'text-white',
    },
    emerald: {
      body: 'from-emerald-700 via-emerald-800 to-teal-950',
      collar: 'bg-amber-400',
      trim: 'border-amber-400/60',
      stripes: 'bg-white/10',
      numColor: 'text-amber-400',
      nameColor: 'text-white',
    },
    dark: {
      body: 'from-zinc-800 via-zinc-900 to-black',
      collar: 'bg-rose-500',
      trim: 'border-rose-500/50',
      stripes: 'bg-white/5',
      numColor: 'text-rose-400',
      nameColor: 'text-zinc-100',
    },
  };

  const theme = colorThemes[variant] || colorThemes.blue;

  if (size === 'sm') {
    return (
      <div className="relative w-12 h-14 rounded-md overflow-hidden bg-gradient-to-b from-blue-600 to-indigo-950 border border-white/10 shadow-sm flex flex-col items-center justify-center p-1 select-none">
        <div className="text-[8px] font-bold text-white/90 truncate max-w-[42px] tracking-tight">
          {displayName}
        </div>
        <div className="font-jersey font-extrabold text-sm leading-none text-amber-400">
          {displayNumber}
        </div>
        {jerseySize && (
          <div className="absolute bottom-0.5 right-0.5 text-[7px] text-white/60 font-mono-num font-semibold">
            {jerseySize}
          </div>
        )}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className="relative w-28 h-36 rounded-xl overflow-hidden bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-950 border border-blue-400/20 shadow-md flex flex-col items-center justify-between p-3 select-none">
        {/* Collar & shoulder cuts */}
        <div className="w-12 h-3 bg-amber-400/80 rounded-b-md mx-auto mb-1 border-b border-amber-300 shadow-inner" />
        
        {/* Back Name */}
        <div className="text-center w-full px-1">
          <span className="text-[11px] font-extrabold tracking-wider text-white uppercase drop-shadow block truncate">
            {displayName}
          </span>
        </div>

        {/* Big Number */}
        <div className="font-jersey font-black text-4xl text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none my-auto">
          {displayNumber}
        </div>

        {/* Bottom Size Tag */}
        <div className="w-full flex items-center justify-between text-[9px] text-white/60 border-t border-white/10 pt-1 font-mono-num">
          <span>CRICKET</span>
          {jerseySize && <span className="font-bold text-amber-300/90">{jerseySize}</span>}
        </div>
      </div>
    );
  }

  // Large preview for Details modal
  return (
    <div className="relative w-52 h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-600 via-blue-800 to-slate-950 border border-blue-400/30 shadow-2xl flex flex-col items-center justify-between p-5 select-none">
      {/* Decorative jersey pattern accents */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
      
      {/* V-neck collar */}
      <div className="relative z-10 w-20 h-5 bg-amber-400 rounded-b-xl border-b-2 border-amber-300 shadow-md flex items-center justify-center">
        <div className="w-6 h-1 bg-amber-600/40 rounded-full" />
      </div>

      {/* Player name on back */}
      <div className="relative z-10 text-center w-full px-2 mt-2">
        <span className="font-jersey text-base font-black tracking-widest text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block truncate">
          {displayName}
        </span>
        <div className="w-16 h-0.5 bg-amber-400/60 mx-auto mt-1 rounded-full" />
      </div>

      {/* Giant Jersey Number */}
      <div className="relative z-10 font-jersey font-extrabold text-7xl text-amber-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-none my-auto">
        {displayNumber}
      </div>

      {/* Official Team badge label and size */}
      <div className="relative z-10 w-full flex items-center justify-between text-xs text-white/70 border-t border-white/10 pt-2 font-mono-num">
        <span className="tracking-wider text-[10px] text-slate-300 uppercase">OFFICIAL KIT</span>
        {jerseySize && (
          <span className="font-bold text-amber-400 px-2 py-0.5 bg-black/40 rounded border border-amber-400/30 text-xs">
            SIZE: {jerseySize}
          </span>
        )}
      </div>
    </div>
  );
}
