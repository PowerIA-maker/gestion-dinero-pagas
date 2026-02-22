import React from 'react';
import { X, Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  darkMode?: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end animate-in fade-in duration-200">
      <div className={`w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Bell size={20} className="text-purple-500" />
              Notificaciones
            </h2>
            <button onClick={onClose} className={`p-2 -mr-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Bell size={40} className="mb-2 opacity-20"/>
                    <p>No tienes notificaciones</p>
                </div>
            ) : (
                notifications.map((notif) => (
                <div key={notif.id} className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md'}`}>
                    <div className="flex gap-3">
                    <div className={`mt-1 shrink-0 ${
                        notif.type === 'warning' ? 'text-amber-500' : 
                        notif.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
                    }`}>
                        {notif.type === 'warning' && <AlertTriangle size={20} />}
                        {notif.type === 'success' && <CheckCircle size={20} />}
                        {notif.type === 'info' && <Info size={20} />}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{notif.title}</h4>
                        <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.msg}</p>
                        <span className="text-[10px] text-gray-400 font-semibold mt-2 block uppercase tracking-wide">{notif.time}</span>
                    </div>
                    </div>
                </div>
                ))
            )}
          </div>

          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
             <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold transition-colors text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Cerrar
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};