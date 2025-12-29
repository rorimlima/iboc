import React, { useEffect, useState } from 'react';
import { SocialProject } from '../../types';
import { getCollection } from '../../services/firestore';
import { Loader2, Calendar, MapPin, Heart, Quote, Camera, X, Maximize2 } from 'lucide-react';

const IBOCStamp = () => (
    <div className="absolute bottom-3 right-3 flex flex-col items-center pointer-events-none opacity-60 select-none group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 rounded-full border-2 border-gold-500/50 flex items-center justify-center bg-white/10 backdrop-blur-sm">
            <svg viewBox="0 0 100 100" className="w-6 h-6">
                <path d="M50 10 L 50 90 M 30 40 L 70 40" stroke="#C5A059" strokeWidth="8" fill="none" />
            </svg>
        </div>
        <span className="text-[6px] text-white font-bold tracking-[0.2em] mt-1 drop-shadow-md">IBOC SOCIAL</span>
    </div>
);

export const SocialPage: React.FC = () => {
  const [projects, setProjects] = useState<SocialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{url: string, verse?: string, ref?: string} | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
        const data = await getCollection<SocialProject>('social_projects');
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setProjects(data);
        setLoading(false);
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-rose-600" size={32} /></div>;

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
        {/* Hero */}
        <div className="relative h-[40vh] min-h-[300px] flex items-center justify-center text-center px-4 overflow-hidden bg-rose-950">
             <div className="absolute inset-0">
                 <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070" className="w-full h-full object-cover opacity-30" />
                 <div className="absolute inset-0 bg-gradient-to-t from-rose-950 via-rose-900/40 to-transparent" />
             </div>
             <div className="relative z-10 space-y-4 animate-fade-in-up">
                 <h1 className="text-4xl md:text-6xl font-serif text-white">Amor em Ação</h1>
                 <p className="text-rose-100 italic text-lg">"Não amemos de palavra, mas por obra e em verdade."</p>
             </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 py-16 space-y-24">
            {projects.length === 0 ? (
                <div className="text-center py-20 text-gray-400">Nenhum projeto registrado.</div>
            ) : (
                projects.map((project, idx) => (
                    <div key={project.id} className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-rose-100 pb-6">
                            <div className="max-w-2xl">
                                <span className="text-gold-600 font-bold text-xs uppercase tracking-widest block mb-2">Projeto Social</span>
                                <h2 className="text-3xl md:text-4xl font-serif text-navy-900 mb-4">{project.title}</h2>
                                <p className="text-gray-600 font-light leading-relaxed">{project.description}</p>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                                <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(project.date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><MapPin size={14}/> {project.location}</span>
                            </div>
                        </div>

                        {/* Melhorei a Galeria para Estilo de Grid Variado */}
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                            {project.gallery.map((item, i) => (
                                <div 
                                    key={i} 
                                    className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-zoom-in break-inside-avoid"
                                    onClick={() => setSelectedImage({url: item.imageUrl, verse: item.verse, ref: item.verseReference})}
                                >
                                    <img 
                                        src={item.imageUrl} 
                                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-1000" 
                                        alt="Galeria"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                                    
                                    {/* Carimbo Watermark IBOC */}
                                    <IBOCStamp />

                                    {/* Overlay com Versículo (Apenas Desktop) */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                                        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg">
                                            <Quote size={16} className="text-gold-400 mb-2" />
                                            <p className="text-sm font-serif italic mb-2 line-clamp-3">"{item.verse}"</p>
                                            <span className="text-[10px] uppercase font-bold text-gold-500">{item.verseReference}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white">
                                            <Maximize2 size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Modal Visualização de Foto Completa */}
        {selectedImage && (
            <div className="fixed inset-0 bg-navy-950/98 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                    <X size={32}/>
                </button>
                
                <div className="w-full max-w-5xl h-full flex flex-col justify-center gap-6 py-10">
                    {/* Aqui o object-contain garante a foto completa */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        <img 
                            src={selectedImage.url} 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
                            alt="Visualização"
                        />
                        <div className="absolute bottom-4 right-4 pointer-events-none scale-150 origin-bottom-right">
                             <div className="w-10 h-10 rounded-full border-2 border-gold-500/50 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                                <svg viewBox="0 0 100 100" className="w-6 h-6">
                                    <path d="M50 10 L 50 90 M 30 40 L 70 40" stroke="#C5A059" strokeWidth="8" fill="none" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    {selectedImage.verse && (
                        <div className="text-center px-6 animate-in slide-in-from-bottom-4">
                            <Quote size={24} className="text-gold-500 mx-auto mb-4" />
                            <p className="text-white text-xl md:text-2xl font-serif italic mb-3 drop-shadow-md">
                                "{selectedImage.verse}"
                            </p>
                            <span className="text-gold-500 font-bold uppercase tracking-widest text-xs">
                                {selectedImage.ref}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )}

        <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    </div>
  );
};