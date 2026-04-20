
export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  photoUrl?: string;
  fatherName?: string;
  motherName?: string;
  maritalStatus?: 'Solteiro' | 'Casado' | 'Viúvo' | 'Divorciado' | 'União Estável';
  address: string;
  neighborhood?: string;
  city?: string;
  baptismDate?: string;
  receptionDate?: string;
  receptionType?: 'Batismo' | 'Aclamação' | 'Transferência';
  status: 'Ativo' | 'Em Observação' | 'Ausente' | 'Transferido' | 'Falecido';
  previousChurch?: string;
  role: 'Membro' | 'Liderança' | 'Diácono' | 'Pastor' | 'Professor EBD' | 'Porteiro' | 'Músico' | 'Tesoureiro 1' | 'Tesoureiro 2' | 'Conselho Fiscal 1' | 'Conselho Fiscal 2' | 'Conselho Fiscal 3' | 'Secretaria 1' | 'Secretaria 2' | 'Superentendente';
  ministries?: string[];
  spiritualGifts?: string;
  lastAttendance?: string;
  attendanceRate?: number;
  username?: string;
  password?: string;
  permissions?: 'admin' | 'editor' | 'viewer';
}

export interface AppUser {
  uid: string;
  email: string;
  type: 'firebase' | 'master' | 'member';
  displayName?: string;
  permissions?: 'admin' | 'editor' | 'viewer';
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'Banco' | 'Tesouraria';
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  pixKey?: string;
  pixHolder?: string;
  initialBalance: number;
  description?: string;
}

export interface Transaction {
  id: string;
  type: 'Entrada' | 'Saída';
  category: string;
  amount: number;
  date: string;
  description: string;
  contributorName?: string;
  paymentMethod: 'Dinheiro' | 'Pix' | 'Cartão Crédito' | 'Débito' | 'Boleto' | 'Transferência' | 'Cheque';
  bankAccount: string;
  attachmentUrl?: string;
  closingStatus?: 'Aberto' | 'Fechado';
  closingId?: string;
  isReconciled?: boolean;
}

export interface ChurchEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'Culto' | 'Reunião' | 'Social' | 'EBD' | 'Destaque';
  location: string;
  description?: string;
  bannerUrl?: string;
  roster?: RosterItem[];
  linkedProjectId?: string;
}

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  series?: string;
  thumbnail?: string;
}

export interface Quote {
  text: string;
  author: string;
  source?: string;
  type: 'Bible' | 'Theology';
}

export interface SocialProjectItem {
  imageUrl: string;
  verse: string;
  verseReference: string;
  registeredAt: number;
}

export interface SocialProject {
  id: string;
  title: string;
  date: string;
  description: string;
  location?: string;
  bannerUrl?: string;
  status: 'Planejamento' | 'Realizado';
  gallery: SocialProjectItem[];
  showInCalendar?: boolean;
  linkedEventId?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  acquisitionDate: string;
  value: number;
  quantity: number;
  condition: string;
  status: string;
  location: string;
  photoUrl?: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  date: string;
  description: string;
  cost: number;
  provider: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImageUrl?: string;
  nextEventTitle: string;
  nextEventDate: string;
  nextEventTime: string;
  nextEventDescription: string;
  nextEventLocation: string;
  nextEventBannerUrl?: string;
  youtubeLiveLink: string;
  socialProjectTitle?: string;
  socialProjectDescription?: string;
  socialProjectItems?: SocialProjectItem[];
}

export enum PageView {
  PUBLIC_HOME = 'PUBLIC_HOME',
  PUBLIC_ABOUT = 'PUBLIC_ABOUT',
  PUBLIC_SOCIAL = 'PUBLIC_SOCIAL',
  PUBLIC_CONTACT = 'PUBLIC_CONTACT',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_MEMBERS = 'ADMIN_MEMBERS',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
  ADMIN_CALENDAR = 'ADMIN_CALENDAR',
  ADMIN_SOCIAL = 'ADMIN_SOCIAL',
  ADMIN_SITE_CONTENT = 'ADMIN_SITE_CONTENT',
  ADMIN_RESOURCES = 'ADMIN_RESOURCES',
}

export interface RosterItem {
  memberId: string;
  memberName: string;
  role: string;
  photoUrl?: string;
}
