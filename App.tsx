import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  Wallet, PieChart, Plus,
  Lock, User, AlertCircle, ScanFace,
  LayoutGrid, ArrowRightLeft,
  ShieldCheck, Info, Music
} from 'lucide-react';
import { Sidebar, ViewType } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { TransactionModal } from './components/TransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CardModal } from './components/CardModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CameraScanner } from './components/CameraScanner';
import {
  Transaction, BankAccount, CardModel, AppNotification,
  UserProfile, AppSettings, FaceRecord, FinancialState,
  BANKS, UserAccount, SecurityAlert, AppMessage, UserRole
} from './types';
import { formatCurrency, formatDate } from './utils';
import { AdminPortal } from './components/AdminPortal';
import { AnalyticsView } from './components/AnalyticsView';
import { MessagingCenter } from './components/MessagingCenter';

// --- MOCK DATA (Used only for first initialization) ---
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-05-28T10:00:00Z', description: 'Nómina Mensual', amount: 3500.00, type: 'income', category: 'Nómina', bankAccount: 'santander' },
  { id: '2', date: '2024-05-29T14:30:00Z', description: 'Supermercado Mercadona', amount: 145.50, type: 'expense', category: 'Hogar', bankAccount: 'santander' },
  { id: '3', date: '2024-05-30T09:15:00Z', description: 'Netflix Suscripción', amount: 17.99, type: 'expense', category: 'Suscripciones', bankAccount: 'caixabank' },
  { id: '4', date: '2024-05-30T18:00:00Z', description: 'Gasolinera Shell', amount: 65.00, type: 'expense', category: 'Transporte', bankAccount: 'santander' },
  { id: '5', date: '2024-05-31T12:00:00Z', description: 'Venta de Acciones', amount: 1200.00, type: 'income', category: 'Inversiones', bankAccount: 'caixabank' },
];

const INITIAL_CARDS: CardModel[] = [
  { id: '1', alias: 'Personal Principal', last4: '4242', holder: 'JUAN PÉREZ', expiry: '12/26', theme: 'black', network: 'visa' },
  { id: '2', alias: 'Gastos Empresa', last4: '8899', holder: 'JUAN PÉREZ', expiry: '09/25', theme: 'purple', network: 'mastercard' },
];

const INITIAL_MESSAGES: AppMessage[] = [
  {
    id: 'm1', fromId: 'system', fromName: 'SISTEMA', toId: 'all',
    title: 'Bienvenido a Mi Cartera 50/50',
    content: 'Tu cuenta ha sido activada con éxito. Recuerda configurar tus ahorros.',
    date: new Date().toLocaleString(), read: false, type: 'system'
  },
];

const DEFAULT_USERS: UserAccount[] = [
  { id: '1', name: 'Juan Pérez', email: 'juan.perez@email.com', password: '1234', role: 'manager', avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=0D8ABC&color=fff' },
  { id: '2', name: 'Laura García', email: 'laura.g@email.com', password: '0000', role: 'employee', avatar: 'https://ui-avatars.com/api/?name=Laura+Garcia&background=F000B8&color=fff' },
  { id: '3', name: 'Carlos Ruiz', email: 'carlos@email.com', password: '1111', role: 'employee', avatar: 'https://ui-avatars.com/api/?name=Carlos+Ruiz&background=7CB342&color=fff' },
  { id: 'admin', name: 'Admin Mi Cartera', email: 'admin@micartera.com', password: 'admin', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin&background=111827&color=fff' },
];

// --- STORAGE HELPER ---
const loadFromStorage = <T,>(key: string, initialValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage`, error);
    return initialValue;
  }
};

type DashboardMode = '5050' | 'real';

export default function App() {
  // -- AUTH & USER LIST --
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => loadFromStorage('mc_all_users', DEFAULT_USERS));
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(() => loadFromStorage('mc_security_alerts', []));
  const [currentView, setCurrentView] = useState<ViewType | 'admin'>('dashboard');
  const [selectedUserLogin, setSelectedUserLogin] = useState<UserAccount | null>(null);
  const [remoteAdminMode, setRemoteAdminMode] = useState(false);

  // -- ROLE MIGRATION & SORTING EFFECT --
  useEffect(() => {
    const ROLE_LEVELS: Record<UserRole, number> = { guest: 1, user: 2, employee: 3, manager: 4, admin: 5 };

    const processed = allUsers.map(u => {
      if (!ROLE_LEVELS[u.role]) {
        return { ...u, role: 'employee' as UserRole };
      }
      return u;
    }).sort((a, b) => ROLE_LEVELS[a.role] - ROLE_LEVELS[b.role]);

    if (JSON.stringify(processed) !== JSON.stringify(allUsers)) {
      setAllUsers(processed);
    }
  }, [allUsers]);

  // -- PER-USER DATA STATE --
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CardModel[]>([]);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [faces, setFaces] = useState<FaceRecord[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    notifications: true,
    darkMode: false,
    sound: true,
    faceId: false
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', email: '', phone: '' });

  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('5050');
  const [loginError, setLoginError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Modals state...
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardModel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const [systemSounds, setSystemSounds] = useState<{ success: string, click: string, alert: string }>(() => loadFromStorage('mc_system_sounds', {
    success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    alert: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3'
  }));

  // UI Effects
  const playUISound = (type: 'success' | 'click' | 'alert') => {
    if (!appSettings.sound) return;
    try {
      // Stop and reset current sound if exists
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio = new Audio();
      currentAudioRef.current = audio;

      audio.src = systemSounds[type];
      audio.volume = 0.2;
      audio.play().catch(() => { });
    } catch (e) { }
  };

  const triggerSecurityAlert = (msg: string, type: SecurityAlert['type'] = 'login_alert') => {
    const newAlert: SecurityAlert = {
      id: Date.now().toString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      type,
      message: msg,
      date: new Date().toLocaleString(),
      read: false
    };
    setSecurityAlerts(prev => [newAlert, ...prev]);
    playUISound('alert');
  };
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPanelPassword, setAdminPanelPassword] = useState(() => loadFromStorage('mc_admin_panel_password', 'admin'));
  const [adminVerifPassword, setAdminVerifPassword] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState('');
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'login' | 'register'>('login');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // --- DATA LOADING PER USER ---
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const uid = currentUser.id;

      // Generate unique initial data if not exists
      const initialUserCards: CardModel[] = [
        {
          id: `c1_${uid}`,
          alias: 'Personal Principal',
          last4: Math.floor(1000 + Math.random() * 9000).toString(),
          holder: currentUser.name.toUpperCase(),
          expiry: '12/28',
          theme: uid === 'admin' ? 'black' : 'purple',
          network: 'visa'
        },
        {
          id: `c2_${uid}`,
          alias: 'Cuenta Ahorro',
          last4: Math.floor(1000 + Math.random() * 9000).toString(),
          holder: currentUser.name.toUpperCase(),
          expiry: '06/27',
          theme: 'blue',
          network: 'mastercard'
        },
      ];

      const initialUserTransactions: Transaction[] = [
        {
          id: `t1_${uid}`,
          date: new Date().toISOString(),
          description: `Ingreso Inicial - ${currentUser.name}`,
          amount: 2500.00,
          type: 'income',
          category: 'Otros',
          bankAccount: 'santander'
        },
        {
          id: `t2_${uid}`,
          date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Compra Supermercado',
          amount: 54.20,
          type: 'expense',
          category: 'Hogar',
          bankAccount: 'santander'
        },
      ];

      setTransactions(loadFromStorage(`mc_${uid}_transactions`, initialUserTransactions));
      setCards(loadFromStorage(`mc_${uid}_cards`, initialUserCards));
      setMessages(loadFromStorage(`mc_${uid}_messages`, uid === 'admin' ? [] : INITIAL_MESSAGES));
      setFaces(loadFromStorage(`mc_${uid}_faces`, []));
      setAppSettings(loadFromStorage(`mc_${uid}_settings`, {
        notifications: true,
        darkMode: false,
        sound: true,
        faceId: false
      }));
      setUserProfile(loadFromStorage(`mc_${uid}_profile`, {
        name: currentUser.name,
        email: currentUser.email,
        phone: '+34 600 000 000',
        avatar: currentUser.avatar
      }));
    }
  }, [isAuthenticated, currentUser]);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('mc_all_users', JSON.stringify(allUsers)); }, [allUsers]);
  useEffect(() => { localStorage.setItem('mc_security_alerts', JSON.stringify(securityAlerts)); }, [securityAlerts]);
  useEffect(() => { localStorage.setItem('mc_admin_panel_password', JSON.stringify(adminPanelPassword)); }, [adminPanelPassword]);
  useEffect(() => { localStorage.setItem('mc_system_sounds', JSON.stringify(systemSounds)); }, [systemSounds]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const uid = currentUser.id;
      localStorage.setItem(`mc_${uid}_transactions`, JSON.stringify(transactions));
      localStorage.setItem(`mc_${uid}_cards`, JSON.stringify(cards));
      localStorage.setItem(`mc_${uid}_messages`, JSON.stringify(messages));
      localStorage.setItem(`mc_${uid}_faces`, JSON.stringify(faces));
      localStorage.setItem(`mc_${uid}_settings`, JSON.stringify(appSettings));
      localStorage.setItem(`mc_${uid}_profile`, JSON.stringify(userProfile));
    }
  }, [transactions, cards, messages, faces, appSettings, userProfile, isAuthenticated, currentUser]);

  // --- GUEST SECURITY EFFECTS ---
  useEffect(() => {
    if (currentUser?.role === 'guest' && !remoteAdminMode) {
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen') {
          navigator.clipboard.writeText('');
          triggerSecurityAlert('Invitado intentó realizar una captura de pantalla.', 'login_alert');
          alert('Las capturas de pantalla están deshabilitadas para invitados por seguridad.');
        }
      };

      const preventCopy = (e: Event) => e.preventDefault();

      window.addEventListener('keyup', handleKeyUp);
      document.addEventListener('contextmenu', preventCopy);
      document.addEventListener('copy', preventCopy);

      const style = document.createElement('style');
      style.id = 'guest-security-styles';
      style.innerHTML = `
        @media print {
          body { display: none !important; }
        }
        body {
          -webkit-user-select: none !important;
          user-select: none !important;
        }
      `;
      document.head.appendChild(style);

      const handleVisibilityChange = () => {
        if (document.hidden) {
          document.body.style.filter = 'blur(10px)';
        } else {
          document.body.style.filter = 'none';
        }
      };
      const handleBlur = () => { document.body.style.filter = 'blur(10px)'; };
      const handleFocus = () => { document.body.style.filter = 'none'; };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);

      return () => {
        window.removeEventListener('keyup', handleKeyUp);
        document.removeEventListener('contextmenu', preventCopy);
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        const el = document.getElementById('guest-security-styles');
        if (el) el.remove();
        document.body.style.filter = 'none';
      };
    }
  }, [currentUser, remoteAdminMode]);

  // -- HELPER: MESSAGING --
  const sendMessage = (
    toId: string,
    title: string,
    content: string,
    type: AppMessage['type'] = 'system',
    fromId: string = 'system',
    fromName: string = 'SISTEMA',
    attachments?: AppMessage['attachments']
  ) => {
    const newMsg: AppMessage = {
      id: Date.now().toString(),
      fromId,
      fromName,
      toId,
      title,
      content,
      date: new Date().toLocaleString(),
      read: false,
      type,
      attachments
    };

    // If sending to ALL, it should appear for everyone.
    // In this local mock, we just add it to the current message list IF currentUser matches 'all'
    // But better: we save it to the global pool if it were a real backend.

    if (toId === 'all') {
      // Global broadcast: Add to current state and persistent storage for ALL users
      setMessages(prev => [newMsg, ...prev]);

      // Correctly simulate broadcast for other users in this local environment
      allUsers.forEach(u => {
        if (u.id !== currentUser?.id) {
          const userMsgs = loadFromStorage(`mc_${u.id}_messages`, []);
          localStorage.setItem(`mc_${u.id}_messages`, JSON.stringify([newMsg, ...userMsgs]));
        }
      });
    } else if (toId.startsWith('role:')) {
      const targetRole = toId.replace('role:', '');

      // Add to current state if user has the role
      if (currentUser?.role === targetRole || (targetRole === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'manager'))) {
        setMessages(prev => [newMsg, ...prev]);
      }

      // Save to all users with that role
      allUsers.forEach(u => {
        if (u.role === targetRole && u.id !== currentUser?.id) {
          const userMsgs = loadFromStorage(`mc_${u.id}_messages`, []);
          localStorage.setItem(`mc_${u.id}_messages`, JSON.stringify([newMsg, ...userMsgs]));
        }
      });
    } else {
      // Save to recipient's storage
      const targetMsgs = loadFromStorage(`mc_${toId}_messages`, []);
      localStorage.setItem(`mc_${toId}_messages`, JSON.stringify([newMsg, ...targetMsgs]));

      // If current user is the recipient or admin (to admin), update state
      if (currentUser?.id === toId || (toId === 'admin' && currentUser?.role === 'admin')) {
        setMessages(prev => [newMsg, ...prev]);
      }
    }
  };

  // -- SECURITY NOTIFIER --
  const sendSecurityAlert = (type: SecurityAlert['type'], message: string) => {
    if (!currentUser) return;
    const newAlert: SecurityAlert = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      type,
      message,
      date: new Date().toLocaleString(),
      read: false
    };
    setSecurityAlerts(prev => [newAlert, ...prev]);

    // Send to admin as a security message
    sendMessage('admin', `ALERTA: ${currentUser.name}`, message, 'security', currentUser.id, currentUser.name);
  };

  // -- CALCULATIONS --
  const financialState: FinancialState = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const savingsBag = totalIncome * 0.5;
    const spendableBag = (totalIncome * 0.5) - totalExpenses;

    // Total Real Balance (sum of all banks initial + transactions)
    const initialBase = BANKS.reduce((acc: number, b: BankAccount) => acc + b.initialBalance, 0);
    const totalRealBalance = initialBase + totalIncome - totalExpenses;

    return {
      totalRealBalance,
      totalIncome,
      totalExpenses,
      savingsBag,
      spendableBag,
      isSavingsInvaded: spendableBag < 0
    };
  }, [transactions]);

  // -- HANDLERS --

  const handleUpdateSettings = (newSettings: AppSettings) => {
    if (newSettings.faceId !== appSettings.faceId) {
      if (newSettings.faceId) {
        sendMessage(currentUser!.id, 'Seguridad', 'Has activado Face ID. Asegúrate de registrar tu rostro en los ajustes.', 'security');
      } else {
        sendMessage(currentUser!.id, 'Seguridad', 'Has desactivado el acceso por Face ID.', 'security');
      }
    }
    setAppSettings(newSettings);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserLogin && passwordInput === selectedUserLogin.password) {
      setCurrentUser(selectedUserLogin);
      setIsAuthenticated(true);
      setRemoteAdminMode(false);
      setLoginError('');
      setPasswordInput('');

      // Auto-nav to admin portal if admin logs in
      if (selectedUserLogin.role === 'admin') {
        setCurrentView('admin');
      }
    } else {
      setLoginError('Contraseña Incorrecta');
    }
  };

  const handleUpdatePassword = (newPass: string) => {
    if (!currentUser) return;
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPass } : u));
    sendSecurityAlert('password_change', `El usuario ha actualizado su clave de acceso.`);
    sendMessage(currentUser.id, 'Seguridad', 'Tu contraseña ha sido actualizada correctamente.', 'security');
  };

  const startFaceIDLogin = () => {
    if (!selectedUserLogin) return;
    // Loading faces for specific user to check
    const userFaces = loadFromStorage(`mc_${selectedUserLogin.id}_faces`, []);
    if (userFaces.length === 0) {
      setLoginError('Face ID sin configurar para este usuario.');
      return;
    }
    setCameraMode('login');
    setIsCameraOpen(true);
  };

  const handleFaceVerify = (success: boolean) => {
    setTimeout(() => {
      setIsCameraOpen(false);
      if (success && selectedUserLogin) {
        setCurrentUser(selectedUserLogin);
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Rostro Incorrecto');
      }
    }, 500);
  };

  const handleAdminUnlockAttempt = () => {
    setAdminUnlockError('');
    if (adminVerifPassword === adminPanelPassword) {
      unlockAdminPortal();
    } else {
      const failedPass = adminVerifPassword;
      setAdminUnlockError('Contraseña Incorrecta');
      playUISound('alert');

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const msg = `Intento de acceso FALLIDO al Panel Administrativo.\n\nUsuario: ${currentUser?.name}\nFecha: ${dateStr}\nHora: ${timeStr}\nMétodo: Contraseña Manual\nClave introducida: "${failedPass}"`;

      triggerSecurityAlert(`Intento fallido de acceso al panel por ${currentUser?.name}`, 'login_alert');
      sendMessage('role:admin', 'URGENTE: Intento de Acceso no Autorizado', msg, 'security', 'system', 'SISTEMA de SEGURIDAD');
    }
  };

  const unlockAdminPortal = () => {
    setIsAdminUnlocked(true);
    setAdminVerifPassword('');
    setAdminUnlockError('');
    playUISound('success');

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    const msg = `ACCESO AUTORIZADO: El usuario ${currentUser?.name} (${currentUser?.role}) ha desbloqueado satisfactoriamente el Panel Administrativo.\n\nFecha: ${dateStr}\nHora: ${timeStr}\nMétodo: Validación de Clave Maestra.`;

    triggerSecurityAlert(`Acceso Autorizado: ${currentUser?.name}`, 'login_alert');
    // Notify only admins that someone entered the secure area
    sendMessage('role:admin', 'Notificación de Acceso: Panel Administrativo', msg, 'security', 'system', 'SISTEMA');
  };

  const updateAdminPanelPassword = (newPass: string, fromSettings: boolean = false) => {
    setAdminPanelPassword(newPass);
    const msg = `La contraseña del panel administrativo ha sido cambiada ${fromSettings ? 'desde los Ajustes' : 'desde el Portal'} por ${currentUser?.name}`;

    triggerSecurityAlert(msg, 'password_change');
    sendMessage('role:admin', 'Seguridad: Clave Maestra Actualizada', msg, 'security', 'system', 'SISTEMA');
    playUISound('success');
  };

  const handleFaceRegister = () => {
    const newFace: FaceRecord = {
      id: Date.now().toString(),
      name: `${userProfile.name} (${faces.length + 1})`,
      dateRegistered: new Date().toLocaleDateString()
    };
    setFaces(prev => [...prev, newFace]);
    setIsCameraOpen(false);
    sendSecurityAlert('face_id_change', 'Se ha registrado un nuevo rostro para acceso biométrico.');
    sendMessage(currentUser.id, 'Biometría', 'Tu rostro biómétrico ha sido registrado con éxito.', 'system');
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    // Also update the global user record for the current user (especially avatar)
    if (currentUser) {
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? {
        ...u,
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar
      } : u));
      // Update currentUser as well since it's the reference for Auth
      setCurrentUser(prev => prev ? {
        ...prev,
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar
      } : null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedUserLogin(null);
    setPasswordInput('');
    setCurrentView('dashboard');
    setIsAdminUnlocked(false);
    setRemoteAdminMode(false);
  };

  // -- ADMIN ACTIONS --
  const handleAdminUpdateUser = (id: string, data: Partial<UserAccount>) => {
    // Protection for admin role
    if (id === 'admin' && data.role && data.role !== 'admin') {
      return;
    }
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));

    // Automatically update the currentUser if they are the ones being edited
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...data } as UserAccount : null);
    }
  };

  const handleRemoteConnect = (targetUserId: string) => {
    const targetUser = allUsers.find(u => u.id === targetUserId);
    if (targetUser && currentUser) {
      const adminName = currentUser.name;
      setCurrentUser(targetUser);
      setIsAdminUnlocked(false);
      setCurrentView('dashboard');
      setRemoteAdminMode(true);

      // We manually add an alert to the target user so it registers the intrusion
      const alert: SecurityAlert = {
        id: Date.now().toString(),
        userId: targetUser.id,
        userName: targetUser.name,
        type: 'login_alert',
        message: `El administrador ${adminName} ha iniciado una sesión remota en tu cuenta.`,
        date: new Date().toLocaleString(),
        read: false
      };
      setSecurityAlerts(prev => [alert, ...prev]);
    }
  };

  const handleAdminDeleteUser = (id: string) => {
    if (id === 'admin') return; // Cannot delete main admin
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar permanentemente a ${user.name}? Se perderán todos sus datos y mensajes.`,
      onConfirm: () => {
        setAllUsers(prev => prev.filter(u => u.id !== id));
        sendMessage(currentUser!.id, 'Administración', `Usuario ${user.name} eliminado del sistema.`, 'security');

        // Auto-logout if the deleted user is the one currently logged in
        if (currentUser?.id === id) {
          handleLogout();
        }
      }
    });
  };

  const handleAdminAddUser = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: Date.now().toString()
    };
    setAllUsers(prev => [...prev, newUser]);
  };

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setTransactions(transactions.map(t =>
        t.id === editingTransaction.id ? { ...transactionData, id: t.id } : t
      ));
      sendMessage(currentUser!.id, 'Movimiento Actualizado', `Se ha editado: ${transactionData.description}`);
    } else {
      const newTransaction: Transaction = {
        ...transactionData,
        id: Date.now().toString()
      };
      setTransactions([newTransaction, ...transactions]);
      sendMessage(currentUser!.id, 'Nuevo Movimiento', `Se ha registrado: ${transactionData.description}`);
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Movimiento',
      message: '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.',
      onConfirm: () => {
        const tx = transactions.find(t => t.id === id);
        setTransactions(transactions.filter(t => t.id !== id));
        setIsTransactionModalOpen(false);
        if (tx) {
          sendMessage(currentUser!.id, 'Movimiento Eliminado', `Has eliminado: ${tx.description}`, 'system');
        }
      }
    });
  };

  const handleSaveCard = (cardData: Omit<CardModel, 'id'>) => {
    if (editingCard) {
      setCards(cards.map(c => c.id === editingCard.id ? { ...cardData, id: c.id } : c));
      sendMessage(currentUser!.id, 'Tarjeta Actualizada', 'La información de la tarjeta ha sido modificada.');
    } else {
      setCards([...cards, { ...cardData, id: Date.now().toString() }]);
      sendMessage(currentUser!.id, 'Tarjeta Añadida', 'Nueva tarjeta guardada en tu billetera.');
    }
    setEditingCard(null);
  };

  const handleDeleteCard = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Tarjeta',
      message: '¿Estás seguro? La tarjeta será eliminada permanentemente.',
      onConfirm: () => {
        setCards(cards.filter(c => c.id !== id));
        setIsCardModalOpen(false);
        sendMessage(currentUser!.id, 'Tarjeta Eliminada', 'La tarjeta ha sido eliminada correctamente.', 'security');
      }
    });
  };

  // Render Helpers
  const renderDashboard = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      {/* GLOBAL SUMMARY HEADER */}
      <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden transition-all hover:shadow-purple-500/20`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-purple-100 font-bold tracking-widest uppercase text-[10px] mb-2">Visión General</p>
              <h1 className="text-4xl font-black tracking-tighter mb-1">Resumen Estadístico</h1>
              <p className="text-indigo-100/80 font-medium">Estado financiero consolidado de todas tus cuentas y ahorros.</p>
            </div>
            <div className="flex bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <div className="text-right">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Saldo Total Consolidado</p>
                <div className="text-3xl font-black tabular-nums">{formatCurrency(financialState.totalRealBalance)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Ingresos</p>
              <p className="text-xl font-bold text-emerald-300">+{formatCurrency(financialState.totalIncome)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Gastos</p>
              <p className="text-xl font-bold text-rose-300">-{formatCurrency(financialState.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Ahorro Generado</p>
              <p className="text-xl font-bold text-blue-300">{formatCurrency(financialState.savingsBag)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Disponible</p>
              <p className={`text-xl font-bold ${financialState.spendableBag < 0 ? 'text-amber-300' : 'text-white'}`}>
                {formatCurrency(financialState.spendableBag)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Header with Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className={`text-2xl font-bold ${appSettings.darkMode ? 'text-white' : 'text-gray-800'}`}>
            {dashboardMode === '5050' ? 'Panel Operativo (50/50)' : 'Panel Financiero Real'}
          </h2>
          <p className={`text-sm ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {dashboardMode === '5050' ? 'Visualizando tu saldo según las reglas de ahorro.' : 'Visualizando la realidad total de tus cuentas bancarias.'}
          </p>
        </div>

        <div className={`flex p-1.5 rounded-xl ${appSettings.darkMode ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
          <button
            onClick={() => setDashboardMode('5050')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${dashboardMode === '5050'
              ? (appSettings.darkMode ? 'bg-gray-700 text-white shadow' : 'bg-gray-100 text-purple-700 shadow-sm')
              : (appSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600')
              }`}
          >
            <LayoutGrid size={16} />
            Modo 50/50
          </button>
          <button
            onClick={() => setDashboardMode('real')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${dashboardMode === 'real'
              ? (appSettings.darkMode ? 'bg-gray-700 text-white shadow' : 'bg-gray-100 text-blue-700 shadow-sm')
              : (appSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600')
              }`}
          >
            <ArrowRightLeft size={16} />
            Saldo Real
          </button>
        </div>
      </div>

      {/* Stats Grid - Dynamic based on Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {dashboardMode === '5050' ? (
          // MODE 50/50: Focus on Spendable and Savings
          <>
            <StatCard
              title="Disponible (Bolsa Gastos)"
              value={formatCurrency(financialState.spendableBag)}
              type={financialState.spendableBag < 0 ? 'negative' : 'neutral'}
              subtitle={financialState.spendableBag < 0 ? "¡Invasión de ahorro!" : "Para gastos operativos"}
              darkMode={appSettings.darkMode}
              icon={<DollarSign size={20} />}
            />
            <StatCard
              title="Ahorro (50% Ingresos)"
              value={formatCurrency(financialState.savingsBag)}
              type="positive"
              subtitle="Intocable"
              darkMode={appSettings.darkMode}
              icon={<TrendingUp size={20} />}
            />
            <StatCard
              title="Gastos del Mes"
              value={formatCurrency(financialState.totalExpenses)}
              type="negative"
              subtitle="Restados de Bolsa Gastos"
              darkMode={appSettings.darkMode}
              icon={<TrendingDown size={20} />}
            />
            <StatCard
              title="Saldo Bancario Total"
              value={formatCurrency(financialState.totalRealBalance)}
              type="neutral"
              subtitle="Referencia Real"
              darkMode={appSettings.darkMode}
              icon={<Wallet size={20} />}
            />
          </>
        ) : (
          // MODE REAL: Focus on Bank Totals
          <>
            <StatCard
              title="Saldo Total Real"
              value={formatCurrency(financialState.totalRealBalance)}
              type="neutral"
              subtitle="Todas las cuentas"
              darkMode={appSettings.darkMode}
              icon={<Wallet size={20} />}
            />
            <StatCard
              title="Ingresos Totales"
              value={formatCurrency(financialState.totalIncome)}
              type="positive"
              darkMode={appSettings.darkMode}
              icon={<TrendingUp size={20} />}
            />
            <StatCard
              title="Gastos Totales"
              value={formatCurrency(financialState.totalExpenses)}
              type="negative"
              darkMode={appSettings.darkMode}
              icon={<TrendingDown size={20} />}
            />
            <StatCard
              title="Patrimonio (Ahorros)"
              value={formatCurrency(financialState.savingsBag)}
              type="neutral"
              subtitle="Acumulado 50%"
              darkMode={appSettings.darkMode}
              icon={<Lock size={20} />}
            />
          </>
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <h3 className={`text-xl font-bold ${appSettings.darkMode ? 'text-white' : 'text-gray-800'}`}>Movimientos Recientes</h3>
        {(currentUser?.role !== 'guest' || remoteAdminMode) && (
          <button
            onClick={() => { setEditingTransaction(null); setIsTransactionModalOpen(true); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${appSettings.darkMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            <Plus size={16} /> Nuevo Movimiento
          </button>
        )}
      </div>

      <div className={`rounded-3xl shadow-sm border overflow-hidden ${appSettings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={appSettings.darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Concepto</th>
                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Categoría</th>
                <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha</th>
                <th className={`px-6 py-4 text-right text-xs font-bold uppercase tracking-wider ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Importe</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${appSettings.darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => {
                    if (currentUser?.role !== 'guest' || remoteAdminMode) {
                      setEditingTransaction(t);
                      setIsTransactionModalOpen(true);
                    }
                  }}
                  className={`group transition-colors ${currentUser?.role !== 'guest' || remoteAdminMode ? 'cursor-pointer' : ''} ${appSettings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${t.type === 'income'
                        ? (appSettings.darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                        : (appSettings.darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-600')
                        }`}>
                        {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <span className={`font-medium ${appSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>{t.description}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${appSettings.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(t.date)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${t.type === 'income'
                    ? (appSettings.darkMode ? 'text-emerald-400' : 'text-emerald-600')
                    : (appSettings.darkMode ? 'text-rose-400' : 'text-rose-600')
                    }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No hay movimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCardsView = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${appSettings.darkMode ? 'text-white' : 'text-gray-800'}`}>Mis Tarjetas</h2>
        {(currentUser?.role !== 'guest' || remoteAdminMode) && (
          <button
            onClick={() => { setEditingCard(null); setIsCardModalOpen(true); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${appSettings.darkMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            <Plus size={16} /> Nueva Tarjeta
          </button>
        )}
      </div>

      <div className="flex justify-start mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-500">
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
            checked={appSettings.showCardData || false}
            onChange={(e) => setAppSettings(prev => ({ ...prev, showCardData: e.target.checked }))}
          />
          Mostrar Datos Reales
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => {
              if (currentUser?.role !== 'guest' || remoteAdminMode) {
                setEditingCard(card);
                setIsCardModalOpen(true);
              }
            }}
            className={`relative h-56 rounded-3xl p-6 flex flex-col justify-between shadow-xl ${currentUser?.role !== 'guest' || remoteAdminMode ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-transform ${card.theme === 'black' ? 'bg-gray-900 text-white' :
              card.theme === 'purple' ? 'bg-purple-600 text-white' :
                card.theme === 'blue' ? 'bg-blue-600 text-white' :
                  'bg-rose-600 text-white'
              }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="opacity-80 text-sm font-medium">{card.alias}</p>
                <p className={`text-2xl font-bold mt-1 tracking-widest ${!appSettings.showCardData ? 'blur-sm select-none transition-all' : ''}`}>**** **** **** {card.last4}</p>
              </div>
              <div className="opacity-80">
                {card.network === 'visa' && <span className="text-lg font-bold italic">VISA</span>}
                {card.network === 'mastercard' && (
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 opacity-80"></div>
                    <div className="w-6 h-6 rounded-full bg-amber-500 opacity-80"></div>
                  </div>
                )}
                {card.network === 'amex' && <span className="text-sm font-bold">AMEX</span>}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Titular</p>
                <p className={`font-medium tracking-wide ${!appSettings.showCardData ? 'blur-sm select-none transition-all' : ''}`}>{card.holder}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-70 uppercase tracking-wider mb-1">Expira</p>
                <p className={`font-medium ${!appSettings.showCardData ? 'blur-sm select-none transition-all' : ''}`}>{card.expiry}</p>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 opacity-20">
              <CreditCard size={100} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWalletView = () => (
    <div className="p-6 animate-in fade-in duration-500">
      <h2 className={`text-2xl font-bold mb-6 ${appSettings.darkMode ? 'text-white' : 'text-gray-800'}`}>Billetera y Cuentas</h2>
      <div className="space-y-4">
        {BANKS.map(bank => (
          <div key={bank.id} className={`p-6 rounded-2xl border flex items-center justify-between ${appSettings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${appSettings.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Wallet className={bank.color} size={24} />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${appSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>{bank.name}</h3>
                <p className={`text-sm ${appSettings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bank.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${appSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(bank.initialBalance)}</p>
              <p className="text-xs text-gray-400">Saldo Inicial</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- LOGIN SCREEN RENDER ---
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${appSettings.darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>

        {/* Camera Component must be rendered here to show up */}
        <CameraScanner
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          mode={cameraMode}
          onVerify={handleFaceVerify}
          onRegister={handleFaceRegister}
          darkMode={false}
        />

        <div className={`w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 ${appSettings.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="h-32 bg-gray-900 flex items-center justify-center">
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
              <Lock className="text-white w-8 h-8" />
            </div>
          </div>

          <div className="p-8">
            <h2 className={`text-2xl font-bold text-center mb-2 ${appSettings.darkMode ? 'text-white' : 'text-gray-800'}`}>Bienvenido</h2>
            <p className="text-gray-400 text-center text-sm mb-8">
              {!selectedUserLogin ? 'Selecciona un usuario' : `Hola, ${selectedUserLogin.name.split(' ')[0]}`}
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {!selectedUserLogin ? (
                <div className="space-y-3">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserLogin(user);
                        setLoginError('');
                      }}
                      className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 ${appSettings.darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className={`font-bold ${appSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-500/10 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xl">
                      {selectedUserLogin.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold ${appSettings.darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUserLogin.name}</div>
                      <button
                        type="button"
                        onClick={() => setSelectedUserLogin(null)}
                        className="text-xs text-purple-500 font-bold hover:underline"
                      >
                        Cambiar Usuario
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="password"
                        autoFocus
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium ${appSettings.darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
                      <AlertCircle size={14} />
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 active:scale-[0.98] transition-all mt-4 border border-transparent"
                  >
                    Entrar
                  </button>

                  {appSettings.faceId && (
                    <button
                      type="button"
                      onClick={startFaceIDLogin}
                      className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${appSettings.darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      <ScanFace size={20} />
                      Acceder con FaceID
                    </button>
                  )}
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className={`min-h-screen transition-colors duration-300 ${appSettings.darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          playUISound('click');
        }}
        onLogout={handleLogout}
        onSettings={() => setIsSettingsOpen(true)}
        onNotifications={() => setIsNotificationsOpen(true)}
        darkMode={appSettings.darkMode}
        userRole={currentUser?.role}
        userAvatar={currentUser?.avatar}
        userName={currentUser?.name}
      />

      <main className="md:ml-20 min-h-screen pb-20 md:pb-0">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'cards' && renderCardsView()}
        {currentView === 'wallet' && renderWalletView()}
        {currentView === 'admin' && (
          <AdminPortal
            isUnlocked={isAdminUnlocked}
            onUnlockAttempt={(pass) => {
              if (pass === adminPanelPassword) {
                unlockAdminPortal();
              } else {
                setAdminUnlockError('Contraseña Incorrecta');
                playUISound('alert');
                const now = new Date();
                const dateStr = now.toLocaleDateString();
                const timeStr = now.toLocaleTimeString();
                const msg = `Intento de acceso FALLIDO al Panel Administrativo.\n\nUsuario: ${currentUser?.name}\nFecha: ${dateStr}\nHora: ${timeStr}\nMétodo: Contraseña Manual\nClave introducida: "${pass}"`;
                triggerSecurityAlert(`Intento fallido de acceso al panel por ${currentUser?.name}`, 'login_alert');
                sendMessage('role:admin', 'URGENTE: Intento de Acceso no Autorizado', msg, 'security', 'system', 'SISTEMA de SEGURIDAD');
              }
            }}
            unlockError={adminUnlockError}
            users={allUsers}
            alerts={securityAlerts}
            onUpdateUser={handleAdminUpdateUser}
            onDeleteUser={handleAdminDeleteUser}
            onAddUser={handleAdminAddUser}
            onMarkAlertAsRead={(id) => setSecurityAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))}
            onDeleteMessage={(id) => setSecurityAlerts(prev => prev.filter(a => a.id !== id))}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onTriggerSecurityAlert={triggerSecurityAlert}
            onPlaySound={playUISound}
            onLockPortal={() => setIsAdminUnlocked(false)}
            darkMode={appSettings.darkMode}
            currentUserRole={currentUser?.role}
            adminPassword={adminPanelPassword}
            currentUserId={currentUser?.id}
            onUpdatePanelPassword={(newPass) => updateAdminPanelPassword(newPass, false)}
            systemSounds={systemSounds}
            onUpdateSystemSounds={setSystemSounds}
            appSettings={appSettings}
            onUpdateSettings={handleUpdateSettings}
            onRemoteConnect={handleRemoteConnect}
          />
        )}
        {currentView === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            financialState={financialState}
            darkMode={appSettings.darkMode}
          />
        )}
        {currentView === 'messages' && (
          <MessagingCenter
            messages={messages}
            currentUser={currentUser!}
            onMarkRead={(id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true, readAt: new Date().toLocaleTimeString() } : m))}
            onSendMessage={(toId, title, content, type, attachments) => sendMessage(toId, title, content, type, currentUser!.id, currentUser!.name, attachments)}
            onDeleteMessage={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
            users={allUsers}
            darkMode={appSettings.darkMode}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={editingTransaction ? () => handleDeleteTransaction(editingTransaction.id) : undefined}
        transactionToEdit={editingTransaction}
        darkMode={appSettings.darkMode}
      />

      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        cardToEdit={editingCard}
        darkMode={appSettings.darkMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdatePassword={handleUpdatePassword}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        settings={appSettings}
        onUpdateSettings={handleUpdateSettings}
        faces={faces}
        onAddFace={() => {
          setIsSettingsOpen(false);
          setCameraMode('register');
          setIsCameraOpen(true);
        }}
        onRemoveFace={(id: string) => {
          setFaces(prev => prev.filter(f => f.id !== id));
          sendMessage(currentUser!.id, 'Biometría', 'Rostro eliminado correctamente.', 'security');
        }}
        darkMode={appSettings.darkMode}
        onLogout={handleLogout}
        userRole={currentUser?.role as any}
        adminPanelPassword={adminPanelPassword}
        onUpdateAdminPanelPassword={(newPass) => updateAdminPanelPassword(newPass, true)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={[]}
        darkMode={appSettings.darkMode}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        darkMode={appSettings.darkMode}
      />

      <CameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        mode={cameraMode}
        onVerify={handleFaceVerify}
        onRegister={handleFaceRegister}
        darkMode={appSettings.darkMode}
      />
    </div>
  );
}