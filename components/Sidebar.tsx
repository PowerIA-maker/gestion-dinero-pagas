import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  Mail,
  User,
  Home
} from 'lucide-react';
import { UserRole } from '../types';

export type ViewType = 'dashboard' | 'wallet' | 'analytics' | 'cards' | 'messages' | 'admin';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onNotifications?: () => void;
  darkMode?: boolean;
  userRole?: UserRole;
  userAvatar?: string;
  userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  onSettings,
  onNotifications,
  darkMode,
  userRole,
  userAvatar,
  userName
}) => {
  return (
    <div className={`fixed left-0 top-0 h-full w-24 border-r flex flex-col items-center py-8 z-50 hidden md:flex transition-colors cyber-container ${darkMode ? 'border-primary/50 bg-black/80' : 'border-primary/30 bg-slate-900/90'}`}>
      <button
        onClick={() => onNavigate('dashboard')}
        className="mb-10 cursor-pointer hover:scale-105 transition-transform active:scale-95 group relative"
      >
        <div className="w-12 h-12 rounded-sm border-2 border-primary bg-black flex items-center justify-center shadow-[0_0_10px_rgba(0,255,65,0.3)] group-hover:shadow-[0_0_15px_rgba(0,255,65,0.6)] transition-all-smooth relative overflow-hidden glitch-block">
          <Home className="text-primary w-6 h-6 relative z-10" strokeWidth={2} />
        </div>
      </button>

      <nav className="flex-1 flex flex-col gap-6 w-full items-center">
        <NavItem
          icon={<LayoutDashboard size={24} strokeWidth={2} />}
          active={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
          title="Panel Principal"
          darkMode={darkMode}
        />
        <NavItem
          icon={<Wallet size={24} strokeWidth={2} />}
          active={currentView === 'wallet'}
          onClick={() => onNavigate('wallet')}
          title="Cuentas / Billetera"
          darkMode={darkMode}
        />
        <NavItem
          icon={<PieChart size={24} strokeWidth={2} />}
          active={currentView === 'analytics'}
          onClick={() => onNavigate('analytics')}
          title="Análisis"
          darkMode={darkMode}
        />
        <NavItem
          icon={<CreditCard size={24} strokeWidth={2} />}
          active={currentView === 'cards'}
          onClick={() => onNavigate('cards')}
          title="Tarjetas"
          darkMode={darkMode}
        />

        {(userRole === 'admin' || userRole === 'manager') && (
          <NavItem
            icon={<Shield size={24} strokeWidth={2} />}
            active={currentView === 'admin'}
            onClick={() => (onNavigate as any)('admin')}
            title="Panel Admin"
            darkMode={darkMode}
          />
        )}

        <div className={`w-12 h-px my-2 ${darkMode ? 'bg-primary/30' : 'bg-primary/20'}`}></div>

        <button
          onClick={() => (onNavigate as any)('messages')}
          className={`p-3 rounded-md transition-all-smooth duration-300 relative group border border-transparent ${currentView === 'messages' ? (darkMode ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'bg-primary/10 text-primary border-primary/50') : (darkMode ? 'text-slate-500 hover:bg-primary/10 hover:text-primary hover:border-primary/30' : 'text-slate-400 hover:bg-primary/5 hover:text-primary')}`}
          title="Mensajería"
        >
          <Mail size={24} strokeWidth={2} />
        </button>

        {userRole !== 'admin' && (
          <button
            onClick={onSettings}
            className={`p-3 rounded-md transition-all-smooth duration-300 relative group border border-transparent ${darkMode ? 'text-slate-500 hover:bg-primary/10 hover:text-primary hover:border-primary/30' : 'text-slate-400 hover:bg-primary/5 hover:text-primary'}`}
            title="Ajustes"
          >
            <Settings size={24} strokeWidth={2} />
          </button>
        )}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-6">
        {userRole !== 'admin' ? (
          <button
            onClick={onSettings}
            className={`p-1 rounded-sm transition-all-smooth duration-300 border-2 hover:scale-105 ${darkMode ? 'border-primary/30 hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.3)]' : 'border-primary/20 hover:border-primary/80 hover:shadow-[0_0_8px_rgba(0,255,65,0.2)]'}`}
            title="Ajustes de Perfil"
          >
            <div className="w-10 h-10 bg-black overflow-hidden flex items-center justify-center glitch-block">
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover relative z-10 opacity-80" />
              ) : (
                <User className="text-primary relative z-10" size={20} />
              )}
            </div>
          </button>
        ) : (
          <div className={`p-1 rounded-sm border-2 ${darkMode ? 'border-primary' : 'border-primary/80'} shadow-[0_0_8px_rgba(0,255,65,0.4)]`} title="Perfil de Admin">
            <div className="w-10 h-10 bg-black overflow-hidden flex items-center justify-center glitch-block">
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover relative z-10 opacity-80 filter sepia hue-rotate-[90deg] saturate-[300%]" />
              ) : (
                <User className="text-primary relative z-10" size={20} />
              )}
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className={`p-3 rounded-md transition-all-smooth border border-transparent hover:border-destructive/50 ${darkMode ? 'text-slate-600 hover:text-destructive hover:bg-destructive/10' : 'text-slate-500 hover:text-destructive hover:bg-destructive/5'}`}
          title="Cerrar Sesión"
        >
          <LogOut size={24} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

const NavItem: React.FC<{
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title: string;
  darkMode?: boolean;
}> = ({ icon, active, onClick, title, darkMode }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-3.5 rounded-md transition-all-smooth duration-300 relative group flex items-center justify-center border hover:scale-105 active:scale-95 ${active
      ? (darkMode ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'bg-primary/10 text-primary border-primary/50 shadow-[0_0_8px_rgba(0,255,65,0.2)]')
      : (darkMode ? 'text-slate-500 border-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/30' : 'text-slate-400 border-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/20')
      }`}
  >
    {icon}
    {/* Tooltip on hover */}
    <div className={`absolute left-full ml-4 px-3 py-1.5 rounded-sm border border-primary text-xs font-mono font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all-smooth translate-x-2 group-hover:translate-x-0 ${darkMode ? 'bg-black text-primary shadow-[0_0_10px_rgba(0,255,65,0.3)]' : 'bg-slate-900 text-primary shadow-[0_0_8px_rgba(0,255,65,0.2)] max-md:hidden'}`}>
      &gt; {title}
    </div>
  </button>
);