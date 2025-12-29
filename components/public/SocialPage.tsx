
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SocialProject, SocialProjectItem } from '../../types';
import { getCollection } from '../../services/firestore';
import { Loader2, Calendar, MapPin, Quote, X, Maximize2, ChevronLeft, ChevronRight, Heart, Share2, ImageIcon } from 'lucide-react';
import { RevealOnScroll } from '../ui/RevealOnScroll';

const IBOCStamp = ({ light = false }: { light?: boolean }) => (
    <div className={`absolute bottom-6 right-6 flex flex-col items-center pointer-events-none select-none transition-all duration-1000 ${light ? 'opacity-90' : 'opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0'}`}>
        <div className={`w-14 h-14 rounded-full border flex items-center justify-center backdrop-blur-2xl shadow-2xl ${light ? 'border-white/30 bg-white/10' : 'border-gold-500/40 bg-navy-900/60'}`}>
            <svg viewBox="0 0 100 100" className="w-8 h-8">
                <path d="M50 15 L 50 85 M 35 45 L 65 45" stroke={light ? "#FFFFFF" : "#C5A059"} strokeWidth="5" fill="none" strokeLinecap="round" />
            </svg>
        </div>
        <span className={`text-[8px] font-bold tracking-[0.5em] mt-2 drop-shadow-md uppercase ${light ? 'text-white' : 'text-gold-500'}`}>IBOC Social</span>
    </div>
);

export const SocialPage: React.FC = () => {
  const [projects, setProjects] = useState<SocialProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeGallery, setActiveGallery] = useState<{
      items: SocialProjectItem[];
      projectTitle: string;
      currentIndex: number;
  } | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
        try {
            const data = await getCollection<SocialProject>('social_projects');
            // Ordenação dos projetos por data principal
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Dentro de cada projeto, ordenar galeria por data de registro (mais recentes primeiro)
            const processedData = data.map(project => ({
                ...project,
                gallery: (project.gallery || []).sort((a, b) => b.registeredAt - a.registeredAt)
            }));
            
            setProjects(processedData);
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
      // Ajuste para compensar fuso horário do input
      date.setDate(date.getDate() + 1);
      return {
          day: date.getDate(),
          month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
          year: date.getFullYear()
      };
  };

  const HorizontalCarousel = ({ project }: { project: SocialProject }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 1.5 : scrollLeft + clientWidth / 1.5;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group/carousel">
            <div 
                ref={scrollRef}
                className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {project.gallery.map((item, idx) => (
                    <div 
                        key={item.registeredAt}
                        className="min-w-[320px] md:min-w-[450px] aspect-[4/5] md:aspect-[3/4] rounded-[2.5rem] overflow-hidden snap-center relative shadow-2xl group border border-gray-100/50 cursor-pointer"
                        onClick={() => openLightbox(project, idx)}
                    >
                        <img 
                            src={item.imageUrl} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-125" 
                            alt={`${project.title} - ${idx}`} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/10 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-1000"></div>
                        
                        <div className="absolute bottom-0 left-0 w-full p-10 text-white transform translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                             <Quote size={20} className="text-gold-500 mb-4 opacity-60" />
                             <p className="font-serif italic text-xl leading-relaxed mb-6 line-clamp-3">"{item.verse}"</p>
                             <div className="flex items-center gap-4">
                                 <div className="h-[1px] w-8 bg-gold-500"></div>
                                 <span className="text-gold-400 text-[10px] font-bold tracking-[0.4em] uppercase">{item.verseReference}</span>
                             </div>
                        </div>
                        <IBOCStamp />
                    </div>
                ))}
            </div>

            <button onClick={() => scroll('left')} className="absolute -left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center text-navy-900 hover:bg-gold-500 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 z-10 border border-gray-100">
                <ChevronLeft size={24} />
            </button>
            <button onClick={() => scroll('right')} className="absolute -right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center text-navy-900 hover:bg-gold-500 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 z-10 border border-gray-100">
                <ChevronRight size={24} />
            </button>
        </div>
    );
  };

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
              <Loader2 className="animate-spin text-gold-600 mb-8" size={64} strokeWidth={1} />
              <p className="text-navy-900 font-serif italic text-2xl animate-pulse tracking-[0.2em] uppercase opacity-50">Semeando Amor...</p>
          </div>
      );
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-60">
        <section className="relative h-[60vh] md:h-[75vh] flex items-center justify-center text-center px-4 overflow-hidden bg-navy-900">
             <div className="absolute inset-0">
                 <img 
                    src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070" 
                    className="w-full h-full object-cover opacity-30 scale-105 transition-transform duration-[20s] hover:scale-100" 
                    alt="Background Social" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/40 to-stone-50" />
                 <div className="absolute inset-0 bg-black/10" />
             </div>
             <div className="relative z-10 space-y-10 max-w-5xl">
                 <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full border border-gold-500/30 bg-white/5 backdrop-blur-xl mb-4 shadow-2xl">
                        <Heart size={18} className="text-red-500 fill-current animate-pulse" />
                        <span className="text-white text-xs uppercase tracking-[0.6em] font-bold">Ministério Social IBOC</span>
                    </div>
                 </div>
                 <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <h1 className="text-6xl md:text-9xl font-serif text-white leading-none tracking-tighter drop-shadow-2xl">
                        Amor em <br/> <span className="text-gold-400 italic font-normal">Evidência</span>
                    </h1>
                 </div>
                 <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <p className="text-stone-200 italic text-2xl md:text-3xl font-light max-w-3xl mx-auto border-t border-white/10 pt-10 opacity-80 leading-relaxed">
                        "Onde as palavras calam, nossas ações anunciam o Reino."
                    </p>
                 </div>
             </div>
        </section>

        <div className="container mx-auto px-6 md:px-12 -mt-32 relative z-20">
            {projects.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-40 text-center shadow-soft border border-gray-100 flex flex-col items-center">
                    <ImageIcon className="text-gold-200 mb-8" size={80} strokeWidth={1} />
                    <p className="text-gray-400 font-serif italic text-3xl tracking-widest">Nossa história continua sendo escrita...</p>
                </div>
            ) : (
                <div className="space-y-60">
                    {projects.map((project) => {
                        const dateInfo = formatDate(project.date);
                        return (
                            <div key={project.id} className="relative">
                                <div className="hidden xl:block absolute -left-28 top-0 h-full w-[1px] bg-gradient-to-b from-gold-500/40 via-gray-200 to-transparent">
                                    <div className="sticky top-64 -left-5 w-10 h-10 rounded-full bg-navy-900 border-[6px] border-gold-500 shadow-glow flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                                    </div>
                                </div>

                                <RevealOnScroll>
                                    <div className="mb-20 flex flex-col lg:flex-row gap-16 items-start">
                                        <div className="flex-shrink-0 bg-white shadow-2xl rounded-[2rem] p-8 text-center border-t-8 border-gold-500 min-w-[140px] transform hover:-translate-y-3 transition-all duration-700">
                                            <span className="block text-6xl font-serif text-navy-900 font-bold leading-none">{dateInfo.day}</span>
                                            <span className="block text-sm uppercase tracking-[0.3em] text-gold-600 font-bold mt-3">{dateInfo.month}</span>
                                            <span className="block text-xs text-gray-400 font-medium mt-2 tracking-widest">{dateInfo.year}</span>
                                        </div>

                                        <div className="flex-1 space-y-8">
                                            <div className="flex items-center gap-6 text-gold-600 text-xs font-bold uppercase tracking-[0.5em] opacity-80">
                                                <span className="flex items-center gap-3"><MapPin size={18} strokeWidth={1.5}/> {project.location || 'Sede IBOC'}</span>
                                                <span className="w-2 h-2 rounded-full bg-gold-200"></span>
                                                <span>Ação Missionária</span>
                                            </div>
                                            <h2 className="text-6xl md:text-8xl font-serif text-navy-900 leading-none tracking-tighter">
                                                {project.title}
                                            </h2>
                                            <p className="text-gray-500 font-light text-2xl leading-relaxed max-w-4xl italic pl-10 border-l-4 border-gold-100/50 py-2">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </RevealOnScroll>

                                <RevealOnScroll delay={200}>
                                    <HorizontalCarousel project={project} />
                                </RevealOnScroll>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {activeGallery && (
            <div className="fixed inset-0 bg-navy-900/98 z-[100] flex flex-col animate-in fade-in duration-700 backdrop-blur-3xl">
                <div className="p-10 flex justify-between items-center z-[110] bg-gradient-to-b from-navy-900/80 to-transparent">
                    <div className="text-white">
                        <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-gold-500 mb-2">Acervo IBOC Social</p>
                        <h4 className="text-3xl font-serif md:text-5xl drop-shadow-lg">{activeGallery.projectTitle}</h4>
                    </div>
                    <button 
                        onClick={closeLightbox} 
                        className="p-6 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10 backdrop-blur-xl group shadow-2xl"
                    >
                        <X size={36} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-700"/>
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center relative">
                    <button onClick={prevImage} className="absolute left-12 p-6 rounded-full text-white/20 hover:text-gold-400 hover:bg-white/5 transition-all z-10"><ChevronLeft size={64} strokeWidth={1}/></button>
                    
                    <div className="relative max-w-6xl w-full h-[65vh] flex flex-col items-center justify-center p-4">
                        <img 
                            key={activeGallery.currentIndex}
                            src={activeGallery.items[activeGallery.currentIndex].imageUrl} 
                            className="max-w-full max-h-full object-contain shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] rounded-2xl animate-in fade-in zoom-in-95 duration-700" 
                            alt="Visualização"
                        />
                        <IBOCStamp light />
                    </div>

                    <button onClick={nextImage} className="absolute right-12 p-6 rounded-full text-white/20 hover:text-gold-400 hover:bg-white/5 transition-all z-10"><ChevronRight size={64} strokeWidth={1}/></button>
                </div>

                <div className="w-full p-16 text-center z-[110] bg-gradient-to-t from-navy-900 to-transparent">
                    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
                        <Quote size={32} className="text-gold-500/20 mx-auto mb-4" />
                        <p className="text-white font-serif italic text-3xl md:text-4xl leading-snug drop-shadow-md">
                            "{activeGallery.items[activeGallery.currentIndex].verse}"
                        </p>
                        <div className="flex items-center justify-center gap-10">
                            <div className="h-[2px] w-16 bg-gold-600/40"></div>
                            <span className="text-gold-500 text-sm md:text-base font-bold uppercase tracking-[0.8em]">
                                {activeGallery.items[activeGallery.currentIndex].verseReference}
                            </span>
                            <div className="h-[2px] w-16 bg-gold-600/40"></div>
                        </div>
                    </div>
                </div>
                
                <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full overflow-hidden">
                    <div 
                        className="h-full bg-gold-500 shadow-glow transition-all duration-1000 ease-in-out"
                        style={{ width: `${((activeGallery.currentIndex + 1) / activeGallery.items.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        )}
    </div>
  );
};
