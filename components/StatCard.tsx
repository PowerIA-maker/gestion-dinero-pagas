import React from 'react';

interface StatCardProps {
  title: string;
  value: string; // Formatted currency string
  subtitle?: string;
  type?: 'neutral' | 'positive' | 'negative' | 'warning';
  icon?: React.ReactNode;
  darkMode?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, type = 'neutral', icon, darkMode }) => {
  let valueColor = darkMode ? 'text-slate-100' : 'text-slate-900';
  let iconBg = darkMode ? 'bg-slate-700/50' : 'bg-slate-100';
  let iconColor = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (type === 'positive') {
    valueColor = darkMode ? 'text-emerald-400' : 'text-emerald-600';
    iconColor = darkMode ? 'text-emerald-400' : 'text-emerald-600';
    iconBg = darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100';
  }
  if (type === 'negative') {
    valueColor = darkMode ? 'text-rose-400' : 'text-rose-600';
    iconColor = darkMode ? 'text-rose-400' : 'text-rose-600';
    iconBg = darkMode ? 'bg-rose-500/10' : 'bg-rose-100';
  }
  if (type === 'warning') {
    valueColor = darkMode ? 'text-amber-400' : 'text-amber-600';
    iconColor = darkMode ? 'text-amber-400' : 'text-amber-600';
    iconBg = darkMode ? 'bg-amber-500/10' : 'bg-amber-100';
  }

  return (
    <div className={`p-6 rounded-md flex flex-col justify-between h-full relative overflow-hidden group transition-all-smooth hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] cyber-container ${darkMode ? 'border-primary/50 hover:bg-black/90' : 'border-primary/30 hover:bg-slate-900/90'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-sm font-mono font-bold tracking-wide uppercase mb-1 ${darkMode ? 'text-primary/70' : 'text-primary/60'}`}>&gt; {title}</h3>
          <p className={`text-xs font-mono font-medium ${darkMode ? 'text-primary/50' : 'text-primary/40'}`}>_{subtitle || 'Sys.Data'}</p>
        </div>
        {icon && (
          <div className={`p-3 rounded-sm transition-transform group-hover:scale-110 border border-primary/20 ${iconBg} ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`text-3xl font-mono font-black tracking-tight mt-2 ${type === 'neutral' ? 'neon-text' : ''} ${valueColor}`}>
        {value}
      </div>
    </div>
  );
};