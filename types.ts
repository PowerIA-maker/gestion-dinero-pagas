

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  bankAccount: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  initialBalance: number; // To simulate previous history not in current transaction list
  color: string;
}

export interface CardModel {
  id: string;
  alias: string;
  last4: string;
  holder: string;
  expiry: string;
  theme: 'black' | 'purple' | 'blue' | 'rose';
  network: 'visa' | 'mastercard' | 'amex';
}

export interface AppNotification {
  id: number;
  title: string;
  msg: string;
  time: string;
  type: 'warning' | 'success' | 'info';
  read: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar?: string; // Base64 string for the image
}

export interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  sound: boolean;
  faceId: boolean;
  showCardData?: boolean;
}

export interface FaceRecord {
  id: string;
  name: string;
  dateRegistered: string;
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'guest' | 'user';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
}

export interface SecurityAlert {
  id: string;
  userId: string;
  userName: string;
  type: 'password_change' | 'face_id_change' | 'login_alert' | 'role_change' | 'test_alert';
  message: string;
  date: string;
  read: boolean;
}

export interface AppMessage {
  id: string;
  fromId: string;
  fromName: string;
  toId: string; // 'all' or specific userId or 'role:roleName'
  title: string;
  content: string;
  date: string;
  read: boolean;
  readAt?: string;
  type: 'security' | 'system' | 'admin_direct';
  attachments?: {
    name: string;
    type: 'pdf' | 'img' | 'doc';
  }[];
}

export interface FinancialState {
  totalRealBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savingsBag: number; // 50% of all income
  spendableBag: number; // 50% of all income - expenses
  isSavingsInvaded: boolean;
}

export const CATEGORIES = [
  'Nómina',
  'Ventas',
  'Inversiones',
  'Compras',
  'Transporte',
  'Dietas, viajes y eventos',
  'Hogar',
  'Suscripciones',
  'Sin Categoría'
];

export const BANKS: BankAccount[] = [
  { id: 'santander', name: 'Banco Santander', type: 'CUENTA CHECKING', initialBalance: 300000, color: 'text-red-600' },
  { id: 'caixabank', name: 'Caixabank', type: 'Cuenta Corriente empresa 1', initialBalance: 140000, color: 'text-blue-600' },
  { id: 'cash', name: 'Efectivo / Otros', type: 'Caja menor', initialBalance: 500, color: 'text-green-600' },
];