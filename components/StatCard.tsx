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
  let valueColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  if (type === 'positive') valueColor = darkMode ? 'text-emerald-400' : 'text-emerald-500';
  if (type === 'negative') valueColor = darkMode ? 'text-rose-400' : 'text-rose-500';
  if (type === 'warning') valueColor = darkMode ? 'text-amber-400' : 'text-amber-500';

  return (
    <div className={`p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-md transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>
          <p className="text-xs text-gray-400">{subtitle || '1 may 2024 - 31 may 2024'}</p>
        </div>
        {icon && <div className="text-gray-300 group-hover:text-purple-500 transition-colors">{icon}</div>}
      </div>
      <div className={`text-3xl font-bold tracking-tight mt-2 ${valueColor}`}>
        {value}
      </div>
    </div>
  );
};