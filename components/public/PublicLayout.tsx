import React, { useState, useEffect } from 'react';
import { Menu, X, Instagram, MapPin, Phone, ShieldCheck, Mail } from 'lucide-react';
import { PageView } from '../../types';

interface PublicLayoutProps {
  children: React.ReactNode;
  onNavigate: (page: PageView) => void;
  activePage: PageView;
}

const BrandLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`${className} relative group select-none`}>
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm overflow-visible" xmlns="http://www.w3.org/2000/svg">
       {/* Círculo mais fino para elegância */}
       <circle cx="100" cy="100" r="92" stroke="#C5A059" strokeWidth="3" fill="none" className="opacity-80" />
       {/* Cruz com linhas mais refinadas */}
       <path d="M100 35 L 100 165 M 65 80 L 135 80" stroke="#0A1827" strokeWidth="8" fill="none" strokeLinecap="square" />
    </svg>
  </div>
);

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, onNavigate, activePage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', page: PageView.PUBLIC_HOME },
    { label: 'Quem Somos', page: PageView.PUBLIC_ABOUT },
    { label: 'Ação Social', page: PageView.PUBLIC_SOCIAL }, // Added
    { label: 'Contato', page: PageView.PUBLIC_CONTACT },
  ];

  const handleNav = (page: PageView) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const openMap = () => {
    const address = "R. Icaraçu, 1110 - Barroso, Fortaleza - CE, 60862-735";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-gray-800">
      
      {/* Top Bar - Elegant Gradient & Spacing */}
      <div className="bg-gradient-to-r from-navy-900 via-[#0e2338] to-navy-900 text-white/60 text-[10px] py-2.5 hidden md:block border-b border-white/5 uppercase tracking-[0.2em]">
        <div className="container mx-auto px-8 flex justify-between items-center font-light">
            <div className="flex gap-8">
                <span className="flex items-center gap-2 hover:text-white transition-colors duration-300 cursor-default">
                    <MapPin size={10} className="text-gold-500/80"/> Fortaleza, CE
                </span>
                <span className="flex items-center gap-2 hover:text-white transition-colors duration-300 cursor-default">
                    <Phone size={10} className="text-gold-500/80"/> (85) 99999-9999
                </span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-4 border-r border-white/10 pr-6">
                  <a href="https://www.instagram.com/igrejabatista.iboc/?igsh=MXEydnd0cXBhZ3FyMA%3D%3D#" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 text-white/60 transition-colors transform hover:scale-110 duration-300">
                      <Instagram size={12} />
                  </a>
                </div>
                <button 
                    onClick={() => handleNav(PageView.LOGIN)} 
                    className="hover:text-gold-400 transition-colors duration-300 font-medium flex items-center gap-2"
                >
                    <ShieldCheck size={12} /> Área de Líderes
                </button>
            </div>
        </div>
      </div>

      {/* Header / Navbar - Glassmorphism */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-soft py-2' : 'bg-white py-4 border-b border-gray-50'}`}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => handleNav(PageView.PUBLIC_HOME)}
            >
              <BrandLogo className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-500 group-hover:scale-105" />
              <div className="flex flex-col justify-center">
                <span className="text-navy-900 font-serif font-bold text-lg md:text-xl leading-none tracking-tight">Igreja Batista</span>
                <span className="text-gold-600 font-sans text-xs md:text-sm tracking-[0.2em] uppercase mt-0.5">O Caminho</span>
              </div>
            </div>

            {/* Desktop Nav - Clean & Elegant */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.page)}
                  className={`text-sm font-medium tracking-widest uppercase transition-all relative group py-2 ${
                    activePage === link.page ? 'text-navy-900' : 'text-gray-500 hover:text-navy-800'
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-[1px] bg-gold-500 transition-all duration-300 ${activePage === link.page ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-navy-900 opacity-80 hover:opacity-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav - Elegant Slide */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-xl absolute w-full left-0 top-full shadow-lg z-50 animate-fade-in-up border-t border-gray-100">
            <nav className="flex flex-col p-8 space-y-6 text-center">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.page)}
                  className={`text-lg font-serif ${
                    activePage === link.page ? 'text-navy-900 font-bold italic' : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="w-12 h-[1px] bg-gold-500 mx-auto my-4 opacity-50"></div>
              <button onClick={() => handleNav(PageView.LOGIN)} className="text-xs uppercase tracking-[0.2em] text-gold-600 font-bold flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> Acesso Administrativo
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer - Elegant Dark */}
      <footer className="bg-navy-900 text-gray-400 border-t border-gold-600/30">
        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-16">
            
            {/* Column 1: Identity */}
            <div className="space-y-5 md:space-y-6">
              <div className="flex items-center gap-3 text-white mb-4 md:mb-6">
                 <BrandLogo className="w-10 h-10 bg-white/5 rounded-full p-2" />
                 <div>
                    <h5 className="font-serif text-lg leading-none">IBOC</h5>
                    <span className="text-[10px] uppercase tracking-widest text-gold-500">Igreja Batista</span>
                 </div>
              </div>
              <p className="text-sm font-light leading-relaxed text-gray-400 font-sans max-w-xs">
                "Eu sou o caminho, a verdade e a vida."<br/>
                Uma comunidade de fé acolhedora, fundamentada na Palavra e movida pelo Amor.
              </p>
              <div className="flex gap-4 pt-2">
                 <a href="https://www.instagram.com/igrejabatista.iboc/?igsh=MXEydnd0cXBhZ3FyMA%3D%3D#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold-500 transition-transform hover:-translate-y-1 duration-300 bg-white/5 p-2 rounded-full hover:bg-white/10">
                    <Instagram size={18} strokeWidth={1.5} />
                 </a>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="text-white font-serif text-lg mb-4 md:mb-6 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-gold-500"></span> Navegação
              </h4>
              <ul className="space-y-3 text-sm font-light">
                {navLinks.map(link => (
                    <li key={link.label}>
                        <button onClick={() => handleNav(link.page)} className="hover:text-gold-400 hover:pl-2 transition-all duration-300 text-left w-full">
                            {link.label}
                        </button>
                    </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Service Times */}
            <div>
              <h4 className="text-white font-serif text-lg mb-4 md:mb-6 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-gold-500"></span> Cultos
              </h4>
              <ul className="space-y-4 text-sm font-light">
                <li className="flex gap-4 border-b border-white/5 pb-2">
                  <span className="text-gold-500 font-bold w-12 shrink-0">QUA</span>
                  <span>19h30 - Culto de Doutrina</span>
                </li>
                <li className="flex gap-4 border-b border-white/5 pb-2">
                  <span className="text-gold-500 font-bold w-12 shrink-0">SEX</span>
                  <span>19h30 - Escola Bíblica</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold-500 font-bold w-12 shrink-0">DOM</span>
                  <span>18h00 - Celebração</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Location */}
            <div>
              <h4 className="text-white font-serif text-lg mb-4 md:mb-6 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-gold-500"></span> Localização
              </h4>
              <div className="space-y-4 text-sm font-light">
                <p className="flex gap-3 items-start">
                   <MapPin size={16} className="text-gold-500 mt-1 shrink-0" />
                   <span className="leading-relaxed">R. Icaraçu, 1110 - Barroso,<br/>Fortaleza - CE</span>
                </p>
                <p className="flex gap-3 items-center">
                   <Phone size={16} className="text-gold-500 shrink-0" />
                   <span>(85) 99999-9999</span>
                </p>
                <p className="flex gap-3 items-center">
                   <Mail size={16} className="text-gold-500 shrink-0" />
                   <span>contato@iboc.com.br</span>
                </p>
              </div>
              <button 
                onClick={openMap} 
                className="mt-8 text-xs uppercase tracking-[0.2em] border border-gold-500/30 text-gold-500 px-6 py-3 hover:bg-gold-500 hover:text-navy-900 transition-all duration-300 w-full sm:w-auto"
              >
                Ver no Mapa
              </button>
            </div>

          </div>
          
          <div className="border-t border-white/5 mt-12 md:mt-16 pt-8 text-center text-[11px] uppercase tracking-wider text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Igreja Batista O Caminho.</p>
            <p className="font-serif italic text-gray-600 normal-case">Soli Deo Gloria</p>
          </div>
        </div>
      </footer>
    </div>
  );
};