import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, CreditCard } from 'lucide-react';
import { CardModel } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<CardModel, 'id'>) => void;
  onDelete: (id: string) => void;
  cardToEdit: CardModel | null;
  darkMode?: boolean;
}

export const CardModal: React.FC<CardModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  cardToEdit,
  darkMode
}) => {
  const [alias, setAlias] = useState('');
  const [holder, setHolder] = useState('');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');
  const [theme, setTheme] = useState<CardModel['theme']>('black');
  const [network, setNetwork] = useState<CardModel['network']>('visa');

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        setAlias(cardToEdit.alias);
        setHolder(cardToEdit.holder);
        setLast4(cardToEdit.last4);
        setExpiry(cardToEdit.expiry);
        setTheme(cardToEdit.theme);
        setNetwork(cardToEdit.network);
      } else {
        setAlias('');
        setHolder('ADMINISTRADOR');
        setLast4('');
        setExpiry('');
        setTheme('black');
        setNetwork('visa');
      }
    }
  }, [isOpen, cardToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias || !last4 || !holder || !expiry) return;

    onSave({
      alias,
      holder,
      last4,
      expiry,
      theme,
      network
    });
  };

  const handleDelete = () => {
    if (cardToEdit && window.confirm('¿Eliminar esta tarjeta?')) {
        onDelete(cardToEdit.id);
    }
  };

  const themes: { id: CardModel['theme'], color: string, label: string }[] = [
      { id: 'black', color: 'bg-gray-900', label: 'Negro' },
      { id: 'purple', color: 'bg-purple-600', label: 'Púrpura' },
      { id: 'blue', color: 'bg-blue-600', label: 'Azul' },
      { id: 'rose', color: 'bg-rose-600', label: 'Rosa' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <CreditCard size={20} className="text-gray-400"/>
            {cardToEdit ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
          </h2>
          <button onClick={onClose} className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Card Network Selector */}
          <div className="grid grid-cols-3 gap-3">
              {(['visa', 'mastercard', 'amex'] as const).map(net => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`py-3 px-2 rounded-xl border-2 flex items-center justify-center transition-all ${network === net ? 'border-purple-500 bg-purple-50 text-purple-700' : (darkMode ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-100 text-gray-400 hover:border-gray-200')}`}
                  >
                      {net === 'visa' && <span className="font-bold italic">VISA</span>}
                      {net === 'mastercard' && (
                          <div className="flex -space-x-2">
                              <div className="w-5 h-5 rounded-full bg-red-500 opacity-80"></div>
                              <div className="w-5 h-5 rounded-full bg-amber-500 opacity-80"></div>
                          </div>
                      )}
                      {net === 'amex' && <span className="font-bold text-xs">AMEX</span>}
                  </button>
              ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Alias</label>
            <input
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              placeholder="Ej: Tarjeta Principal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Titular</label>
            <input
              type="text"
              required
              value={holder}
              onChange={(e) => setHolder(e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              placeholder="NOMBRE APELLIDO"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Últimos 4</label>
                <input
                  type="text"
                  maxLength={4}
                  pattern="\d*"
                  required
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g,''))}
                  className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center tracking-widest ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  placeholder="0000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expira</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  placeholder="MM/YY"
                />
              </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Color</label>
             <div className="flex gap-3">
                 {themes.map(t => (
                     <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-all ${theme === t.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                        title={t.label}
                     >
                         {theme === t.id && <Check size={16} className="text-white" />}
                     </button>
                 ))}
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            {cardToEdit && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <button
              type="submit"
              className={`flex-1 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-600 text-white' : 'bg-gray-900 text-white'}`}
            >
              <Check size={18} />
              {cardToEdit ? 'Guardar Cambios' : 'Añadir Tarjeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};