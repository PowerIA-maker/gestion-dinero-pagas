import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  CreditCard,
  Settings,
  LogOut,
  TrendingUp,
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
    <div className={`fixed left-0 top-0 h-full w-20 border-r flex flex-col items-center py-6 z-50 hidden md:flex transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <button
        onClick={() => onNavigate('dashboard')}
        className="mb-8 cursor-pointer hover:scale-110 transition-transform active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Home className="text-white w-6 h-6" />
        </div>
      </button>

      <nav className="flex-1 flex flex-col gap-6 w-full items-center">
        <NavItem
          icon={<LayoutDashboard size={24} />}
          active={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
          title="Panel Principal"
          darkMode={darkMode}
        />
        <NavItem
          icon={<Wallet size={24} />}
          active={currentView === 'wallet'}
          onClick={() => onNavigate('wallet')}
          title="Cuentas / Billetera"
          darkMode={darkMode}
        />
        <NavItem
          icon={<PieChart size={24} />}
          active={currentView === 'analytics'}
          onClick={() => onNavigate('analytics')}
          title="Análisis"
          darkMode={darkMode}
        />
        <NavItem
          icon={<CreditCard size={24} />}
          active={currentView === 'cards'}
          onClick={() => onNavigate('cards')}
          title="Tarjetas"
          darkMode={darkMode}
        />

        {(userRole === 'admin' || userRole === 'manager') && (
          <NavItem
            icon={<Shield size={24} />}
            active={currentView === 'admin'}
            onClick={() => (onNavigate as any)('admin')}
            title="Panel Admin"
            darkMode={darkMode}
          />
        )}

        <div className={`border-t w-10 my-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>

        <button
          onClick={() => (onNavigate as any)('messages')}
          className={`p-3 rounded-xl transition-all duration-200 ${currentView === 'messages' ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700') : (darkMode ? 'text-gray-500 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600')}`}
          title="Mensajería"
        >
          <Mail size={24} />
        </button>

        {userRole !== 'admin' && (
          <button
            onClick={onSettings}
            className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'text-gray-500 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Ajustes"
          >
            <Settings size={24} />
          </button>
        )}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4">
        {userRole !== 'admin' ? (
          <button
            onClick={onSettings}
            className={`p-1 rounded-full transition-all duration-200 border-2 ${darkMode ? 'border-gray-700 hover:border-purple-500' : 'border-gray-100 hover:border-purple-400'}`}
            title="Ajustes de Perfil"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={18} />
              )}
            </div>
          </button>
        ) : (
          <div className={`p-1 rounded-full border-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} title="Perfil de Admin">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={18} />
              )}
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className={`p-3 transition-colors ${darkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
          title="Cerrar Sesión"
        >
          <LogOut size={24} />
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
    className={`p-3 rounded-xl transition-all duration-200 ${active
      ? (darkMode ? 'bg-gray-700 text-purple-400 shadow-sm' : 'bg-gray-100 text-purple-600 shadow-sm')
      : (darkMode ? 'text-gray-500 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600')
      }`}
  >
    {icon}
  </button>
);