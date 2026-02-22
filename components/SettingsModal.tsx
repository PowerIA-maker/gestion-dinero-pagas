import React, { useState, useEffect, useRef } from 'react';
import {
    X, Check, AlertCircle, User, Bell,
    Moon, Shield, HelpCircle, ChevronRight, LogOut,
    Smartphone, Mail, Volume2, Camera,
    MessageSquare, Send, Bot, Loader2, Trash2, ScanFace, Plus
} from 'lucide-react';
import { UserProfile, AppSettings } from '../types';
import { SettingsModalProps } from './SettingsModalProps';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

type SettingsTab = 'main' | 'security' | 'account' | 'preferences' | 'help' | 'chat';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    onUpdatePassword,
    userProfile,
    onUpdateProfile,
    settings,
    onUpdateSettings,
    faces,
    onAddFace,
    onRemoveFace,
    darkMode,
    onLogout,
    userRole,
    adminPanelPassword,
    onUpdateAdminPanelPassword
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('main');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    // Admin Panel Password State
    const [newAdminPass, setNewAdminPass] = useState('');
    const [confirmAdminPass, setConfirmAdminPass] = useState('');
    const [adminPassError, setAdminPassError] = useState('');
    const [adminPassSuccess, setAdminPassSuccess] = useState('');

    // Account Edit State
    const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatSessionRef = useRef<ChatSession | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Reset states when opening
    useEffect(() => {
        if (isOpen) {
            setActiveTab('main');
            setTempProfile(userProfile);
            setPassError('');
            setPassSuccess('');
            setNewPassword('');
            setConfirmPassword('');
            setNewAdminPass('');
            setConfirmAdminPass('');
            setAdminPassError('');
            setAdminPassSuccess('');
        }
    }, [isOpen, userProfile]);

    useEffect(() => {
        if (activeTab === 'chat' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    if (!isOpen) return null;

    // --- HANDLERS ---
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');

        if (newPassword.length < 4) {
            setPassError('La contraseña debe tener al menos 4 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassError('Las contraseñas no coinciden');
            return;
        }

        onUpdatePassword(newPassword);
        setPassSuccess('Contraseña actualizada correctamente');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(tempProfile);
        setActiveTab('main');
    };

    const toggleSetting = (key: keyof AppSettings) => {
        onUpdateSettings({
            ...settings,
            [key]: !settings[key]
        });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempProfile(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // --- CHAT LOGIC ---
    const initChat = () => {
        setActiveTab('chat');
        if (!chatSessionRef.current) {
            // Initial Greeting
            setChatMessages([
                { role: 'model', text: `Hola ${userProfile.name.split(' ')[0]}, soy el asistente virtual de Mi Cartera 2026. ¿En qué puedo ayudarte hoy sobre tus finanzas o el método 50/50?` }
            ]);

            try {
                // Corregimos el tipado de la API Key para que no de error
                const apiKey: string = (import.meta as any).env?.VITE_GEMINI_API_KEY || 'AIzaSyDMfb5iUdOFFtDraVy-k84tf6yje1FoqYQ';

                // Usamos el nombre correcto que importamos arriba
                const genAI = new GoogleGenerativeAI(apiKey);

                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                });

                chatSessionRef.current = model.startChat({
                    generationConfig: {
                        maxOutputTokens: 1000,
                    },
                    systemInstruction: {
                        role: 'system',
                        parts: [{
                            text: `
        Eres el soporte técnico y asesor financiero de la app "Mi Cartera 2026", pero también un asistente personal de inteligencia artificial de propósito general.
        
        REGLAS DE NEGOCIO DE LA APP (IMPORTANTE):
        1. Método 50/50: La app divide automáticamente cada INGRESO en dos mitades iguales.
           - 50% Bolsa de Ahorro: Dinero intocable para el futuro.
           - 50% Bolsa de Gastos: Dinero operativo para el mes.
        2. Los GASTOS se restan ÚNICAMENTE de la "Bolsa de Gastos".
        3. Si un gasto supera lo que hay en la Bolsa de Gastos, ocurre una "Invasión de Ahorro" (alerta roja).
        4. La app permite gestión multi-banco y pagos en efectivo.
        
        TU PERSONALIDAD Y CAPACIDADES:
        - Eres amable, profesional y conciso.
        - Explicas los conceptos financieros de forma sencilla.
        - IMPORTANTE: PUEDES RESPONDER A CUALQUIER TIPO DE PREGUNTA. Si te preguntan algo fuera de finanzas o educación financiera, responde con normalidad y ofrece la mejor asistencia posible. No tienes restricciones de tema.
        - Usa emojis ocasionalmente para ser amigable.
      `}]
                    },
                });

            } catch (error) {
                console.error("Error al iniciar Gemini:", error);
                setChatMessages(prev => [...prev, { role: 'model', text: 'Error de conexión con el servicio de IA. Por favor verifica tu conexión.' }]);
            }
        }
    };

    async function handleSendMessage(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!chatInput.trim() || isChatLoading || !chatSessionRef.current) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsChatLoading(true);

        try {
            const result = await chatSessionRef.current.sendMessage(userMsg);
            const responseText = result.response.text();
            setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            console.error("Chat Error", error);
            setChatMessages(prev => [...prev, { role: 'model', text: 'Lo siento, tuve un problema al procesar tu solicitud. Intenta de nuevo.' }]);
        } finally {
            setIsChatLoading(false);
        }
    }

    // --- COMPONENTS ---
    const renderHeader = (title: string, backAction?: () => void) => (
        <div className={`flex justify-between items-center p-6 border-b sticky top-0 z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3">
                {backAction && (
                    <button onClick={backAction} className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'}`}>
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                )}
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
            </div>
            <button onClick={onClose} className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={24} />
            </button>
        </div>
    );

    const SettingsItem = ({ icon, label, subLabel, onClick, color }: any) => (
        <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                <div className="text-left">
                    <div className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{label}</div>
                    {subLabel && <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{subLabel}</div>}
                </div>
            </div>
            <ChevronRight size={20} className={`${darkMode ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-300 group-hover:text-gray-500'}`} />
        </button>
    );

    const ToggleItem = ({ label, isOn, onToggle, icon }: any) => (
        <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {icon}
                </div>
                <span className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{label}</span>
            </div>
            <button
                onClick={onToggle}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isOn ? 'bg-green-500' : (darkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
            >
                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    // --- TAB: MAIN ---
    if (activeTab === 'main') {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {renderHeader('Ajustes')}
                    <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar">

                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Cuenta</div>

                        <div
                            onClick={() => setActiveTab('account')}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors group cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-blue-200 transition-all">
                                    {userProfile.avatar ? (
                                        <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userProfile.name || 'Usuario'}</div>
                                    <div className="text-xs text-gray-400">{userProfile.email}</div>
                                </div>
                            </div>
                            <ChevronRight size={20} className={`${darkMode ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-300 group-hover:text-gray-500'}`} />
                        </div>

                        <SettingsItem
                            icon={<Shield size={20} />}
                            label="Seguridad"
                            subLabel="Contraseña, FaceID"
                            color={darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600"}
                            onClick={() => setActiveTab('security')}
                        />

                        <div className="px-4 py-2 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Preferencias</div>
                        <SettingsItem
                            icon={<Bell size={20} />}
                            label="Preferencias App"
                            subLabel="Notificaciones, Sonido, Tema"
                            color={darkMode ? "bg-rose-900/30 text-rose-400" : "bg-rose-100 text-rose-600"}
                            onClick={() => setActiveTab('preferences')}
                        />

                        <div className="px-4 py-2 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Soporte</div>
                        <SettingsItem
                            icon={<HelpCircle size={20} />}
                            label="Ayuda"
                            subLabel="FAQ y contacto"
                            color={darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600"}
                            onClick={() => setActiveTab('help')}
                        />

                        <div className={`mt-6 border-t pt-4 px-2 pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <button
                                onClick={() => {
                                    if (onLogout) {
                                        onClose();
                                        onLogout();
                                    }
                                }}
                                className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'}`}
                            >
                                <LogOut size={18} /> Cerrar Sesión
                            </button>
                            <div className="text-center text-xs text-gray-500 mt-4">
                                Versión 2.5.0 (Build 2026)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TAB: ACCOUNT ---
    if (activeTab === 'account') {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {renderHeader('Editar Perfil', () => setActiveTab('main'))}

                    <form onSubmit={handleProfileSave} className="p-6 space-y-5 overflow-y-auto">
                        <div className="flex justify-center mb-6">
                            <div
                                onClick={handleImageClick}
                                className={`w-28 h-28 rounded-full flex items-center justify-center relative cursor-pointer group overflow-hidden border-4 shadow-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-white'}`}
                            >
                                {tempProfile.avatar ? (
                                    <img src={tempProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-gray-400" />
                                )}

                                {/* Overlay for hover */}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" size={24} />
                                </div>

                                <button type="button" className="absolute bottom-1 right-1 p-2 bg-purple-600 rounded-full text-white shadow-lg hover:bg-purple-700 transition-colors z-10">
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <span className="text-lg font-bold pb-1">+</span>
                                    </div>
                                </button>
                            </div>
                            {/* Hidden Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={tempProfile.name}
                                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                                    className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={tempProfile.email}
                                    onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                                    className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono</label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    required
                                    value={tempProfile.phone}
                                    onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                                    className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                                <Check size={18} /> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- TAB: PREFERENCES ---
    if (activeTab === 'preferences') {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {renderHeader('Preferencias', () => setActiveTab('main'))}
                    <div className="p-4 space-y-2">
                        <ToggleItem
                            label="Notificaciones Push"
                            isOn={settings.notifications}
                            onToggle={() => toggleSetting('notifications')}
                            icon={<Bell size={20} />}
                        />
                        <ToggleItem
                            label="Modo Oscuro"
                            isOn={settings.darkMode}
                            onToggle={() => toggleSetting('darkMode')}
                            icon={<Moon size={20} />}
                        />
                        <ToggleItem
                            label="Sonidos App"
                            isOn={settings.sound}
                            onToggle={() => toggleSetting('sound')}
                            icon={<Volume2 size={20} />}
                        />
                    </div>
                    <div className="p-6 text-center text-xs text-gray-400">
                        Estas configuraciones se guardan automáticamente.
                    </div>
                </div>
            </div>
        );
    }

    // --- TAB: SECURITY ---
    if (activeTab === 'security') {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {renderHeader('Seguridad', () => setActiveTab('main'))}

                    <div className="p-6 space-y-6 overflow-y-auto">
                        {/* FaceID Section */}
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <ScanFace size={16} />
                                    </div>
                                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face ID / Touch ID</span>
                                </div>
                                <button
                                    onClick={() => toggleSetting('faceId')}
                                    className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${settings.faceId ? 'bg-green-500' : (darkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.faceId ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed mb-4">Permitir acceso biométrico para iniciar sesión sin contraseña.</p>

                            {settings.faceId && (
                                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <h5 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rostros Registrados</h5>

                                    {faces.length === 0 ? (
                                        <div className="text-center py-4 text-xs text-gray-500 italic">
                                            No hay rostros guardados
                                        </div>
                                    ) : (
                                        <div className="space-y-2 mb-4">
                                            {faces.map(face => (
                                                <div key={face.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                            <User size={14} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{face.name}</div>
                                                            <div className="text-[10px] text-gray-400">{face.dateRegistered}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => onRemoveFace(face.id)}
                                                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={onAddFace}
                                        className={`w-full py-2.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-bold transition-all ${darkMode ? 'border-gray-600 text-gray-400 hover:border-emerald-500 hover:text-emerald-500' : 'border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'}`}
                                    >
                                        <Plus size={16} /> Registrar Nuevo Rostro
                                    </button>
                                </div>
                            )}
                        </div>

                        {(userRole === 'admin' || userRole === 'manager') && (
                            <>
                                <div className={`border-t my-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Cambiar Contraseña</h4>

                                    {passError && (
                                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <span>{passError}</span>
                                        </div>
                                    )}

                                    {passSuccess && (
                                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl flex items-center gap-2">
                                            <Check size={16} />
                                            <span>{passSuccess}</span>
                                        </div>
                                    )}

                                    <div>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            placeholder="Nueva contraseña"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            placeholder="Confirmar contraseña"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={`w-full py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-600 text-white' : 'bg-gray-900 text-white'}`}
                                    >
                                        <Check size={18} /> Actualizar
                                    </button>
                                </form>
                            </>
                        )}

                        {/* Admin Panel Password Logic - ONLY FOR ADMINS */}
                        {(userRole === 'admin') && (
                            <>
                                <div className={`border-t my-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setAdminPassError('');
                                        setAdminPassSuccess('');
                                        if (newAdminPass.length < 4) {
                                            setAdminPassError('La contraseña debe tener al menos 4 caracteres');
                                            return;
                                        }
                                        if (newAdminPass !== confirmAdminPass) {
                                            setAdminPassError('Las contraseñas no coinciden');
                                            return;
                                        }
                                        onUpdateAdminPanelPassword?.(newAdminPass);
                                        setAdminPassSuccess('Contraseña del Panel actualizada');
                                        setNewAdminPass('');
                                        setConfirmAdminPass('');
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Contraseña del Panel Admin</h4>
                                        <div className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-black uppercase">Exclusivo Admin</div>
                                    </div>
                                    <p className="text-xs text-gray-500">Esta contraseña protege el acceso al panel administrativo y es independiente de tu clave de usuario.</p>

                                    {adminPassError && (
                                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                            <span>{adminPassError}</span>
                                        </div>
                                    )}

                                    {adminPassSuccess && (
                                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl flex items-center gap-2">
                                            <Check size={16} />
                                            <span>{adminPassSuccess}</span>
                                        </div>
                                    )}

                                    <div>
                                        <input
                                            type="password"
                                            value={newAdminPass}
                                            onChange={(e) => setNewAdminPass(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            placeholder="Nueva contraseña del panel"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="password"
                                            value={confirmAdminPass}
                                            onChange={(e) => setConfirmAdminPass(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            placeholder="Confirmar contraseña del panel"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-xl font-bold bg-amber-500 text-white shadow-lg hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Shield size={18} /> Actualizar Panel
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- TAB: HELP ---
    if (activeTab === 'help') {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {renderHeader('Ayuda', () => setActiveTab('main'))}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Preguntas Frecuentes</h3>

                        <div className="space-y-4">
                            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>¿Cómo funciona el método 50/50?</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Cada ingreso se divide automáticamente: 50% para ahorro (intocable) y 50% para gastos operativos.
                                </p>
                            </div>
                            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>¿Qué pasa si gasto más de mi 50%?</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    El sistema te alertará de que estás invadiendo tu bolsa de ahorros, afectando tu salud financiera.
                                </p>
                            </div>
                            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>¿Son seguros mis datos?</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Sí, todos los datos se almacenan localmente en tu dispositivo para máxima privacidad.
                                </p>
                            </div>
                        </div>

                        <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <button
                                onClick={initChat}
                                className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                            >
                                <MessageSquare size={18} /> Contactar Soporte (IA)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TAB: CHAT (AI SUPPORT) ---
    if (activeTab === 'chat') {
        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[85vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {renderHeader('Soporte Inteligente', () => setActiveTab('help'))}

                    {/* Chat Area */}
                    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : (darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-white border border-gray-100 text-gray-800') + ' rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.role === 'model' && (
                                        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-purple-500">
                                            <Bot size={14} /> Soporte
                                        </div>
                                    )}
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className={`border p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <Loader2 size={16} className="animate-spin text-purple-500" />
                                    <span className="text-xs text-gray-400">Escribiendo...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Escribe tu consulta..."
                                className={`w-full pl-4 pr-12 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-purple-200 outline-none placeholder:text-gray-400 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim() || isChatLoading}
                                className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return null;
};