import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ShieldAlert, CheckCircle, ScanFace } from 'lucide-react';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onVerify: (success: boolean) => void;
  onRegister: () => void;
  darkMode?: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  isOpen,
  onClose,
  mode,
  onVerify,
  onRegister,
  darkMode
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setScanning(true);
    } else {
      stopCamera();
      setScanning(false);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isOpen && scanning && !error) {
      // Simulamos un tiempo de procesamiento de imagen
      timeout = setTimeout(() => {
        if (mode === 'login') {
          // En una app real aquí iría la lógica de comparación de biometría
          // Para este prototipo, simulamos éxito automático
          onVerify(true);
        } else {
          onRegister();
        }
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isOpen, scanning, error, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[120] flex flex-col items-center justify-center animate-in fade-in duration-300">

      {/* Header overlay */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-bold tracking-wider uppercase">Escaneo Biométrico</span>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
          <X size={24} />
        </button>
      </div>

      {/* Main Camera View */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
            <ShieldAlert size={48} className="text-red-500 mb-4" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {/* Scanning Overlay UI */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Face Frame */}
              <div className="w-64 h-64 border-2 border-white/30 rounded-[3rem] relative overflow-hidden">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-2xl"></div>

                {/* Scanning Line */}
                <div className="absolute inset-x-0 h-1 bg-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

            {/* Status Text */}
            <div className="absolute bottom-10 inset-x-0 text-center pointer-events-none">
              <p className="text-white font-mono text-xs bg-purple-600/80 inline-block px-6 py-2 rounded-full backdrop-blur-md animate-pulse">
                {mode === 'login' ? 'VERIFICANDO IDENTIDAD...' : 'CAPTURANDO DATOS BIOMÉTRICOS...'}
              </p>
              <p className="text-white/50 text-[10px] mt-2 uppercase tracking-tighter">Por favor, mantenga el rostro frente a la cámara</p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};