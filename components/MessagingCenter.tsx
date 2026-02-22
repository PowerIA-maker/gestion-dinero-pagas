import React, { useState } from 'react';
import {
    Mail, Search, Send, Clock,
    Shield, Info, User, CheckCheck,
    ChevronRight, X, Reply, Trash2, Paperclip, FileText, FileImage, File
} from 'lucide-react';
import { AppMessage, UserAccount } from '../types';

interface MessagingCenterProps {
    messages: AppMessage[];
    currentUser: UserAccount;
    onMarkRead: (id: string) => void;
    onSendMessage?: (toId: string, title: string, content: string, type: AppMessage['type'], attachments?: AppMessage['attachments']) => void;
    users?: UserAccount[]; // Only for admins
    darkMode?: boolean;
    onDeleteMessage?: (id: string) => void;
}

export const MessagingCenter: React.FC<MessagingCenterProps> = ({
    messages,
    currentUser,
    onMarkRead,
    onSendMessage,
    users = [],
    darkMode,
    onDeleteMessage
}) => {
    const [selectedMessage, setSelectedMessage] = useState<AppMessage | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [composeData, setComposeData] = useState({ toId: '', title: '', content: '' });
    const [attachedFiles, setAttachedFiles] = useState<AppMessage['attachments']>([]);
    const [viewingAttachment, setViewingAttachment] = useState<AppMessage['attachments'][0] | null>(null);

    const isAdmin = currentUser.role === 'admin';
    const filteredMessages = messages.filter(m =>
        m.toId === currentUser.id ||
        m.toId === 'all' ||
        m.toId === `role:${currentUser.role}` ||
        (isAdmin && m.toId === 'admin')
    );

    const handleOpenMessage = (msg: AppMessage) => {
        setSelectedMessage(msg);
        if (!msg.read) onMarkRead(msg.id);
    };

    const handleSend = () => {
        if (onSendMessage && composeData.toId && composeData.title && composeData.content) {
            onSendMessage(
                composeData.toId,
                composeData.title,
                composeData.content,
                isAdmin ? 'admin_direct' : 'system',
                attachedFiles
            );
            setIsComposing(false);
            setComposeData({ toId: '', title: '', content: '' });
            setAttachedFiles([]);
        }
    };

    const addMockAttachment = (type: 'pdf' | 'img' | 'doc') => {
        const names = {
            pdf: 'Reporte_Mensual_Ahorro.pdf',
            img: 'Captura_Seguridad_Login.png',
            doc: 'Terminos_Servicio_5050.docx'
        };
        setAttachedFiles(prev => [...(prev || []), { name: names[type], type }]);
    };

    const handleDownloadAttachment = (file: AppMessage['attachments'][0]) => {
        // Prototipo: generamos un contenido ficticio basado en el tipo
        let content = '';
        let mimeType = 'text/plain';

        if (file.type === 'pdf') {
            content = `%PDF-1.4\n%... (Contenido simulado de PDF para ${file.name})`;
            mimeType = 'application/pdf';
        } else if (file.type === 'img') {
            content = `(Datos de imagen simulados para ${file.name})`;
            mimeType = 'image/png';
        } else {
            content = `Documento de texto simulado: ${file.name}\nGenerado el: ${new Date().toLocaleString()}`;
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePrintAttachment = () => {
        window.print();
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Centro de Mensajería</h2>
                    <p className="text-sm text-gray-400">Canal oficial de comunicación y seguridad.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setIsComposing(true)}
                        className="px-6 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200"
                    >
                        <Send size={18} /> Redactar
                    </button>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
                {/* Inbox List */}
                <div className={`lg:col-span-1 flex flex-col overflow-hidden rounded-[2.5rem] border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar mensajes..."
                                className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredMessages.length === 0 && (
                            <div className="p-10 text-center text-gray-400 text-sm italic">
                                Buzón de entrada vacío
                            </div>
                        )}
                        {filteredMessages.map(msg => (
                            <button
                                key={msg.id}
                                onClick={() => handleOpenMessage(msg)}
                                className={`w-full p-4 rounded-2xl flex items-start gap-4 transition-all text-left group ${selectedMessage?.id === msg.id
                                    ? (darkMode ? 'bg-purple-600' : 'bg-purple-50')
                                    : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.read ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}>
                                    {msg.type === 'security' ? <Shield size={18} /> : msg.type === 'system' ? <Info size={18} /> : <User size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-black truncate uppercase tracking-tighter ${selectedMessage?.id === msg.id ? (darkMode ? 'text-white' : 'text-purple-700') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                                            {msg.fromName}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{msg.date.split(',')[0]}</span>
                                    </div>
                                    <h4 className={`text-sm font-bold truncate ${selectedMessage?.id === msg.id ? 'text-white' : (darkMode ? 'text-white' : 'text-gray-900')}`}>
                                        {msg.title}
                                    </h4>
                                    <p className={`text-xs truncate ${selectedMessage?.id === msg.id ? 'text-white/70' : 'text-gray-400'}`}>
                                        {msg.content}
                                    </p>
                                </div>
                                {!msg.read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 right-4 animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message Detail */}
                <div className={`lg:col-span-2 flex flex-col rounded-[2.5rem] border overflow-hidden ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                    {selectedMessage ? (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white overflow-hidden shadow-lg">
                                        {users.find(u => u.id === selectedMessage.fromId)?.avatar ? (
                                            <img src={users.find(u => u.id === selectedMessage.fromId)?.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold">{selectedMessage.fromName.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedMessage.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span className="font-bold text-blue-500 uppercase">{selectedMessage.fromName}</span>
                                            <span>•</span>
                                            <span>{selectedMessage.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {selectedMessage.fromId === currentUser.id && (
                                        <div className="flex flex-col items-end mr-2">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                                <CheckCheck size={12} /> {selectedMessage.read ? 'Leído' : 'Enviado'}
                                            </div>
                                            {selectedMessage.readAt && (
                                                <span className="text-[9px] text-gray-400 mt-0.5">{selectedMessage.readAt}</span>
                                            )}
                                        </div>
                                    )}
                                    {onDeleteMessage && (
                                        <button
                                            onClick={() => {
                                                onDeleteMessage(selectedMessage.id);
                                                setSelectedMessage(null);
                                            }}
                                            className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-10 flex-1 overflow-y-auto">
                                <div className={`text-lg leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {selectedMessage.content}
                                </div>

                                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                    <div className="mt-8 space-y-3">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Archivos Adjuntos ({selectedMessage.attachments.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedMessage.attachments.map((file, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setViewingAttachment(file)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl ${file.type === 'pdf' ? 'bg-rose-100 text-rose-600' : file.type === 'img' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            {file.type === 'pdf' ? <FileText size={18} /> : file.type === 'img' ? <FileImage size={18} /> : <File size={18} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className={`text-xs font-bold truncate max-w-[150px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{file.name}</div>
                                                            <div className="text-[10px] text-gray-400 uppercase">{file.type}</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-12 p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm mb-2">
                                        <Shield size={16} /> Verificación de Seguridad
                                    </div>
                                    <p className="text-xs text-blue-500/70">
                                        Este mensaje ha sido verificado criptográficamente y enviado por el sistema central de Mi Cartera 50/50.
                                    </p>
                                </div>
                            </div>

                            {isAdmin && selectedMessage.fromId !== currentUser.id && (
                                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => {
                                            setComposeData({ toId: selectedMessage.fromId, title: `Re: ${selectedMessage.title}`, content: '' });
                                            setIsComposing(true);
                                        }}
                                        className="w-full py-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-2"
                                    >
                                        <Reply size={18} /> Responder a Usuario
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10">
                            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 text-gray-300">
                                <Mail size={40} />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Selecciona un mensaje</h3>
                            <p className="text-gray-400 max-w-xs">
                                Haz clic en cualquier mensaje de la lista para ver su contenido completo.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Modal (Admin only) */}
            {isComposing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
                    <div className={`w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                            <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Redactar Mensaje</h3>
                            <button
                                onClick={() => setIsComposing(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Destinatario</label>
                                <select
                                    value={composeData.toId}
                                    onChange={e => setComposeData({ ...composeData, toId: e.target.value })}
                                    className={`w-full p-4 rounded-2xl border outline-none font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                                >
                                    <option value="">Selecciona un usuario...</option>
                                    <option value="all">Todos los Usuarios (Broadcast)</option>
                                    <optgroup label="Por Puesto / Rol">
                                        <option value="role:manager">Solo Managers</option>
                                        <option value="role:employee">Solo Empleados</option>
                                        <option value="role:guest">Solo Invitados</option>
                                        <option value="role:user">Solo Usuarios Estándar</option>
                                    </optgroup>
                                    <optgroup label="Usuarios Individuales">
                                        {users.filter(u => u.role !== 'admin').map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Asunto del Mensaje</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Actualización de Seguridad Crítica"
                                    value={composeData.title}
                                    onChange={e => setComposeData({ ...composeData, title: e.target.value })}
                                    className={`w-full p-4 rounded-2xl border outline-none font-bold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contenido</label>
                                <textarea
                                    rows={6}
                                    placeholder="Escribe el mensaje detallado aquí..."
                                    value={composeData.content}
                                    onChange={e => setComposeData({ ...composeData, content: e.target.value })}
                                    className={`w-full p-4 rounded-2xl border outline-none resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Añadir Documentos Simulados</label>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => addMockAttachment('pdf')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                        <FileText size={14} className="text-rose-500" /> + PDF
                                    </button>
                                    <button onClick={() => addMockAttachment('img')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                        <FileImage size={14} className="text-blue-500" /> + Imagen
                                    </button>
                                    <button onClick={() => addMockAttachment('doc')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                                        <Paperclip size={14} className="text-indigo-500" /> + Manual
                                    </button>
                                </div>
                                {attachedFiles && attachedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {attachedFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold">
                                                <span>{f.name}</span>
                                                <button onClick={() => setAttachedFiles(prev => prev?.filter((_, idx) => idx !== i))} className="hover:text-rose-400">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={!composeData.toId || !composeData.title || !composeData.content}
                                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:hover:scale-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Send size={24} /> Enviar Mensaje Oficial
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Attachment Viewer */}
            {viewingAttachment && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-6 md:p-12">
                    <div className="flex flex-col items-center max-w-4xl w-full">
                        <div className="w-full flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${viewingAttachment.type === 'pdf' ? 'bg-rose-500' : viewingAttachment.type === 'img' ? 'bg-blue-500' : 'bg-indigo-500'} text-white shadow-xl`}>
                                    {viewingAttachment.type === 'pdf' ? <FileText size={24} /> : viewingAttachment.type === 'img' ? <FileImage size={24} /> : <File size={24} />}
                                </div>
                                <div className="text-white">
                                    <div className="text-lg font-black">{viewingAttachment.name}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-tighter">Documento Verificado</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingAttachment(null)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="w-full bg-white dark:bg-gray-800 rounded-[3rem] min-h-[50vh] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500 overflow-hidden shadow-2xl border border-white/10">
                            {viewingAttachment.type === 'img' ? (
                                <div className="space-y-6">
                                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500">
                                        <FileImage size={40} />
                                    </div>
                                    <h4 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Vista Previa de Imagen</h4>
                                    <p className="text-gray-400 max-w-sm">Aquí se mostraría la previsualización del archivo de imagen adjunto.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${viewingAttachment.type === 'pdf' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                        {viewingAttachment.type === 'pdf' ? <FileText size={40} /> : <File size={40} />}
                                    </div>
                                    <h4 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Visualizador de {viewingAttachment.type.toUpperCase()}</h4>
                                    <p className="text-gray-400 max-w-sm">Este es un visualizador seguro de documentos para Mi Cartera 50/50.</p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleDownloadAttachment(viewingAttachment)}
                                            className="px-8 py-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                                        >
                                            Descargar
                                        </button>
                                        <button
                                            onClick={handlePrintAttachment}
                                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20"
                                        >
                                            Imprimir
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
