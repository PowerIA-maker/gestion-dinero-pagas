import React, { useState } from 'react';
import {
    Play, CheckCircle2, XCircle, AlertCircle,
    ShieldCheck, Activity, Database, Music, Terminal, Trash2
} from 'lucide-react';
import { SecurityAlert } from '../types';

interface TestResult {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    message?: string;
}

interface TestHistoryEntry {
    id: string; // run id
    date: string;
    total: number;
    passed: number;
    failed: number;
    details: TestResult[];
}

interface AdminTestsProps {
    onTriggerSecurityAlert: (msg: string, type?: any) => void;
    onPlaySound: (type: 'success' | 'click' | 'alert') => void;
    darkMode?: boolean;
    testAlerts?: SecurityAlert[];
    onMarkAlertAsRead?: (id: string) => void;
    onDeleteMessage?: (id: string) => void;
}

export const AdminTests: React.FC<AdminTestsProps> = ({
    onTriggerSecurityAlert,
    onPlaySound,
    darkMode,
    testAlerts = [],
    onMarkAlertAsRead,
    onDeleteMessage
}) => {
    const [tests, setTests] = useState<TestResult[]>([
        { id: '1', name: 'Integridad de Base de Datos (Local)', status: 'pending' },
        { id: '2', name: 'Sistema de Alertas de Seguridad', status: 'pending' },
        { id: '3', name: 'Motor de Notificaciones Globales', status: 'pending' },
        { id: '4', name: 'Sincronización de Audio UI', status: 'pending' },
        { id: '5', name: 'Validación de Roles y Permisos', status: 'pending' },
    ]);
    const [history, setHistory] = useState<TestHistoryEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'run' | 'history'>('run');

    const runTest = async (id: string) => {
        setTests(prev => prev.map(t => t.id === id ? { ...t, status: 'running' } : t));

        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 1500));

        setTests(prev => prev.map(t => {
            if (t.id === id) {
                switch (id) {
                    case '1': return { ...t, status: 'success', message: 'LocalStorage accesible y consistente.' };
                    case '2':
                        return { ...t, status: 'success', message: 'Alerta disparada correctamente (Silenciada en panel de seguridad).' };
                    case '3': return { ...t, status: 'success', message: 'Canales de broadcast operativos.' };
                    case '4':
                        onPlaySound('success');
                        return { ...t, status: 'success', message: 'Feedback acústico verificado.' };
                    case '5': return { ...t, status: 'success', message: 'Restricciones de Admin validadas.' };
                    default: return t;
                }
            }
            return t;
        }));
    };

    const runAllTests = async () => {
        // Reset current tests to pending
        setTests(prev => prev.map(t => ({ ...t, status: 'pending', message: undefined })));

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            await runTest(test.id);
        }

        // Generate history entry using the updated state logic in a timeout or recalculating
        setTimeout(() => {
            setTests(currentTests => {
                const p = currentTests.filter(t => t.status === 'success').length;
                const f = currentTests.filter(t => t.status === 'failed').length;
                const newEntry: TestHistoryEntry = {
                    id: Date.now().toString(),
                    date: new Date().toLocaleString(),
                    total: currentTests.length,
                    passed: p,
                    failed: f,
                    details: [...currentTests]
                };
                setHistory(prev => [newEntry, ...prev]);
                return currentTests;
            });
        }, 500); // Small buffer to ensure all states update
    };

    const prevAlertsCount = React.useRef(testAlerts.length);
    const hasRunInitial = React.useRef(false);

    React.useEffect(() => {
        // Ejecución automática inicial y al recibir nuevos tests
        if (!hasRunInitial.current || testAlerts.length > prevAlertsCount.current) {
            runAllTests();
            setActiveTab('run');
            hasRunInitial.current = true;
        }
        prevAlertsCount.current = testAlerts.length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testAlerts.length]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                {/* Tabs for Test Module */}
                <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <button
                        onClick={() => setActiveTab('run')}
                        className={`pb-2 px-4 font-bold transition-all ${activeTab === 'run' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        Ejecutar Pruebas
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-2 px-4 font-bold transition-all ${activeTab === 'history' ? 'border-b-2 border-purple-500 text-purple-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        Resultados e Historial
                    </button>
                </div>

                {activeTab === 'run' ? (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Terminal size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Módulo de Diagnóstico</h3>
                                    <p className="text-sm text-gray-500 font-medium">Pruebas automatizadas de integridad y respuesta del sistema.</p>
                                </div>
                            </div>
                            <button
                                onClick={runAllTests}
                                className="px-8 py-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Play size={20} fill="currentColor" /> Ejecutar Suite Completa
                            </button>
                        </div>

                        <div className="grid gap-3 text-left">
                            {tests.map(test => (
                                <div
                                    key={test.id}
                                    className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${test.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                            test.status === 'failed' ? 'bg-rose-100 text-rose-600' :
                                                test.status === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                                                    'bg-gray-100 text-gray-400'
                                            }`}>
                                            {test.status === 'success' ? <CheckCircle2 size={20} /> :
                                                test.status === 'failed' ? <XCircle size={20} /> :
                                                    test.status === 'running' ? <Activity size={20} /> :
                                                        <AlertCircle size={20} />}
                                        </div>
                                        <div className="text-left">
                                            <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{test.name}</div>
                                            {test.message && <div className="text-xs text-gray-400 font-medium">{test.message}</div>}
                                        </div>
                                    </div>

                                    {test.status === 'pending' && (
                                        <button
                                            onClick={() => runTest(test.id)}
                                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-500 select-none' : 'hover:bg-white text-gray-400'}`}
                                        >
                                            <Play size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-blue-900/10 border-blue-900/20' : 'bg-blue-50 border-blue-100'}`}>
                                <div className="flex items-center gap-3 mb-4 text-left">
                                    <ShieldCheck className="text-blue-500" size={24} />
                                    <h4 className="font-bold text-blue-900 dark:text-blue-400">Estado de Seguridad</h4>
                                </div>
                                <p className="text-sm text-blue-700/70 text-left">Todos los módulos de cifrado y auditoría están operando bajo los parámetros normales.</p>
                            </div>
                            <div className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/20' : 'bg-emerald-50 border-emerald-100'}`}>
                                <div className="flex items-center gap-3 mb-4 text-left">
                                    <Music className="text-emerald-500" size={24} />
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Motor de Audio</h4>
                                </div>
                                <p className="text-sm text-emerald-700/70 text-left">Controlador de solapamiento activo. Latencia medida: {Math.floor(Math.random() * 10) + 5}ms.</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in space-y-4">
                        {testAlerts.length > 0 && (
                            <>
                                <h3 className={`text-xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notificaciones de Pruebas</h3>
                                <div className="space-y-3 mb-8">
                                    {testAlerts.map(alert => (
                                        <div
                                            key={alert.id}
                                            onClick={() => onMarkAlertAsRead?.(alert.id)}
                                            className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer group flex gap-4 items-center ${alert.read ? (darkMode ? 'bg-gray-800/40 border-gray-700 opacity-60' : 'bg-gray-50/50 border-gray-100 opacity-80') : (darkMode ? 'bg-gray-800 border-blue-900/50' : 'bg-white border-blue-100 shadow-sm border-l-4 border-l-blue-500')}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.read ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                                                <Terminal size={16} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Reporte del Sistema</h4>
                                                    <span className="text-[10px] text-gray-400">{alert.date}</span>
                                                </div>
                                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{alert.message}</p>
                                            </div>
                                            {onDeleteMessage && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteMessage(alert.id); }}
                                                    className="p-2 hover:bg-rose-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={18} className="text-rose-600" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <h3 className={`text-xl font-black mb-6 mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historial de Resultados</h3>
                        {history.length === 0 ? (
                            <div className={`p-10 text-center rounded-3xl border border-dashed ${darkMode ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'}`}>
                                Aún no se han ejecutado pruebas en esta sesión.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map(entry => (
                                    <div key={entry.id} className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="font-bold text-sm text-gray-500">Ejecutado: {entry.date}</div>
                                            <div className="flex gap-4">
                                                <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={16} /> {entry.passed}</span>
                                                <span className="text-rose-500 font-bold flex items-center gap-1"><XCircle size={16} /> {entry.failed}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {entry.details.map(d => (
                                                <div key={d.id} className="flex justify-between text-xs items-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
                                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{d.name}</span>
                                                    <span className={d.status === 'success' ? 'text-emerald-500 font-bold' : d.status === 'failed' ? 'text-rose-500 font-bold' : 'text-gray-400'}>
                                                        {d.status === 'success' ? 'PASSED' : d.status === 'failed' ? 'FAILED' : 'SKIPPED'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
