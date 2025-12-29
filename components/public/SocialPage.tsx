import React, { useEffect, useState, useCallback } from 'react';
import { SocialProject, SocialProjectItem } from '../../types';
import { getCollection } from '../../services/firestore';
import { Loader2, Calendar, MapPin, Quote, X, Maximize2, ChevronLeft, ChevronRight, Heart, Share2 } from 'lucide-react';
import { RevealOnScroll } from '../ui/RevealOnScroll';

const IBOCStamp = ({ light = false }: { light?: boolean }) => (
    <div className={`absolute bottom-4 right-4 flex flex-col items-center pointer-events-none select-none transition-opacity duration-700 ${light ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center backdrop-blur-xl shadow-lg ${light ? 'border-white/40 bg-white/10' : 'border-gold-500/50 bg-navy-900/40'}`}>
            <svg viewBox="0 0 100 100" className="w-7 h-7">
                <path d="M50 10 L 50 90 M 30 40 L 70 40" stroke={light ? "#FFFFFF" : "#C5A059"} strokeWidth="6" fill="none" />
            </svg>
        </div>
        <span className={`text-[7px] font-bold tracking-[0.4em] mt-1.5 drop-shadow-md ${light ? 'text-white' : 'text-navy-900'}`}>IBOC SOCIAL</span>
    </div>
);

export const SocialPage: React.FC = () => {
  const [projects, setProjects] = useState<SocialProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lightbox State
  const [activeGallery, setActiveGallery] = useState<{
      items: SocialProjectItem[];
      projectTitle: string;
      currentIndex: number;
  } | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
        try {
            const data = await getCollection<SocialProject>('social_projects');
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setProjects(data);
        } catch (error) {
            console.error("Erro ao carregar galeria social:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchProjects();
  }, []);

  const openLightbox = (project: SocialProject, index: number) => {
      setActiveGallery({
          items: project.gallery,
          projectTitle: project.title,
          currentIndex: index
      });
  };

  const closeLightbox = () => setActiveGallery(null);

  const nextImage = useCallback(() => {
    if (!activeGallery) return;
    setActiveGallery(prev => prev ? ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.items.length
    }) : null);
  }, [activeGallery]);

  const prevImage = useCallback(() => {
    if (!activeGallery) return;
    setActiveGallery(prev => prev ? ({
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.items.length) % prev.items.length
    }) : null);
  }, [activeGallery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!activeGallery) return;
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGallery, nextImage, prevImage]);

  const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return {
          day: date.getDate(),
          month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          year: date.getFullYear()
      };
  };

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
              <Loader2 className="animate-spin text-gold-600 mb-6" size={48} strokeWidth={1.5} />
              <p className="text-navy-900 font-serif italic text-lg animate-pulse tracking-widest">Tecendo memórias de esperança...</p>
          </div>
      );
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-40">
        {/* Cinematic Hero */}
        <section className="relative h-[50vh] md:h-[65vh] flex items-center justify-center text-center px-4 overflow-hidden bg-navy-900">
             <div className="absolute inset-0">
                 <img 
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070" 
                    className="w-full h-full object-cover opacity-40 scale-105" 
                    alt="Background Social" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/40 to-stone-50" />
             </div>
             <div className="relative z-10 space-y-8 max-w-4xl">
                 <RevealOnScroll>
                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-gold-500/30 bg-white/5 backdrop-blur-md mb-2 shadow-glow">
                        <Heart size={16} className="text-gold-400 fill-current animate-pulse" />
                        <span className="text-white text-xs uppercase tracking-[0.4em] font-bold">Amor em Ação: Barroso</span>
                    </div>
                 </RevealOnScroll>
                 <RevealOnScroll delay={200}>
                    <h1 className="text-6xl md:text-8xl font-serif text-white leading-none tracking-tight">
                        Nosso Legado <br/> <span className="text-gold-400 italic font-normal">de Serviço</span>
                    </h1>
                 </RevealOnScroll>
                 <RevealOnScroll delay={400}>
                    <p className="text-stone-200 italic text-xl md:text-2xl font-light max-w-2xl mx-auto border-t border-white/10 pt-6">
                        "Cada foto é um testemunho silencioso de que o Reino de Deus se faz presente em cada gesto de cuidado."
                    </p>
                 </RevealOnScroll>
             </div>
        </section>

        {/* Galeria Organizada por Projetos */}
        <div className="container mx-auto px-6 md:px-12 -mt-20 relative z-20">
            {projects.length === 0 ? (
                <div className="bg-white rounded-3xl p-32 text-center shadow-soft border border-gray-100">
                    <Quote className="text-gold-200 mx-auto mb-6" size={48} />
                    <p className="text-gray-400 font-serif italic text-2xl">Aguardando o próximo capítulo desta história.</p>
                </div>
            ) : (
                <div className="space-y-48">
                    {projects.map((project, pIdx) => {
                        const dateInfo = formatDate(project.date);
                        return (
                            <div key={project.id} className="relative">
                                {/* Timeline lateral elegante */}
                                <div className="hidden xl:block absolute -left-20 top-0 h-full w-px bg-gradient-to-b from-gold-500/60 via-gray-200 to-transparent">
                                    <div className="sticky top-40 -left-4 w-8 h-8 rounded-full bg-navy-900 border-4 border-gold-500 shadow-glow flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-gold-400"></div>
                                    </div>
                                </div>

                                {/* Cabeçalho do Projeto com Aspecto Editorial */}
                                <RevealOnScroll>
                                    <div className="mb-16 flex flex-col md:flex-row gap-12 items-start">
                                        <div className="flex-shrink-0 bg-white shadow-2xl rounded-3xl p-6 text-center border-t-4 border-gold-500 min-w-[120px] transform hover:-translate-y-2 transition-transform duration-500">
                                            <span className="block text-5xl font-serif text-navy-900 font-bold leading-none">{dateInfo.day}</span>
                                            <span className="block text-sm uppercase tracking-[0.2em] text-gold-600 font-bold mt-2">{dateInfo.month}</span>
                                            <span className="block text-xs text-gray-400 font-medium mt-1">{dateInfo.year}</span>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center gap-6 text-gold-600 text-xs font-bold uppercase tracking-[0.3em]">
                                                <span className="flex items-center gap-2"><MapPin size={16}/> {project.location || 'Fortaleza'}</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-gold-200"></span>
                                                <span>Ação Social</span>
                                            </div>
                                            <h2 className="text-5xl md:text-6xl font-serif text-navy-900 leading-tight tracking-tight">
                                                {project.title}
                                            </h2>
                                            <p className="text-gray-600 font-light text-xl leading-relaxed max-w-4xl italic pl-8 border-l-2 border-gold-100">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </RevealOnScroll>

                                {/* Grade Masonry com Hover Luxuoso */}
                                <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                                    {project.gallery.map((item, imgIdx) => (
                                        <RevealOnScroll key={imgIdx} delay={imgIdx * 80}>
                                            <div 
                                                className="relative group rounded-3xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-700 cursor-zoom-in break-inside-avoid bg-white border border-gray-100"
                                                onClick={() => openLightbox(project, imgIdx)}
                                            >
                                                <div className="relative overflow-hidden">
                                                    <img 
                                                        src={item.imageUrl} 
                                                        loading="lazy"
                                                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out" 
                                                        alt={`${project.title} - ${imgIdx}`} 
                                                    />
                                                    {/* Filtro de luxo */}
                                                    <div className="absolute inset-0 bg-navy-900/20 group-hover:bg-transparent transition-colors duration-700"></div>
                                                </div>
                                                
                                                {/* Info Overlay ao Hover */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                                                    <div className="translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                                                        <Maximize2 size={24} className="text-gold-400 mb-4" />
                                                        <p className="text-white font-serif italic text-lg leading-snug line-clamp-3">"{item.verse}"</p>
                                                        <div className="flex items-center gap-3 mt-4">
                                                            <div className="h-px w-8 bg-gold-500"></div>
                                                            <span className="text-gold-400 text-[10px] font-bold uppercase tracking-[0.3em]">{item.verseReference}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <IBOCStamp />
                                            </div>
                                        </RevealOnScroll>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Lightbox com Navegação Carrossel */}
        {activeGallery && (
            <div className="fixed inset-0 bg-navy-900/98 z-[100] flex flex-col animate-in fade-in duration-500">
                {/* Cabeçalho Fixo */}
                <div className="absolute top-0 w-full p-8 flex justify-between items-center z-[110]">
                    <div className="text-white">
                        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold-500 mb-1">Visualizando Projeto</p>
                        <h4 className="text-2xl font-serif md:text-3xl">{activeGallery.projectTitle}</h4>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex text-white/40 text-sm font-light tracking-[0.5em] uppercase mr-12">
                            {String(activeGallery.currentIndex + 1).padStart(2, '0')} <span className="mx-4 text-gold-500">/</span> {String(activeGallery.items.length).padStart(2, '0')}
                        </div>
                        <button 
                            onClick={closeLightbox} 
                            className="p-4 rounded-full bg-white/5 text-white hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 backdrop-blur-xl group"
                            aria-label="Fechar"
                        >
                            <X size={32} className="group-hover:rotate-90 transition-transform duration-500"/>
                        </button>
                    </div>
                </div>

                {/* Área Principal - Imagem e Controles */}
                <div className="flex-1 flex items-center justify-center relative px-4">
                    {/* Botão Anterior */}
                    <button 
                        onClick={prevImage}
                        className="absolute left-8 p-4 rounded-full text-white/30 hover:text-gold-400 hover:bg-white/5 transition-all z-10"
                    >
                        <ChevronLeft size={48} strokeWidth={1} />
                    </button>

                    <div className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center p-8">
                        <img 
                            key={activeGallery.currentIndex}
                            src={activeGallery.items[activeGallery.currentIndex].imageUrl} 
                            className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-sm md:rounded-lg animate-in fade-in zoom-in-95 duration-500" 
                            alt="Visualização"
                        />
                        <IBOCStamp light />
                    </div>

                    {/* Botão Próximo */}
                    <button 
                        onClick={nextImage}
                        className="absolute right-8 p-4 rounded-full text-white/30 hover:text-gold-400 hover:bg-white/5 transition-all z-10"
                    >
                        <ChevronRight size={48} strokeWidth={1} />
                    </button>
                </div>

                {/* Rodapé Dinâmico com Versículo */}
                <div className="w-full bg-gradient-to-t from-navy-900 to-transparent p-12 text-center pb-16 z-[110]">
                    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                        <Quote size={28} className="text-gold-500/40 mx-auto" />
                        <p className="text-white font-serif italic text-2xl md:text-3xl leading-relaxed">
                            "{activeGallery.items[activeGallery.currentIndex].verse}"
                        </p>
                        <div className="flex items-center justify-center gap-6">
                            <div className="h-px w-12 bg-gold-600/50"></div>
                            <span className="text-gold-500 text-xs md:text-sm font-bold uppercase tracking-[0.6em]">
                                {activeGallery.items[activeGallery.currentIndex].verseReference}
                            </span>
                            <div className="h-px w-12 bg-gold-600/50"></div>
                        </div>
                    </div>
                </div>
                
                {/* Barra de progresso visual no rodapé */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                    <div 
                        className="h-full bg-gold-500 transition-all duration-500 ease-out"
                        style={{ width: `${((activeGallery.currentIndex + 1) / activeGallery.items.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        )}
    </div>
  );
};