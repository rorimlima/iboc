import React, { useEffect, useState } from 'react';
import { SocialProject, SocialProjectItem } from '../../types';
import { getCollection } from '../../services/firestore';
import { Loader2, Calendar, MapPin, Quote, X, Maximize2, ChevronRight, Heart, Share2 } from 'lucide-react';
import { RevealOnScroll } from '../ui/RevealOnScroll';

const IBOCStamp = ({ light = false }: { light?: boolean }) => (
    <div className={`absolute bottom-3 right-3 flex flex-col items-center pointer-events-none select-none transition-opacity duration-500 ${light ? 'opacity-90' : 'opacity-40 group-hover:opacity-100'}`}>
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md shadow-sm ${light ? 'border-white/40 bg-white/10' : 'border-gold-500/50 bg-white/20'}`}>
            <svg viewBox="0 0 100 100" className="w-6 h-6">
                <path d="M50 10 L 50 90 M 30 40 L 70 40" stroke={light ? "#FFFFFF" : "#C5A059"} strokeWidth="8" fill="none" />
            </svg>
        </div>
        <span className={`text-[6px] font-bold tracking-[0.3em] mt-1 drop-shadow-md ${light ? 'text-white' : 'text-navy-900'}`}>IBOC SOCIAL</span>
    </div>
);

export const SocialPage: React.FC = () => {
  const [projects, setProjects] = useState<SocialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{url: string, verse?: string, ref?: string, projectTitle: string} | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
        try {
            const data = await getCollection<SocialProject>('social_projects');
            // Ordenação rigorosa por data decrescente
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
              <Loader2 className="animate-spin text-gold-600 mb-4" size={40} />
              <p className="text-navy-900 font-serif italic animate-pulse">Carregando memórias de amor...</p>
          </div>
      );
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-32">
        {/* Hero Section Aprimorado */}
        <section className="relative h-[45vh] md:h-[55vh] flex items-center justify-center text-center px-4 overflow-hidden bg-navy-900">
             <div className="absolute inset-0">
                 <img 
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070" 
                    className="w-full h-full object-cover opacity-30 scale-105 animate-pulse" 
                    style={{ animationDuration: '8s' }}
                    alt="Background Social" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-rose-950/40 to-stone-50" />
             </div>
             <div className="relative z-10 space-y-6 max-w-3xl">
                 <RevealOnScroll>
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-4">
                        <Heart size={14} className="text-gold-400 fill-current" />
                        <span className="text-white text-[10px] uppercase tracking-[0.3em] font-bold">Nossa Missão no Barroso</span>
                    </div>
                 </RevealOnScroll>
                 <RevealOnScroll delay={200}>
                    <h1 className="text-5xl md:text-7xl font-serif text-white leading-none">Amor em Ação</h1>
                 </RevealOnScroll>
                 <RevealOnScroll delay={400}>
                    <p className="text-rose-100 italic text-base md:text-xl font-light">"Não amemos de palavra, nem de língua, mas por obra e em verdade."</p>
                 </RevealOnScroll>
             </div>
        </section>

        {/* Timeline e Galeria */}
        <div className="container mx-auto px-4 md:px-8 -mt-12 relative z-20">
            {projects.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-soft">
                    <p className="text-gray-400 font-serif italic text-xl">Nenhuma ação registrada no momento.</p>
                </div>
            ) : (
                <div className="space-y-32">
                    {projects.map((project, index) => {
                        const dateInfo = formatDate(project.date);
                        return (
                            <div key={project.id} className="relative group">
                                {/* Marcador de Linha do Tempo */}
                                <div className="hidden lg:block absolute -left-16 top-0 h-full w-px bg-gradient-to-b from-gold-500/50 via-gray-200 to-transparent">
                                    <div className="sticky top-32 -left-3 w-6 h-6 rounded-full bg-white border-4 border-gold-500 shadow-md flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gold-600"></div>
                                    </div>
                                </div>

                                {/* Cabeçalho do Projeto */}
                                <RevealOnScroll>
                                    <div className="mb-12 flex flex-col md:flex-row gap-8 items-start md:items-end">
                                        {/* Selo de Data Flutuante */}
                                        <div className="flex-shrink-0 bg-white shadow-soft rounded-2xl p-4 text-center border border-gray-100 min-w-[100px] transform group-hover:scale-105 transition-transform duration-500">
                                            <span className="block text-4xl font-serif text-navy-900 font-bold leading-none">{dateInfo.day}</span>
                                            <span className="block text-xs uppercase tracking-widest text-gold-600 font-bold mt-1">{dateInfo.month}</span>
                                            <span className="block text-[10px] text-gray-400 font-medium mt-1">{dateInfo.year}</span>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5 text-gold-600"><MapPin size={14}/> {project.location || 'Fortaleza, CE'}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span className="flex items-center gap-1.5"><Calendar size={14}/> {dateInfo.year}</span>
                                            </div>
                                            <h2 className="text-4xl md:text-5xl font-serif text-navy-900 leading-tight">
                                                {project.title}
                                            </h2>
                                            <p className="text-gray-600 font-light text-lg leading-relaxed max-w-3xl border-l-2 border-rose-100 pl-6 italic">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </RevealOnScroll>

                                {/* Grade Masonry Responsiva */}
                                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                                    {project.gallery.map((item, i) => (
                                        <RevealOnScroll key={i} delay={i * 100}>
                                            <div 
                                                className="relative group/card rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 cursor-zoom-in break-inside-avoid bg-white"
                                                onClick={() => setSelectedImage({
                                                    url: item.imageUrl, 
                                                    verse: item.verse, 
                                                    ref: item.verseReference,
                                                    projectTitle: project.title
                                                })}
                                            >
                                                <img 
                                                    src={item.imageUrl} 
                                                    loading="lazy"
                                                    className="w-full h-auto object-cover group-hover/card:scale-110 transition-transform duration-[1.5s]" 
                                                    alt={`${project.title} - Foto ${i+1}`} 
                                                />
                                                
                                                {/* Overlay de Hover */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                                                    <div className="translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500">
                                                        <Maximize2 size={20} className="text-white mb-3" />
                                                        <p className="text-white font-serif italic text-sm line-clamp-2">"{item.verse}"</p>
                                                        <span className="text-gold-400 text-[10px] font-bold uppercase tracking-widest mt-2 block">{item.verseReference}</span>
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

        {/* Lightbox Profissional */}
        {selectedImage && (
            <div className="fixed inset-0 bg-navy-900/98 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                {/* Controles do Topo */}
                <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
                    <div className="text-white">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold-500">Visualizando Projeto</span>
                        <h4 className="text-xl font-serif">{selectedImage.projectTitle}</h4>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'IBOC Social - ' + selectedImage.projectTitle,
                                        text: selectedImage.verse,
                                        url: window.location.href
                                    });
                                }
                            }}
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-gold-500 hover:text-navy-900 transition-all"
                        >
                            <Share2 size={20} />
                        </button>
                        <button 
                            onClick={() => setSelectedImage(null)} 
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-red-500 transition-all"
                        >
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                {/* Área da Imagem */}
                <div className="w-full h-full flex items-center justify-center p-4 md:p-12 relative">
                    <div className="relative max-w-6xl max-h-[75vh] group/light">
                        <img 
                            src={selectedImage.url} 
                            className="w-full h-full object-contain shadow-2xl rounded-lg" 
                            alt="Visualização ampliada"
                        />
                        <IBOCStamp light />
                    </div>
                </div>

                {/* Rodapé do Lightbox com Versículo */}
                {selectedImage.verse && (
                    <div className="w-full max-w-4xl px-8 pb-12 text-center animate-fade-in-up">
                        <div className="w-12 h-px bg-gold-500 mx-auto mb-6"></div>
                        <Quote size={24} className="text-gold-500 mx-auto mb-4 opacity-50" />
                        <p className="text-white font-serif italic text-xl md:text-2xl leading-relaxed mb-4">
                            "{selectedImage.verse}"
                        </p>
                        <span className="text-gold-500 text-xs font-bold uppercase tracking-[0.4em] block">
                            {selectedImage.ref}
                        </span>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};