import React, { useState } from 'react';
import {
    Users, Mail, Shield, Key, Search,
    X, AlertTriangle, Clock, Eye, Settings as SettingsIcon,
    Download, Database, Info, ShieldCheck, Lock, ScanFace, Music, Edit2, Trash2, Camera, Check, MoreVertical, Terminal, Play,
    Moon, Bell, Volume2
} from 'lucide-react';
import { UserAccount, SecurityAlert, UserRole, AppSettings } from '../types';
import { AdminTests } from './AdminTests';

interface AdminPortalProps {
    users: UserAccount[];
    alerts: SecurityAlert[];
    onUpdateUser: (userId: string, newData: Partial<UserAccount>) => void;
    onDeleteUser: (userId: string) => void;
    onAddUser: (user: Omit<UserAccount, 'id'>) => void;
    onMarkAlertAsRead: (alertId: string) => void;
    onDeleteMessage?: (msgId: string) => void;
    onOpenSettings?: () => void;
    onTriggerSecurityAlert?: (msg: string, type?: 'password_change' | 'face_id_change' | 'login_alert' | 'role_change' | 'test_alert') => void;
    onPlaySound?: (type: 'success' | 'click' | 'alert' | 'special') => void;
    onStopAllSounds?: () => void;
    darkMode?: boolean;
    currentUserRole?: UserRole;
    adminPassword?: string;
    onUpdatePanelPassword?: (newPass: string) => void;
    onLockPortal?: () => void;
    isUnlocked?: boolean;
    onUnlockAttempt?: (password: string) => void;
    unlockError?: string;
    currentUserId?: string;
    systemSounds?: { success: string, click: string, alert: string, special: string };
    onUpdateSystemSounds?: (newSounds: { success: string, click: string, alert: string, special: string }) => void;
    appSettings?: AppSettings;
    onUpdateSettings?: (newSettings: AppSettings) => void;
    onRemoteConnect?: (userId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
    users,
    alerts,
    onUpdateUser,
    onDeleteUser,
    onAddUser,
    onMarkAlertAsRead,
    onDeleteMessage,
    onOpenSettings,
    onTriggerSecurityAlert,
    onPlaySound,
    onStopAllSounds,
    darkMode,
    currentUserRole = 'user',
    adminPassword = 'admin',
    onUpdatePanelPassword,
    onLockPortal,
    isUnlocked = false,
    onUnlockAttempt,
    unlockError,
    currentUserId,
    systemSounds,
    onUpdateSystemSounds,
    appSettings,
    onUpdateSettings,
    onRemoteConnect
}) => {
    const [adminTab, setAdminTab] = useState<'users' | 'mailbox' | 'backups' | 'roles' | 'tests' | 'sounds' | 'config'>('users');
    const [backupSubTab, setBackupSubTab] = useState<'users' | 'system'>('users');
    const [adminVerifPassword, setAdminVerifPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [verificationStep, setVerificationStep] = useState<'none' | 'password'>('none');
    const [targetRole, setTargetRole] = useState<UserRole | null>(null);

    const mailboxAlerts = alerts.filter(a => a.type !== 'test_alert');
    const testAlerts = alerts.filter(a => a.type === 'test_alert');

    const [verifPassword, setVerifPassword] = useState('');
    const [verifError, setVerifError] = useState('');
    const [showRestrictedOverlay, setShowRestrictedOverlay] = useState(false);
    const [formError, setFormError] = useState('');
    // Search query for messages/alerts
    const [messageSearch, setMessageSearch] = useState('');
    const [topNotification, setTopNotification] = useState<{ msg: string, date: string, time: string } | null>(null);

    // Removal of auto-lock on unmount to satisfy user request for persistent unlocked state
    /*
    React.useEffect(() => {
        return () => {
            onLockPortal?.();
        };
    }, []);
    */

    const ROLE_DETAILS: Record<UserRole, { label: string, desc: string, perms: string[] }> = {
        guest: {
            label: 'Invitado',
            desc: 'Acceso restringido para visualización externa.',
            perms: ['Visualización Panel Principal', 'Modo lectura de movimientos', 'Sin capacidad de edición']
        },
        user: {
            label: 'Usuario / Estándar',
            desc: 'Uso personal básico del método 50/50.',
            perms: ['Control de gastos 50/50', 'Registro de movimientos', 'Configuración de perfil']
        },
        employee: {
            label: 'Empleado',
            desc: 'Personal activo de la organización.',
            perms: ['Gestión de billetera propia', 'Operaciones con tarjetas', 'Análisis de gastos personales', 'Mensajería interna']
        },
        manager: {
            label: 'Gerente / Manager',
            desc: 'Supervisión y auditoría de la plataforma.',
            perms: ['Acceso lectura usuarios', 'Realización de backups', 'Visualización de movimientos', 'Gestión de mensajería']
        },
        admin: {
            label: 'Administrador',
            desc: 'Control total del sistema y seguridad.',
            perms: ['Gestión completa de usuarios', 'Acceso a todas las billeteras', 'Envío de comunicados globales', 'Descarga de backups']
        }
    };

    // Create/Edit User Form State
    const [userForm, setUserForm] = useState<{ name: string, email: string, password: string, role: UserRole, avatar: string }>({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        avatar: ''
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const editFileInputRef = React.useRef<HTMLInputElement>(null);

    const ROLE_PRIORITY: Record<UserRole, number> = {
        guest: 1,
        user: 2,
        employee: 3,
        manager: 4,
        admin: 5
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (currentUserRole === 'admin') return matchesSearch;
        // Non-admins can only see themselves
        return u.id === currentUserId && matchesSearch;
    }).sort((a, b) => ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role]);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        onPlaySound?.('click');
        if (!userForm.name || !userForm.email || userForm.password.length < 4) return;

        if (['admin', 'manager'].includes(userForm.role)) {
            setTargetRole(userForm.role);
            setVerificationStep('password');
            return;
        }

        onAddUser(userForm);
        onPlaySound?.('success');
        setUserForm({ name: '', email: '', password: '', role: 'user', avatar: '' });
        setIsAddingUser(false);
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        onPlaySound?.('click');
        if (editingUser) {
            // Specific protection for main admin role
            if (editingUser.id === 'admin' && userForm.role !== 'admin') {
                onPlaySound?.('alert');
                const now = new Date();
                setTopNotification({
                    msg: 'NO ES POSIBLE CAMBIAR EL NIVEL DE ACCESO.',
                    date: now.toLocaleDateString(),
                    time: now.toLocaleTimeString()
                });
                setTimeout(() => setTopNotification(null), 6000);
                setEditingUser(null); // Close modal
                return;
            }

            if (['admin', 'manager'].includes(userForm.role) && editingUser.role !== userForm.role) {
                setTargetRole(userForm.role);
                setVerificationStep('password');
                return;
            }
            onUpdateUser(editingUser.id, userForm);
            // Different sound based on whether the role was changed or just profile info
            if (editingUser.role !== userForm.role) {
                onPlaySound?.('special');
                onTriggerSecurityAlert?.(`El rol de ${editingUser.name} ha sido cambiado a ${userForm.role}`, 'role_change');
            } else {
                onPlaySound?.('success');
            }
            setEditingUser(null);
        }
    };

    const confirmRoleChange = () => {
        if (verifPassword === adminPassword) {

            if (editingUser) {
                if (editingUser.role !== userForm.role) {
                    onPlaySound?.('special');
                } else {
                    onPlaySound?.('success');
                }

                onUpdateUser(editingUser.id, userForm);
                setEditingUser(null);
                onTriggerSecurityAlert?.(`Rol de ${editingUser.name} actualizado tras verificación`, 'role_change');
            } else {
                onPlaySound?.('success');
                onAddUser(userForm);
                setIsAddingUser(false);
                onTriggerSecurityAlert?.(`Nuevo usuario ${userForm.name} creado tras verificación`, 'login_alert');
            }
            setVerificationStep('none');
            setVerifPassword('');
        } else {
            onPlaySound?.('alert');
            setVerifError('Contraseña Incorrecta.');
            setTimeout(() => setVerifError(''), 3000);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserForm(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackupUser = (user: UserAccount) => {
        onPlaySound?.('click');
        // Prepare user data for backup
        const backupData = {
            profile: JSON.parse(localStorage.getItem(`mc_${user.id}_profile`) || '{}'),
            transactions: JSON.parse(localStorage.getItem(`mc_${user.id}_transactions`) || '[]'),
            cards: JSON.parse(localStorage.getItem(`mc_${user.id}_cards`) || '[]'),
            settings: JSON.parse(localStorage.getItem(`mc_${user.id}_settings`) || '{}'),
            backupDate: new Date().toISOString(),
            userName: user.name
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        // Sanitize name (remove spaces, accents, special chars)
        const sanitize = (str: string) =>
            str.normalize('NFD').replace(/[^\w]/g, '').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const namePart = sanitize(user.name);
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const downloadPath = `backups/user backups/${namePart}/${year}/${month}/${day}/${namePart}_backup.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadPath; // set path as filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (currentUserRole === 'guest') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 animate-in fade-in duration-500">
                <div className={`w-full max-w-lg p-12 rounded-lg text-center border shadow-[0_0_30px_rgba(255,0,60,0.3)] animate-in zoom-in-95 duration-500 cyber-container ${darkMode ? 'border-destructive/80' : 'border-destructive/60'}`}>
                    <div className="w-24 h-24 bg-black border-2 border-destructive text-destructive rounded-md flex items-center justify-center mx-auto mb-8 shadow-[0_0_15px_rgba(255,0,60,0.5)] glitch-block">
                        <AlertTriangle size={48} strokeWidth={2} className="relative z-10" />
                    </div>
                    <h2 className={`text-4xl font-black mb-4 tracking-tighter uppercase font-mono neon-text-red leading-tight`}>
                        // ACCESO_DENEGADO
                    </h2>
                    <p className={`text-lg font-mono mb-10 ${darkMode ? 'text-destructive/80' : 'text-destructive/90'}`}>
                        &gt; PRIVILEGIOS_INSUFICIENTES.
                    </p>
                </div>
            </div>
        );
    }

    if (!isUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 animate-in fade-in duration-500">
                <div className={`w-full max-w-sm p-10 rounded-lg text-center cyber-container ${darkMode ? 'border-primary/50' : 'border-primary/50'}`}>
                    <div className="w-24 h-24 bg-black border-2 border-primary text-primary rounded-md flex items-center justify-center mx-auto mb-8 shadow-[0_0_15px_rgba(0,255,65,0.4)] glitch-block">
                        <ShieldCheck size={48} strokeWidth={2} className="relative z-10" />
                    </div>
                    <h2 className={`text-3xl font-black mb-2 tracking-tighter uppercase font-mono neon-text`}>&gt; AUTH_REQUIRED</h2>
                    <p className="text-sm text-primary/70 mb-8 font-mono">_Ingresa credenciales para continuar.</p>

                    <input
                        type="password"
                        placeholder="&gt; CLAVE_MAESTRA_"
                        className={`w-full p-5 rounded-md border mb-6 outline-none text-center font-mono font-black tracking-widest transition-all-smooth bg-black/80 border-primary/50 text-primary focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,65,0.3)] placeholder:text-primary/30`}
                        value={adminVerifPassword}
                        onChange={e => setAdminVerifPassword(e.target.value)}
                        onKeyPress={e => {
                            if (e.key === 'Enter') {
                                onUnlockAttempt?.(adminVerifPassword);
                                setAdminVerifPassword('');
                            }
                        }}
                    />

                    {unlockError && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 text-destructive rounded-md text-xs font-mono font-bold animate-pulse">
                            &gt; ERROR: {unlockError.toUpperCase()}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                onUnlockAttempt?.(adminVerifPassword);
                                setAdminVerifPassword('');
                            }}
                            className="w-full py-5 bg-primary/10 border-2 border-primary text-primary font-mono font-bold rounded-md hover:bg-primary/20 transition-all-smooth shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] active:scale-95 text-lg uppercase tracking-widest"
                        >
                            [ DESCIFRAR ]
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto relative">
            {topNotification && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-2xl border border-white/20 flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-sm uppercase tracking-tighter">{topNotification.msg}</h4>
                            <div className="flex gap-3 mt-1 opacity-70 text-[10px] font-bold">
                                <span className="flex items-center gap-1"><Clock size={10} /> {topNotification.time}</span>
                                <span className="flex items-center gap-1"><Info size={10} /> {topNotification.date}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setTopNotification(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-black border border-primary/50 text-white p-8 rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.15)] relative overflow-hidden text-left glitch-block">
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl text-left animate-pulse-slow pointer-events-none"></div>

                <div className="relative z-10 text-left font-mono">
                    <div className="flex items-center gap-4 mb-3 text-left">
                        <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tighter text-left neon-text">&gt; SYSTEM_ROOT</h2>
                        <div className="px-4 py-1.5 bg-primary/10 border border-primary/50 rounded-sm flex items-center gap-2 backdrop-blur-sm shadow-[0_0_8px_rgba(0,255,65,0.2)]">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#00FF41]"></div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">SECURE_LINK</span>
                        </div>
                    </div>
                    <p className="text-primary/70 font-medium text-left text-sm">~/$ Inicializando subrutinas de seguridad y auditoría de identidades.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <div className="flex bg-black/50 p-2 rounded-md border border-primary/30 mr-2 shadow-inner">
                        {onOpenSettings && (
                            <button
                                onClick={onOpenSettings}
                                className="p-3 text-primary/70 hover:text-primary hover:bg-primary/20 rounded-md transition-all-smooth"
                                title="Ajustes de Administrador"
                            >
                                <SettingsIcon size={20} strokeWidth={2} />
                            </button>
                        )}
                        <div className="w-px h-10 bg-primary/30 mx-2"></div>
                        <button
                            onClick={() => { onLockPortal?.(); onPlaySound?.('click'); }}
                            className="flex items-center gap-2 px-6 py-3 text-destructive font-mono font-bold hover:bg-destructive/20 hover:text-destructive hover:border-destructive border border-transparent rounded-md transition-all-smooth"
                        >
                            <Lock size={18} strokeWidth={2.5} /> TERMINAR
                        </button>
                    </div>

                    {currentUserRole === 'admin' && (
                        <button
                            onClick={() => { setIsAddingUser(true); onPlaySound?.('click'); }}
                            className="px-8 py-4 bg-primary/10 text-primary border border-primary rounded-md font-mono font-bold shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:bg-primary/20 transition-all-smooth flex items-center gap-3 hover:scale-105 active:scale-95 uppercase"
                        >
                            <Users size={20} strokeWidth={2.5} /> INIT_IDENTITY[]
                        </button>
                    )}
                </div>
            </div>

            <div className={`p-1.5 rounded-[2rem] flex flex-wrap gap-1.5 glass ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                <button
                    onClick={() => { setAdminTab('users'); onPlaySound?.('click'); }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth ${adminTab === 'users'
                        ? (darkMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <Users size={16} strokeWidth={2.5} /> Usuarios
                </button>

                <button
                    onClick={() => {
                        if (currentUserRole !== 'admin') {
                            setShowRestrictedOverlay(true);
                            onPlaySound?.('alert');
                        } else {
                            setAdminTab('mailbox');
                            onPlaySound?.('click');
                        }
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth relative ${adminTab === 'mailbox'
                        ? (darkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <Mail size={16} strokeWidth={2.5} /> Mensajería
                    {alerts.filter(a => !a.read).length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-sm font-black">
                            {alerts.filter(a => !a.read).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => {
                        if (currentUserRole !== 'admin') {
                            setShowRestrictedOverlay(true);
                            onPlaySound?.('alert');
                        } else {
                            setAdminTab('backups');
                            onPlaySound?.('click');
                        }
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth ${adminTab === 'backups'
                        ? (darkMode ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <Database size={16} strokeWidth={2.5} /> Backups
                </button>
                <button
                    onClick={() => {
                        if (currentUserRole !== 'admin') {
                            setShowRestrictedOverlay(true);
                            onPlaySound?.('alert');
                        } else {
                            setAdminTab('roles');
                            onPlaySound?.('click');
                        }
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth ${adminTab === 'roles'
                        ? (darkMode ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-purple-600 text-white shadow-lg shadow-purple-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <ShieldCheck size={16} strokeWidth={2.5} /> Roles
                </button>
                <button
                    onClick={() => {
                        if (currentUserRole !== 'admin') {
                            setShowRestrictedOverlay(true);
                            onPlaySound?.('alert');
                        } else {
                            setAdminTab('tests');
                            onPlaySound?.('click');
                        }
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth ${adminTab === 'tests'
                        ? (darkMode ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-orange-600 text-white shadow-lg shadow-orange-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <Terminal size={16} strokeWidth={2.5} /> Tests
                </button>
                <button
                    onClick={() => {
                        if (currentUserRole !== 'admin') {
                            setShowRestrictedOverlay(true);
                            onPlaySound?.('alert');
                        } else {
                            setAdminTab('sounds');
                            onPlaySound?.('click');
                        }
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth ${adminTab === 'sounds'
                        ? (darkMode ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-pink-600 text-white shadow-lg shadow-pink-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <Music size={16} strokeWidth={2.5} /> Sonidos
                </button>
                <button
                    onClick={() => {
                        if (currentUserRole !== 'admin') {
                            setShowRestrictedOverlay(true);
                            onPlaySound?.('alert');
                        } else {
                            setAdminTab('config');
                            onPlaySound?.('click');
                        }
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] text-xs font-bold flex items-center justify-center gap-2 transition-all-smooth ${adminTab === 'config'
                        ? (darkMode ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20')
                        : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
                        }`}
                >
                    <SettingsIcon size={16} strokeWidth={2.5} /> Configuración
                </button>
            </div>

            {adminTab === 'users' ? (
                <div className="space-y-6 text-left animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative text-left">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar identidad (nombre, correo) ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-14 pr-6 py-5 rounded-[2rem] border outline-none transition-all-smooth font-medium glass ${darkMode ? 'border-slate-700/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'border-slate-200/50 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}
                        />
                    </div>

                    <div className={`rounded-[2rem] border overflow-hidden glass shadow-xl ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className={darkMode ? 'bg-slate-800/60' : 'bg-slate-100/60'}>
                                    <tr>
                                        <th className={`px-8 py-5 text-left text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Usuario / Identidad</th>
                                        <th className={`px-8 py-5 text-left text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nivel Acceso</th>
                                        <th className={`px-8 py-5 text-left text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Credencial</th>
                                        <th className={`px-8 py-5 text-right text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Operaciones</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-slate-200/50'}`}>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className={`group transition-all-smooth ${darkMode ? 'hover:bg-slate-800/80 hover:shadow-inner' : 'hover:bg-white hover:shadow-inner'}`}>
                                            <td className="px-8 py-5 text-left">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-100 text-indigo-600 flex items-center justify-center font-black overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={`font-black text-[15px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
                                                        <div className="text-xs font-medium text-slate-500 mt-0.5">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500/20' :
                                                    user.role === 'manager' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20' :
                                                        user.role === 'employee' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20' :
                                                            'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                <code className={`text-xs px-3 py-1.5 rounded-xl font-bold tracking-widest ${darkMode ? 'bg-slate-900/50 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
                                                    {user.password.replace(/./g, '•')}
                                                </code>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2 text-right">
                                                    {currentUserRole === 'admin' && user.id !== currentUserId && (
                                                        <button
                                                            onClick={() => { onPlaySound?.('click'); onRemoteConnect?.(user.id); }}
                                                            className={`p-2.5 rounded-xl transition-all-smooth scale-100 hover:scale-110 active:scale-95 ${darkMode ? 'text-blue-400 hover:text-white hover:bg-blue-500' : 'text-blue-500 hover:text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30'}`}
                                                            title={`Acceder como ${user.name}`}
                                                        >
                                                            <Play size={18} strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                    {currentUserRole === 'admin' && (
                                                        <button
                                                            onClick={() => {
                                                                onPlaySound?.('click');
                                                                setEditingUser(user);
                                                                setUserForm({ name: user.name, email: user.email, password: user.password, role: user.role, avatar: user.avatar || '' });
                                                            }}
                                                            className={`p-2.5 rounded-xl transition-all-smooth scale-100 hover:scale-110 active:scale-95 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-indigo-500' : 'text-slate-500 hover:text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30'}`}
                                                            title="Modificar Identidad"
                                                        >
                                                            <Edit2 size={18} strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                    {currentUserRole === 'admin' && user.role !== 'admin' && (
                                                        <button onClick={() => { onPlaySound?.('alert'); onDeleteUser(user.id); }} className={`p-2.5 rounded-xl transition-all-smooth scale-100 hover:scale-110 active:scale-95 ${darkMode ? 'text-rose-400 hover:text-white hover:bg-rose-500' : 'text-rose-500 hover:text-white hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/30'}`} title="Revocar Acceso">
                                                            <Trash2 size={18} strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : adminTab === 'backups' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/20' : 'bg-emerald-50 border-emerald-100'} text-left`}>
                        <div className="flex items-center gap-4 mb-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Database size={24} />
                            </div>
                            <div className="text-left w-full">
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Centro de Respaldo</h3>
                                <p className="text-sm text-gray-500 mb-4">Gestiona copias de seguridad de usuarios individuales o del sistema completo.</p>

                                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <button
                                        onClick={() => setBackupSubTab('users')}
                                        className={`pb-2 px-4 font-bold transition-all ${backupSubTab === 'users' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    >
                                        Usuarios
                                    </button>
                                    <button
                                        onClick={() => setBackupSubTab('system')}
                                        className={`pb-2 px-4 font-bold transition-all ${backupSubTab === 'system' ? 'border-b-2 border-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    >
                                        Sistema
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {backupSubTab === 'users' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map(user => (
                                <div key={user.id} className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-400">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden text-left">
                                            <div className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <button
                                            onClick={() => handleBackupUser(user)}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                        >
                                            <Download size={18} /> Descargar JSON
                                        </button>
                                        <button
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = '.json';
                                                input.onchange = (e: any) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event: any) => {
                                                            try {
                                                                const data = JSON.parse(event.target.result);
                                                                const uid = user.id;
                                                                if (data.profile) localStorage.setItem(`mc_${uid}_profile`, JSON.stringify(data.profile));
                                                                if (data.transactions) localStorage.setItem(`mc_${uid}_transactions`, JSON.stringify(data.transactions));
                                                                if (data.cards) localStorage.setItem(`mc_${uid}_cards`, JSON.stringify(data.cards));
                                                                if (data.settings) localStorage.setItem(`mc_${uid}_settings`, JSON.stringify(data.settings));

                                                                onTriggerSecurityAlert?.(`Copia de seguridad restaurada para ${user.name}`, 'test_alert');
                                                                onPlaySound?.('success');
                                                                alert('Copia de seguridad cargada con éxito. Recarga la página para ver los cambios.');
                                                                window.location.reload();
                                                            } catch (err) {
                                                                alert('Error al cargar el archivo JSON.');
                                                            }
                                                        };
                                                        reader.readAsText(file);
                                                    }
                                                };
                                                input.click();
                                            }}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${darkMode ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                                        >
                                            <Database size={18} /> Restaurar JSON
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`p-8 rounded-[2rem] border transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <h4 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Copia de Seguridad Total del Sistema</h4>
                            <p className="text-sm text-gray-500 mb-6">Esta opción permite descargar o restaurar la totalidad de los datos del sistema, incluyendo todos los usuarios, transacciones y configuraciones.</p>

                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={() => {
                                        onPlaySound?.('click');
                                        const allData: Record<string, string | null> = {};
                                        for (let i = 0; i < localStorage.length; i++) {
                                            const key = localStorage.key(i);
                                            if (key && key.startsWith('mc_')) {
                                                allData[key] = localStorage.getItem(key);
                                            }
                                        }
                                        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        const sanitizeDate = new Date().toISOString().split('T')[0];
                                        link.download = `backup_sistema_completo_${sanitizeDate}.json`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                    }}
                                    className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                                >
                                    <Download size={20} /> Descargar Sistema Completo
                                </button>

                                <button
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.json';
                                        input.onchange = (e: any) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event: any) => {
                                                    try {
                                                        const data = JSON.parse(event.target.result);
                                                        Object.keys(data).forEach(key => {
                                                            if (key.startsWith('mc_') && data[key] !== null) {
                                                                localStorage.setItem(key, data[key]);
                                                            }
                                                        });

                                                        onTriggerSecurityAlert?.('Copia de seguridad del sistema total restaurada', 'test_alert');
                                                        onPlaySound?.('success');
                                                        alert('Sistema restaurado con éxito. Recarga la página para ver los cambios.');
                                                        window.location.reload();
                                                    } catch (err) {
                                                        alert('Error al restaurar el sistema desde el JSON.');
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }
                                        };
                                        input.click();
                                    }}
                                    className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${darkMode ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                                >
                                    <Database size={20} /> Restaurar Sistema Completo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : adminTab === 'roles' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(Object.keys(ROLE_DETAILS) as UserRole[]).map(role => (
                            <div
                                key={role}
                                className={`p-6 rounded-[2rem] border transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-4 mb-4 text-left">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                        role === 'manager' ? 'bg-blue-100 text-blue-600' :
                                            role === 'employee' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ROLE_DETAILS[role].label}</h4>
                                        <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Nivel {role === 'admin' ? '5' : role === 'manager' ? '4' : role === 'employee' ? '3' : role === 'user' ? '2' : '1'}</div>
                                    </div>
                                </div>
                                <p className={`text-xs mb-4 text-left ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ROLE_DETAILS[role].desc}</p>
                                <div className="space-y-2 text-left">
                                    {ROLE_DETAILS[role].perms.map((p, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <Check size={12} className="text-emerald-500" />
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : adminTab === 'tests' ? (
                <AdminTests
                    onTriggerSecurityAlert={onTriggerSecurityAlert || (() => { })}
                    onPlaySound={onPlaySound || (() => { })}
                    darkMode={darkMode}
                    testAlerts={testAlerts}
                    onMarkAlertAsRead={onMarkAlertAsRead}
                    onDeleteMessage={onDeleteMessage}
                />
            ) : adminTab === 'sounds' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className={`p-8 rounded-sm border cyber-container ${darkMode ? 'bg-black/90 border-primary/50' : 'bg-slate-900 border-primary/30'} text-left relative overflow-hidden`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                        <div className="flex items-center gap-4 mb-4 text-left">
                            <div className="w-12 h-12 rounded-sm bg-black border border-primary text-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)] glitch-block">
                                <Music size={24} />
                            </div>
                            <div className="text-left w-full">
                                <h3 className={`text-xl font-bold font-mono tracking-wider ${darkMode ? 'text-primary' : 'text-primary'}`}>MODULACIÓN DE AUDIO</h3>
                                <p className="text-sm font-mono text-primary/70">Configura los efectos de sonido globales de la terminal. (Acepta URLs)</p>
                            </div>
                        </div>

                        {/* Mute All Sounds Button */}
                        <div className="mt-8">
                            <button
                                onClick={() => {
                                    onStopAllSounds?.();
                                    if (onPlaySound) onPlaySound('click');
                                }}
                                className={`w-full relative group overflow-hidden rounded-lg border ${darkMode ? 'border-red-500/30 bg-red-950/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/60' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'} p-4 flex items-center justify-center gap-3 font-bold transition-all duration-300 shadow-sm`}
                            >
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full opacity-50 group-hover:opacity-100 group-hover:animate-ping"></div>
                                <Music size={20} className="relative z-10" />
                                <span className="relative z-10 tracking-wide">Desactivar Audio Global</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(['success', 'click', 'alert', 'special'] as const).map(type => (
                            <div key={type} className={`p-6 rounded-sm border transition-all-smooth cyber-container ${darkMode ? 'bg-black/80 border-primary/30 hover:border-primary' : 'bg-slate-900 border-primary/20 hover:border-primary/80'} group relative overflow-hidden`}>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-10 h-10 rounded-sm border bg-black flex items-center justify-center glitch-block ${type === 'success' ? 'border-primary text-primary shadow-[0_0_10px_rgba(0,255,65,0.3)]' : type === 'alert' ? 'border-destructive text-destructive shadow-[0_0_10px_rgba(255,0,0,0.3)]' : type === 'special' ? 'border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}>
                                        <Music size={16} />
                                    </div>
                                    <div>
                                        <h4 className={`font-mono font-bold uppercase tracking-wider ${darkMode ? 'text-primary/90' : 'text-primary/90'}`}>[SND_{type.toUpperCase()}] {type === 'success' ? 'Éxito' : type === 'click' ? 'Clic de Botón' : type === 'special' ? 'Notificación Especial' : 'Alerta'}</h4>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={systemSounds?.[type] || ''}
                                        onChange={(e) => {
                                            if (onUpdateSystemSounds && systemSounds) {
                                                onUpdateSystemSounds({ ...systemSounds, [type]: e.target.value });
                                            }
                                        }}
                                        className={`flex-1 p-3 rounded-none border-b-2 outline-none text-sm font-mono ${darkMode ? 'bg-black border-primary/50 text-primary focus:border-primary shadow-[inset_0_-2px_4px_rgba(0,255,65,0.1)]' : 'bg-black/50 border-primary/30 text-primary focus:border-primary'}`}
                                        placeholder={`URL del sonido de ${type}`}
                                    />
                                    <button
                                        onClick={() => {
                                            if (systemSounds?.[type]) {
                                                const audio = new Audio(systemSounds[type]);
                                                audio.volume = 0.5;
                                                audio.play().catch(() => { });
                                            }
                                        }}
                                        className={`p-3 rounded-sm border font-bold transition-all-smooth relative ${darkMode ? 'bg-black border-primary/50 text-primary hover:bg-primary/20 hover:border-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'bg-black/80 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/80'}`}
                                        title="Probar sonido"
                                    >
                                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary/20"></div>
                                        <Play size={18} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : adminTab === 'config' && appSettings && onUpdateSettings ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className={`p-8 rounded-sm border cyber-container ${darkMode ? 'bg-black/90 border-primary/50' : 'bg-slate-900 border-primary/30'} text-left relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[url('/grid-bg.png')] opacity-10 pointer-events-none"></div>
                        <div className="flex items-center gap-4 mb-4 text-left">
                            <div className="w-12 h-12 rounded-sm bg-black border border-primary text-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)] glitch-block">
                                <SettingsIcon size={24} />
                            </div>
                            <div className="text-left w-full">
                                <h3 className={`text-xl font-bold font-mono tracking-wider ${darkMode ? 'text-primary' : 'text-primary'}`}>SYS_CONFIG_GLOBAL</h3>
                                <p className="text-sm font-mono text-primary/70">Configura las directivas raíz para el funcionamiento de la interfaz y la experiencia del usuario de forma global.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`flex items-center justify-between p-6 rounded-sm border transition-all-smooth cyber-container ${darkMode ? 'hover:border-primary bg-black/80 border-primary/30' : 'hover:border-primary/80 bg-slate-900 border-primary/20'} group`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-sm border bg-black flex items-center justify-center glitch-block ${darkMode ? 'text-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-cyan-500 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.2)]'}`}>
                                    <Bell size={24} />
                                </div>
                                <span className={`font-mono font-bold uppercase ${darkMode ? 'text-primary/90' : 'text-primary'}`}>Alertas Push</span>
                            </div>
                            <button
                                onClick={() => onUpdateSettings({ ...appSettings, notifications: !appSettings.notifications })}
                                className={`w-14 h-8 rounded-sm p-1 transition-all-smooth border relative ${appSettings.notifications ? 'bg-primary/20 border-primary shadow-[0_0_8px_rgba(0,255,65,0.4)]' : (darkMode ? 'bg-black border-primary/30' : 'bg-black border-primary/20')}`}
                            >
                                <div className={`w-5 h-5 rounded-sm shadow-sm transform transition-transform duration-300 ${appSettings.notifications ? 'translate-x-[22px] bg-primary' : 'translate-x-0 bg-primary/40'}`} />
                            </button>
                        </div>

                        <div className={`flex items-center justify-between p-6 rounded-sm border transition-all-smooth cyber-container ${darkMode ? 'hover:border-primary bg-black/80 border-primary/30' : 'hover:border-primary/80 bg-slate-900 border-primary/20'} group`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-sm border bg-black flex items-center justify-center glitch-block ${darkMode ? 'text-purple-400 border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.2)]' : 'text-purple-500 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.2)]'}`}>
                                    <Moon size={24} />
                                </div>
                                <span className={`font-mono font-bold uppercase ${darkMode ? 'text-primary/90' : 'text-primary'}`}>Modo Terminal Oscura</span>
                            </div>
                            <button
                                onClick={() => onUpdateSettings({ ...appSettings, darkMode: !appSettings.darkMode })}
                                className={`w-14 h-8 rounded-sm p-1 transition-all-smooth border relative ${appSettings.darkMode ? 'bg-primary/20 border-primary shadow-[0_0_8px_rgba(0,255,65,0.4)]' : (darkMode ? 'bg-black border-primary/30' : 'bg-black border-primary/20')}`}
                            >
                                <div className={`w-5 h-5 rounded-sm shadow-sm transform transition-transform duration-300 ${appSettings.darkMode ? 'translate-x-[22px] bg-primary' : 'translate-x-0 bg-primary/40'}`} />
                            </button>
                        </div>

                        <div className={`flex items-center justify-between p-6 rounded-sm border transition-all-smooth cyber-container ${darkMode ? 'hover:border-primary bg-black/80 border-primary/30' : 'hover:border-primary/80 bg-slate-900 border-primary/20'} group`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-sm border bg-black flex items-center justify-center glitch-block ${darkMode ? 'text-green-400 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'text-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]'}`}>
                                    <Volume2 size={24} />
                                </div>
                                <span className={`font-mono font-bold uppercase ${darkMode ? 'text-primary/90' : 'text-primary'}`}>Efectos de Terminal</span>
                            </div>
                            <button
                                onClick={() => onUpdateSettings({ ...appSettings, sound: !appSettings.sound })}
                                className={`w-14 h-8 rounded-sm p-1 transition-all-smooth border relative ${appSettings.sound ? 'bg-primary/20 border-primary shadow-[0_0_8px_rgba(0,255,65,0.4)]' : (darkMode ? 'bg-black border-primary/30' : 'bg-black border-primary/20')}`}
                            >
                                <div className={`w-5 h-5 rounded-sm shadow-sm transform transition-transform duration-300 ${appSettings.sound ? 'translate-x-[22px] bg-primary' : 'translate-x-0 bg-primary/40'}`} />
                            </button>
                        </div>

                        <div className={`flex items-center justify-between p-6 rounded-sm border transition-all-smooth cyber-container ${darkMode ? 'hover:border-primary bg-black/80 border-primary/30' : 'hover:border-primary/80 bg-slate-900 border-primary/20'} group`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-sm border bg-black flex items-center justify-center glitch-block ${darkMode ? 'text-yellow-400 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' : 'text-yellow-500 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.2)]'}`}>
                                    <ScanFace size={24} />
                                </div>
                                <span className={`font-mono font-bold uppercase ${darkMode ? 'text-primary/90' : 'text-primary'}`}>Biometría / FaceID</span>
                            </div>
                            <button
                                onClick={() => onUpdateSettings({ ...appSettings, faceId: !appSettings.faceId })}
                                className={`w-14 h-8 rounded-sm p-1 transition-all-smooth border relative ${appSettings.faceId ? 'bg-primary/20 border-primary shadow-[0_0_8px_rgba(0,255,65,0.4)]' : (darkMode ? 'bg-black border-primary/30' : 'bg-black border-primary/20')}`}
                            >
                                <div className={`w-5 h-5 rounded-sm shadow-sm transform transition-transform duration-300 ${appSettings.faceId ? 'translate-x-[22px] bg-primary' : 'translate-x-0 bg-primary/40'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                    <div className="lg:col-span-1 space-y-4 text-left">
                        <div className={`p-6 rounded-3xl ${darkMode ? 'bg-blue-900/20 border border-blue-900/30' : 'bg-blue-50 border border-blue-100'} text-left`}>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                <Shield size={24} />
                            </div>
                            <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alertas de Seguridad</h3>
                            <p className="text-sm text-gray-500 leading-relaxed italic">
                                Cualquier cambio crítico en las cuentas de los usuarios se reportará automáticamente en este buzón central.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 text-left">
                        {/* Search bar for alerts */}
                        <div className="mb-4 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Buscar mensajes..."
                                value={messageSearch}
                                onChange={e => setMessageSearch(e.target.value)}
                                className={`w-full p-2 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                            />
                        </div>
                        {mailboxAlerts.filter(a => a.message.toLowerCase().includes(messageSearch.toLowerCase()) || a.type.toLowerCase().includes(messageSearch.toLowerCase())).length === 0 && (
                            <div className={`p-10 text-center rounded-3xl border border-dashed ${darkMode ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'}`}>
                                No hay notificaciones de seguridad recientes.
                            </div>
                        )}
                        {/* Render filtered alerts with highlight and delete */}
                        {mailboxAlerts
                            .filter(a => a.message.toLowerCase().includes(messageSearch.toLowerCase()) || a.type.toLowerCase().includes(messageSearch.toLowerCase()))
                            .map(alert => (
                                <div
                                    key={alert.id}
                                    onClick={() => onMarkAlertAsRead(alert.id)}
                                    className={`p-8 rounded-[2rem] border transition-all cursor-pointer group flex gap-6 ${alert.read
                                        ? (darkMode ? 'bg-gray-800/40 border-gray-700 opacity-60' : 'bg-gray-50/50 border-gray-100 opacity-80')
                                        : (darkMode ? 'bg-gray-800 border-blue-900/50 shadow-lg' : 'bg-white border-blue-100 shadow-md border-l-8 border-l-blue-500')
                                        } hover:scale-[1.01] text-left mb-4`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'password_change' ? 'bg-amber-100 text-amber-600' : alert.type === 'role_change' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {alert.type === 'password_change' ? <Key size={20} /> : alert.type === 'role_change' ? <Shield size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between items-start mb-1 text-left">
                                            <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                                {alert.userName} - {alert.type === 'password_change' ? 'Cambio de Contraseña' : alert.type === 'role_change' ? 'Cambio de Nivel de Acceso' : 'Alerta de Seguridad'}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Clock size={10} /> {alert.date}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {/* Highlight search term */}
                                            <span dangerouslySetInnerHTML={{ __html: messageSearch ? alert.message.replace(new RegExp(`(${messageSearch})`, 'gi'), '<mark className="bg-yellow-200 text-black px-1 rounded">$1</mark>') : alert.message }} />
                                        </p>
                                        {!alert.read && (
                                            <div className="mt-2 flex items-center gap-2 text-blue-500 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                Nuevo mensaje
                                            </div>
                                        )}
                                    </div>
                                    {/* Delete button */}
                                    {onDeleteMessage && (
                                        <button
                                            onClick={e => { e.stopPropagation(); onDeleteMessage(alert.id); }}
                                            className="p-2 hover:bg-rose-100 rounded-full transition-colors"
                                            title="Eliminar mensaje"
                                        >
                                            <Trash2 size={20} className="text-rose-600" />
                                        </button>
                                    )}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                        <Eye size={18} className="text-gray-400" />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {isAddingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6 text-left">
                    <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center text-left">
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nuevo Usuario</h3>
                            <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-left">
                            <div className="flex justify-center mb-6 text-center">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center relative cursor-pointer group overflow-hidden border-2 border-dashed ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    {userForm.avatar ? (
                                        <img src={userForm.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="text-gray-400" size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Edit2 className="text-white" size={20} />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                            </div>

                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.name}
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    className={`w-full p-4 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                    placeholder="Ej: Sofia López"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    className={`w-full p-4 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                    placeholder="sofia@email.com"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    className={`w-full p-4 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                    placeholder="Mínimo 4 caracteres"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol / Puesto</label>
                                <div className="space-y-2 text-left">
                                    <select
                                        value={userForm.role}
                                        onChange={e => {
                                            setUserForm({ ...userForm, role: e.target.value as any });
                                            onPlaySound?.('click');
                                        }}
                                        className={`w-full p-4 rounded-xl border outline-none font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        {(Object.keys(ROLE_DETAILS) as UserRole[])
                                            .sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b])
                                            .map(role => (
                                                <option key={role} value={role}>{ROLE_DETAILS[role].label}</option>
                                            ))
                                        }
                                    </select>
                                    <div className={`p-3 rounded-lg text-[10px] flex gap-2 ${darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'} text-left`}>
                                        <Info size={14} className="shrink-0" />
                                        <p>{ROLE_DETAILS[userForm.role].desc}</p>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-all mt-4">
                                Crear Cuenta
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6 text-left">
                    <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center text-left">
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Editar Usuario</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-left">
                            {formError && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black text-center animate-bounce border border-rose-100 flex items-center justify-center gap-2">
                                    <AlertTriangle size={14} />
                                    {formError}
                                </div>
                            )}
                            <div className="flex justify-center mb-6 text-center">
                                <div
                                    onClick={() => editFileInputRef.current?.click()}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center relative cursor-pointer group overflow-hidden border-2 border-dashed ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    {userForm.avatar ? (
                                        <img src={userForm.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="text-gray-400" size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Edit2 className="text-white" size={20} />
                                    </div>
                                </div>
                                <input type="file" ref={editFileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                            </div>

                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.name}
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    className={`w-full p-4 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    className={`w-full p-4 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    className={`w-full p-4 rounded-xl border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol / Puesto</label>
                                <div className="space-y-2 text-left">
                                    <select
                                        value={userForm.role}
                                        onChange={e => {
                                            setUserForm({ ...userForm, role: e.target.value as any });
                                            onPlaySound?.('click');
                                        }}
                                        className={`w-full p-4 rounded-xl border outline-none font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        {(Object.keys(ROLE_DETAILS) as UserRole[])
                                            .sort((a, b) => ROLE_PRIORITY[a] - ROLE_PRIORITY[b])
                                            .map(role => (
                                                <option key={role} value={role}>{ROLE_DETAILS[role].label}</option>
                                            ))
                                        }
                                    </select>
                                    <div className={`p-3 rounded-lg text-[10px] flex gap-2 ${darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'} text-left`}>
                                        <Info size={14} className="shrink-0" />
                                        <p>{ROLE_DETAILS[userForm.role].desc}</p>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all mt-4">
                                Actualizar Usuario
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {verificationStep !== 'none' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300 text-left">
                    <div className={`w-full max-w-sm rounded-[2.5rem] p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={40} />
                        </div>
                        <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Acceso Restringido</h3>
                        <p className="text-sm text-gray-500 mb-6">Estás asignando un rol de alto privilegio ({targetRole}). Por favor, confirma tu identidad para continuar.</p>

                        {verifError && (
                            <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-black animate-bounce">
                                {verifError}
                            </div>
                        )}

                        <input
                            type="password"
                            placeholder="Contraseña de Administrador"
                            value={verifPassword}
                            onChange={e => setVerifPassword(e.target.value)}
                            className={`w-full p-4 rounded-xl border mb-4 outline-none text-center font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`}
                        />

                        <div className="flex gap-3 text-center">
                            <button
                                onClick={() => setVerificationStep('none')}
                                className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRoleChange}
                                className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showRestrictedOverlay && (
                <div
                    className="fixed inset-0 bg-black z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300"
                    onClick={() => setShowRestrictedOverlay(false)}
                >
                    <div
                        className={`w-full max-w-lg p-12 rounded-[3.5rem] text-center border shadow-2xl animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <AlertTriangle size={48} />
                        </div>
                        <h2 className={`text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} leading-tight`}>
                            ACCESO RESTRINGIDO
                        </h2>
                        <p className={`text-lg font-bold mb-10 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            SOLO ADMINISTRADORES PUEDEN USAR ESTA FUNCIÓN.
                        </p>
                        <button
                            onClick={() => setShowRestrictedOverlay(false)}
                            className="px-12 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-xl active:scale-95 border border-white/20"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
