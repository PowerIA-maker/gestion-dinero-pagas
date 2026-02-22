import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { BANKS, CATEGORIES, Transaction, TransactionType } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onDelete?: (id: string) => void;
  transactionToEdit?: Transaction | null;
  defaultType?: TransactionType;
  darkMode?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  transactionToEdit,
  defaultType = 'expense',
  darkMode
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [bankAccount, setBankAccount] = useState(BANKS[0].id);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setType(transactionToEdit.type);
        setAmount(transactionToEdit.amount.toString());
        setDescription(transactionToEdit.description);
        const dateStr = transactionToEdit.date.includes('T') 
            ? transactionToEdit.date.split('T')[0] 
            : transactionToEdit.date;
        setDate(dateStr);
        setCategory(transactionToEdit.category);
        setBankAccount(transactionToEdit.bankAccount);
      } else {
        setType(defaultType);
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategory(CATEGORIES[0]);
        setBankAccount(BANKS[0].id);
      }
    }
  }, [isOpen, transactionToEdit, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    const selectedDate = new Date(date);
    selectedDate.setHours(12, 0, 0, 0);

    onSave({
      type,
      amount: parseFloat(amount),
      description,
      category,
      bankAccount,
      date: selectedDate.toISOString()
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (transactionToEdit && onDelete) {
        // We just trigger onDelete. The parent App handles confirmation and closing.
        onDelete(transactionToEdit.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className={`rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] md:max-h-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b sticky top-0 z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {transactionToEdit ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </h2>
          <button onClick={onClose} className={`p-2 -mr-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Type Selector - iOS Segmented Control Style */}
          <div className={`grid grid-cols-2 p-1.5 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                type === 'expense' 
                  ? (darkMode ? 'bg-gray-600 text-rose-400 shadow-md' : 'bg-white text-rose-500 shadow-md transform scale-[1.02]')
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                type === 'income' 
                  ? (darkMode ? 'bg-gray-600 text-emerald-400 shadow-md' : 'bg-white text-emerald-500 shadow-md transform scale-[1.02]')
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-4 py-4 rounded-2xl border border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-base ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 focus:bg-white'}`}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Importe (€)</label>
                <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full pl-8 pr-4 py-4 rounded-2xl border border-transparent focus:ring-4 outline-none transition-all text-2xl font-bold ${
                          type === 'expense' 
                            ? (darkMode ? 'text-rose-400 bg-gray-700 focus:border-rose-400' : 'text-rose-500 bg-gray-50 focus:bg-white focus:border-rose-500') 
                            : (darkMode ? 'text-emerald-400 bg-gray-700 focus:border-emerald-400' : 'text-emerald-500 bg-gray-50 focus:bg-white focus:border-emerald-500')
                        }`}
                      placeholder="0.00"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">€</span>
                </div>
              </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Concepto</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-4 rounded-2xl border border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-base ${darkMode ? 'bg-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 text-gray-900 focus:bg-white placeholder:text-gray-400'}`}
              placeholder="Ej: Compra supermercado"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categoría</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-4 py-4 rounded-2xl border border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-base appearance-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 focus:bg-white'}`}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cuenta</label>
              <div className="relative">
                <select
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className={`w-full px-4 py-4 rounded-2xl border border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-base appearance-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900 focus:bg-white'}`}
                >
                  {BANKS.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3 pb-safe">
            {transactionToEdit && onDelete && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="p-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-all flex items-center justify-center"
                >
                    <Trash2 size={24} />
                </button>
            )}
            <button
              type="submit"
              className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-600 text-white' : 'bg-gray-900 text-white'}`}
            >
              <Check size={24} />
              {transactionToEdit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};