import React from 'react';
import { PageView } from '../../types';
import { 
  LayoutTemplate, 
  UsersRound, 
  Landmark, 
  CalendarDays, 
  LogOut, 
  Menu,
  X,
  Layout,
  Boxes,
  HandHeart
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
}

// Componente Logo SVG
const AdminLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 200 200" className={`${className} drop-shadow-md rounded-full`} xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" fill="#0A1827" />
    <path d="M20 140 C 70 165, 130 165, 180 140 V 160 C 130 185, 70 185, 20 160 Z" fill="#C5A059" opacity="0.9" />
    <rect x="88" y="40" width="24" height="120" fill="#fff" rx="2" />
    <rect x="50" y="75" width="100" height="24" fill="#fff" rx="2" />
  </svg>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  activePage, 
  onNavigate,
  onLogout 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutTemplate, page: PageView.ADMIN_DASHBOARD },
    { label: 'Conteúdo do Site', icon: Layout, page: PageView.ADMIN_SITE_CONTENT },
    { label: 'Projetos Sociais', icon: HandHeart, page: PageView.ADMIN_SOCIAL },
    { label: 'Membros', icon: UsersRound, page: PageView.ADMIN_MEMBERS },
    { label: 'Financeiro', icon: Landmark, page: PageView.ADMIN_FINANCE },
    { label: 'Agenda', icon: CalendarDays, page: PageView.ADMIN_CALENDAR },
    { label: 'Patrimônio', icon: Boxes, page: PageView.ADMIN_RESOURCES },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar - Desktop (White Background) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-20 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
             <AdminLogo className="w-10 h-10" />
            <div>
              <h2 className="font-heading font-bold text-lg text-navy-900">IBOC Admin</h2>
              <p className="text-xs text-gray-500">Sistema Secretaria</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                activePage === item.page 
                  ? 'bg-navy-900 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-navy-900'
              }`}
            >
              <item.icon size={20} className={activePage === item.page ? "text-gold-500" : "text-gray-400"} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header (White Background) */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 text-navy-900 z-20 flex justify-between items-center p-4 shadow-sm">
        <div className="flex items-center gap-2">
            <AdminLogo className="w-8 h-8" />
            <span className="font-heading font-bold">IBOC Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4">
          <nav className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.page);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  activePage === item.page 
                    ? 'bg-navy-900 text-white' 
                    : 'text-gray-600 border border-gray-100'
                }`}
              >
                <item.icon size={20} className={activePage === item.page ? "text-gold-500" : "text-gray-400"} />
                {item.label}
              </button>
            ))}
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 mt-8 border-t border-gray-100"
            >
              <LogOut size={20} />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};