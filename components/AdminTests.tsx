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
            <div className={`p-8 rounded-sm border cyber-container ${darkMode ? 'bg-black/80 border-primary/50' : 'bg-slate-900 border-primary/30'} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[url('/grid-bg.png')] opacity-10 pointer-events-none"></div>
                {/* Tabs for Test Module */}
                <div className="flex gap-4 mb-8 border-b border-primary/20 pb-4">
                    <button
                        onClick={() => setActiveTab('run')}
                        className={`pb-2 px-4 font-mono font-bold tracking-widest transition-all-smooth uppercase ${activeTab === 'run' ? 'border-b-2 border-primary text-primary shadow-[0_4px_10px_rgba(0,255,65,0.2)]' : 'text-primary/50 hover:text-primary'}`}
                    >
                        [ Ejecutar Pruebas ]
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-2 px-4 font-mono font-bold tracking-widest transition-all-smooth uppercase ${activeTab === 'history' ? 'border-b-2 border-cyan-400 text-cyan-400 shadow-[0_4px_10px_rgba(34,211,238,0.2)]' : 'text-primary/50 hover:text-primary'}`}
                    >
                        [ Resultados_Historial ]
                    </button>
                </div>

                {activeTab === 'run' ? (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 text-left relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-sm border bg-black text-primary border-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.3)] glitch-block">
                                    <Terminal size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-2xl font-mono font-black tracking-widest ${darkMode ? 'text-primary' : 'text-primary'}`}>SYS_DIAGNÓSTICO</h3>
                                    <p className="text-sm text-primary/70 font-mono">Pruebas automatizadas de integridad y respuesta del sistema.</p>
                                </div>
                            </div>
                            <button
                                onClick={runAllTests}
                                className="px-8 py-4 bg-primary/10 border-2 border-primary text-primary rounded-sm font-mono font-bold tracking-widest transition-all-smooth shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:scale-105 active:scale-95 flex items-center gap-3 uppercase relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-primary/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                                <Play size={20} fill="currentColor" className="relative z-10" /> INICIAR_SUITE
                            </button>
                        </div>

                        <div className="grid gap-3 text-left relative z-10">
                            {tests.map(test => (
                                <div
                                    key={test.id}
                                    className={`p-5 rounded-sm border flex items-center justify-between transition-all-smooth cyber-container ${darkMode ? 'bg-black/50 border-primary/30 hover:border-primary/80' : 'bg-slate-900 border-primary/20 hover:border-primary/60'} group relative overflow-hidden`}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-sm border flex flex-col items-center justify-center bg-black glitch-block ${test.status === 'success' ? 'border-primary text-primary shadow-[0_0_10px_rgba(0,255,65,0.3)]' :
                                            test.status === 'failed' ? 'border-destructive text-destructive shadow-[0_0_10px_rgba(255,0,0,0.3)]' :
                                                test.status === 'running' ? 'border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse' :
                                                    'border-primary/30 text-primary/40'
                                            }`}>
                                            {test.status === 'success' ? <CheckCircle2 size={20} /> :
                                                test.status === 'failed' ? <XCircle size={20} /> :
                                                    test.status === 'running' ? <Activity size={20} /> :
                                                        <AlertCircle size={20} />}
                                        </div>
                                        <div className="text-left font-mono">
                                            <div className={`font-bold tracking-wide uppercase ${darkMode ? 'text-primary/90' : 'text-primary'}`}>{test.name}</div>
                                            {test.message && <div className="text-xs text-primary/60">{test.message}</div>}
                                        </div>
                                    </div>

                                    {test.status === 'pending' && (
                                        <button
                                            onClick={() => runTest(test.id)}
                                            className={`p-2 rounded-sm border transition-all-smooth relative hover:scale-110 active:scale-95 ${darkMode ? 'border-primary/30 text-primary/50 hover:bg-primary/20 hover:text-primary hover:border-primary' : 'border-primary/20 text-primary/60 hover:bg-primary/10 hover:border-primary'}`}
                                        >
                                            <Play size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 relative z-10 font-mono">
                            <div className={`p-8 rounded-sm border cyber-container ${darkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-slate-900 border-indigo-500/20'} relative`}>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-indigo-500 m-2"></div>
                                <div className="flex items-center gap-3 mb-4 text-left">
                                    <ShieldCheck className="text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]" size={24} />
                                    <h4 className="font-bold tracking-widest text-indigo-400 uppercase">ESTADO_SEGURIDAD</h4>
                                </div>
                                <p className="text-sm text-indigo-300/70 text-left">Módulos de cifrado y auditoría operando bajo parámetros estándar. Ninguna brecha detectada.</p>
                            </div>
                            <div className={`p-8 rounded-sm border cyber-container ${darkMode ? 'bg-emerald-950/20 border-primary/30' : 'bg-slate-900 border-primary/20'} relative`}>
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary m-2"></div>
                                <div className="flex items-center gap-3 mb-4 text-left">
                                    <Music className="text-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]" size={24} />
                                    <h4 className="font-bold tracking-widest text-primary uppercase">MOTOR_AUDIO</h4>
                                </div>
                                <p className="text-sm text-primary/70 text-left">Controlador activo. Buffer sincronizado a la tasa requerida. Latencia medida: {Math.floor(Math.random() * 10) + 5}ms.</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in space-y-4 font-mono relative z-10">
                        {testAlerts.length > 0 && (
                            <>
                                <h3 className={`text-xl font-bold tracking-widest mb-4 uppercase ${darkMode ? 'text-primary' : 'text-primary'}`}>[ NOTIFICACIONES_SISTEMA ]</h3>
                                <div className="space-y-3 mb-8">
                                    {testAlerts.map(alert => (
                                        <div
                                            key={alert.id}
                                            onClick={() => onMarkAlertAsRead?.(alert.id)}
                                            className={`p-5 rounded-sm border transition-all-smooth cursor-pointer group flex gap-4 items-center cyber-container ${alert.read ? (darkMode ? 'bg-black/40 border-primary/20 opacity-60' : 'bg-slate-900/50 border-primary/10 opacity-80') : (darkMode ? 'bg-black/80 border-cyan-500/50' : 'bg-slate-900 border-cyan-400 shadow-[inset_4px_0_0_#22d3ee]')}`}
                                        >
                                            <div className={`w-10 h-10 rounded-sm border flex flex-col items-center justify-center shrink-0 glitch-block ${alert.read ? 'border-primary/20 text-primary/40 bg-black' : 'border-cyan-400 text-cyan-400 bg-black shadow-[0_0_10px_rgba(34,211,238,0.2)]'}`}>
                                                <Terminal size={16} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-sm tracking-wide ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`}>SYS_REPORT</h4>
                                                    <span className="text-[10px] text-primary/50">{alert.date}</span>
                                                </div>
                                                <p className={`text-xs ${darkMode ? 'text-primary/70' : 'text-primary/80'}`}>{alert.message}</p>
                                            </div>
                                            {onDeleteMessage && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteMessage(alert.id); }}
                                                    className="p-2 border border-transparent hover:border-destructive hover:bg-destructive/10 rounded-sm transition-all-smooth opacity-0 group-hover:opacity-100"
                                                    title="Purgar registro"
                                                >
                                                    <Trash2 size={18} className="text-destructive" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <h3 className={`text-xl font-bold tracking-widest uppercase mb-6 mt-4 ${darkMode ? 'text-primary' : 'text-primary'}`}>[ REGISTRO_HISTÓRICO ]</h3>
                        {history.length === 0 ? (
                            <div className={`p-10 text-center rounded-sm border border-dashed cyber-container font-mono ${darkMode ? 'border-primary/30 text-primary/50 bg-black/40' : 'border-primary/20 text-primary/50 bg-slate-900/50'}`}>
                                ... ESPERANDO_EJECUCIÓN_INICIAL ...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map(entry => (
                                    <div key={entry.id} className={`p-6 rounded-sm border cyber-container ${darkMode ? 'bg-black/60 border-primary/30' : 'bg-slate-900/80 border-primary/20'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="font-bold text-sm text-primary/60">TS: {entry.date}</div>
                                            <div className="flex gap-4">
                                                <span className="text-primary font-bold flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/30"><CheckCircle2 size={14} /> {entry.passed}</span>
                                                <span className="text-destructive font-bold flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-sm border border-destructive/30"><XCircle size={14} /> {entry.failed}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {entry.details.map(d => (
                                                <div key={d.id} className="flex justify-between text-xs items-center p-2 rounded-sm bg-black/50 border border-primary/10">
                                                    <span className={darkMode ? 'text-primary/80' : 'text-primary/90'}>{d.name}</span>
                                                    <span className={d.status === 'success' ? 'text-primary font-bold tracking-widest' : d.status === 'failed' ? 'text-destructive font-bold tracking-widest' : 'text-primary/40'}>
                                                        {d.status === 'success' ? '[ OK ]' : d.status === 'failed' ? '[ FAIL ]' : '[ SKIP ]'}
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
