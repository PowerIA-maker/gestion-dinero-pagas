import { UserProfile, AppSettings, FaceRecord } from '@/types';

export interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdatePassword: (newPass: string) => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    faces: FaceRecord[];
    onAddFace: () => void;
    onRemoveFace: (id: string) => void;
    darkMode?: boolean;
    onLogout?: () => void;
    userRole?: 'admin' | 'manager' | 'employee' | 'guest' | 'user';
    adminPanelPassword?: string;
    onUpdateAdminPanelPassword?: (newPass: string) => void;
}
