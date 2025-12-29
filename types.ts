
export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  photoUrl?: string;
  
  // Dados Pessoais Expandidos
  fatherName?: string;
  motherName?: string;
  maritalStatus?: 'Solteiro' | 'Casado' | 'Viúvo' | 'Divorciado' | 'União Estável';
  address: string;
  neighborhood?: string; // Bairro separado para relatórios
  city?: string;

  // Dados Espirituais
  baptismDate?: string;
  receptionDate?: string;
  receptionType?: 'Batismo' | 'Aclamação' | 'Transferência';
  status: 'Ativo' | 'Em Observação' | 'Ausente' | 'Transferido' | 'Falecido';
  previousChurch?: string;
  
  // Áreas de Serviço
  role: 'Membro' | 'Liderança' | 'Diácono' | 'Pastor' | 'Professor EBD' | 'Porteiro' | 'Músico';
  ministries?: string[]; // Lista de ministérios que participa
  spiritualGifts?: string; // Texto livre para dons/talentos

  // Controle de Frequência (Simplificado)
  lastAttendance?: string; // Data da última presença
  attendanceRate?: number; // 0-100% (Mockado ou calculado)

  // Auth
  username?: string;
  password?: string;
  permissions?: 'admin' | 'editor' | 'viewer';
}

export interface AppUser {
  uid: string;
  email: string;
  type: 'firebase' | 'master' | 'member';
  displayName?: string;
  permissions?: 'admin' | 'editor' | 'viewer'; // Added for context logic
}

export interface BankAccount {
  id: string;
  name: string; // "Banco do Brasil", "Tesouraria Principal"
  type: 'Banco' | 'Tesouraria';
  
  // Campos Bancários
  bankName?: string; // "Banco do Brasil", "Nubank", etc
  agency?: string;
  accountNumber?: string;
  pixKey?: string;
  pixHolder?: string; // Nome do titular do Pix
  
  // Controle
  initialBalance: number;
  description?: string;
}

export interface Transaction {
  id: string;
  type: 'Entrada' | 'Saída';
  category: string; // e.g., "Dízimo", "Oferta", "Manutenção", "Construção"
  amount: number;
  date: string;
  description: string;
  contributorName?: string; // Optional for anonymous offerings
  
  // New Accounting Fields
  paymentMethod: 'Dinheiro' | 'Pix' | 'Cartão Crédito' | 'Débito' | 'Boleto' | 'Transferência' | 'Cheque';
  bankAccount: string; // Agora é uma string dinâmica ligada ao BankAccount.name
  attachmentUrl?: string; // URL for receipts/invoices
  
  // Controle de Fechamento
  closingStatus?: 'Aberto' | 'Fechado'; // Controla se já foi auditado
  closingId?: string; // Link para o borderô
  
  // Conciliação Bancária
  isReconciled?: boolean; // Se true, o valor já bateu com o extrato bancário
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  description: string;
  cost: number;
  provider: string; // Quem realizou o serviço
  financeTransactionId?: string; // Link para a transação financeira se gerada
}

export interface Asset {
  id: string;
  name: string;
  category: 'Móveis' | 'Som' | 'Instrumentos' | 'Eletrônicos' | 'Literatura' | 'Outros';
  acquisitionDate: string;
  value: number; // Unit Value
  quantity: number; // New Field
  condition: 'Novo' | 'Bom' | 'Regular' | 'Ruim' | 'Em Manutenção';
  status: 'Disponível' | 'Emprestado' | 'Em Manutenção';
  location: string;
  photoUrl?: string;
  
  // Controle de Empréstimo Ativo
  currentLoan?: {
    memberId: string;
    memberName: string;
    loanDate: string;
    expectedReturnDate: string;
  };

  // Histórico
  maintenanceHistory?: MaintenanceRecord[];
}

export interface RosterItem {
  memberId: string;
  memberName: string;
  role: string; // e.g. "Pregação", "Louvor", "Recepção"
  photoUrl?: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string;
  type: 'Culto' | 'Reunião' | 'Social' | 'EBD';
  location: string;
  description?: string;
  bannerUrl?: string; // New field for event banner
  roster?: RosterItem[]; // New field for Event Roster
}

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  series?: string;
  thumbnail: string;
  videoUrl?: string;
}

export interface SocialProjectItem {
  imageUrl: string;
  verse: string;
  verseReference: string;
}

export interface SocialProject {
  id: string;
  title: string;
  date: string;
  description: string;
  location?: string;
  bannerUrl?: string;
  status: 'Planejamento' | 'Realizado';
  gallery: SocialProjectItem[]; // Fotos com versículos
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImageUrl?: string; // New field for custom banner
  nextEventTitle: string;
  nextEventDate: string; // YYYY-MM-DD
  nextEventTime: string; // HH:MM
  nextEventDescription: string;
  nextEventLocation: string;
  youtubeLiveLink: string;
  
  // Projeto Social
  socialProjectTitle?: string;
  socialProjectDescription?: string;
  socialProjectItems?: SocialProjectItem[]; // Updated to include verses
}

export interface Quote {
  text: string;
  author: string;
  source?: string;
  type: 'Bible' | 'Theology';
}

export enum PageView {
  PUBLIC_HOME = 'PUBLIC_HOME',
  PUBLIC_ABOUT = 'PUBLIC_ABOUT',
  PUBLIC_SOCIAL = 'PUBLIC_SOCIAL', // New Public Page
  PUBLIC_CONTACT = 'PUBLIC_CONTACT',
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_MEMBERS = 'ADMIN_MEMBERS',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
  ADMIN_CALENDAR = 'ADMIN_CALENDAR',
  ADMIN_SOCIAL = 'ADMIN_SOCIAL', // New Admin Page
  ADMIN_SITE_CONTENT = 'ADMIN_SITE_CONTENT',
  ADMIN_RESOURCES = 'ADMIN_RESOURCES',
}