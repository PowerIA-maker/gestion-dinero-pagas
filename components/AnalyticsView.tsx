import React from 'react';
import {
    BarChart3, PieChart, TrendingUp, TrendingDown,
    Calendar, ArrowUpRight, ArrowDownRight, Target,
    Layers, CreditCard
} from 'lucide-react';
import { Transaction, FinancialState, CATEGORIES } from '../types';
import { formatCurrency } from '../utils';

interface AnalyticsViewProps {
    transactions: Transaction[];
    financialState: FinancialState;
    darkMode?: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
    transactions,
    financialState,
    darkMode
}) => {
    // Basic stats
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Group by category
    const categoryTotals = CATEGORIES.map(cat => ({
        name: cat,
        total: transactions
            .filter(t => t.category === cat)
            .reduce((acc, curr) => acc + curr.amount, 0),
        count: transactions.filter(t => t.category === cat).length
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    // Recent trends (last 7 days simulation for UI)
    const recentExpenses = expenseTransactions.slice(0, 5);

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-24">
            <div>
                <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Análisis Detallado</h2>
                <div className="flex justify-between items-center">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Visualización completa de tu salud financiera y el método 50/50.</p>
                    <button
                        onClick={() => window.print()}
                        className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
                    >
                        Imprimir Informe
                    </button>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ahorro Acumulado"
                    value={formatCurrency(financialState.savingsBag)}
                    icon={<Target className="text-emerald-500" />}
                    trend="+12.5%"
                    isUp={true}
                    darkMode={darkMode}
                />
                <StatCard
                    title="Gastos Totales"
                    value={formatCurrency(financialState.totalExpenses)}
                    icon={<TrendingDown className="text-rose-500" />}
                    trend="+4.2%"
                    isUp={false}
                    darkMode={darkMode}
                />
                <StatCard
                    title="Ingresos Totales"
                    value={formatCurrency(financialState.totalIncome)}
                    icon={<TrendingUp className="text-blue-500" />}
                    trend="+8.1%"
                    isUp={true}
                    darkMode={darkMode}
                />
                <StatCard
                    title="Eficiencia 50/50"
                    value={`${financialState.isSavingsInvaded ? 'ALERTA' : 'ÓPTIMA'}`}
                    icon={<Layers className={financialState.isSavingsInvaded ? 'text-rose-500' : 'text-purple-500'} />}
                    status={financialState.isSavingsInvaded ? 'error' : 'success'}
                    darkMode={darkMode}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Category Breakdown */}
                <div className={`lg:col-span-2 rounded-[2.5rem] p-8 border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <PieChart size={20} className="text-purple-500" />
                            Distribución por Categoría
                        </h3>
                        <button className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                            Ver todos
                        </button>
                    </div>

                    <div className="space-y-6">
                        {categoryTotals.map((cat, idx) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][idx % 5]}`}></div>
                                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{cat.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(cat.total)}</div>
                                        <div className="text-[10px] text-gray-400">{cat.count} transacciones</div>
                                    </div>
                                </div>
                                <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <div
                                        className={`h-full rounded-full ${['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][idx % 5]}`}
                                        style={{ width: `${Math.min(100, (cat.total / financialState.totalIncome) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Insights & Trends */}
                <div className="space-y-6">
                    <div className={`rounded-[2.5rem] p-8 border ${darkMode ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-none' : 'bg-gradient-to-br from-gray-900 to-gray-800 border-none'} text-white`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <BarChart3 size={20} />
                            </div>
                            <h3 className="font-bold">Proyección de Ahorro</h3>
                        </div>
                        <p className="text-white/70 text-sm mb-6 leading-relaxed">
                            A este ritmo, tu bolsa de ahorro alcanzará los <span className="text-white font-bold">{formatCurrency(financialState.savingsBag * 12)}</span> al finalizar el año.
                        </p>
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center text-gray-900">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-white/50 uppercase font-black">Tu salud financiera</div>
                                <div className="text-sm font-bold">Excelente (+15% vs mes anterior)</div>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-[2.5rem] p-8 border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Calendar size={20} className="text-blue-500" />
                            Movimientos Recientes
                        </h3>
                        <div className="space-y-4">
                            {recentExpenses.map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <CreditCard size={18} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.description}</div>
                                            <div className="text-[10px] text-gray-400">{t.date}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-rose-500">-{formatCurrency(t.amount)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    isUp?: boolean;
    status?: 'success' | 'error';
    darkMode?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isUp, status, darkMode }) => (
    <div className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-100 shadow-sm text-gray-900'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            )}
            {status && (
                <div className={`w-3 h-3 rounded-full ${status === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
            )}
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
        <div className="text-2xl font-black">{value}</div>
    </div>
);
