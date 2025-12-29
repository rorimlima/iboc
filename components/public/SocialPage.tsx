import React, { useEffect, useState, useRef } from 'react';
import { SocialProject } from '../../types';
import { getCollection } from '../../services/firestore';
import { Loader2, Calendar, MapPin, Heart, Quote, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

export const SocialPage: React.FC = () => {
  const [projects, setProjects] = useState<SocialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<SocialProject | null>(null);

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
        
        {/* Header - Elegant & Atmospheric */}
        <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-center px-4 overflow-hidden bg-rose-950">
             <div className="absolute inset-0">
                 <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070" className="w-full h-full object-cover opacity-30" />
                 <div className="absolute inset-0 bg-gradient-to-t from-rose-950 via-rose-900/60 to-transparent" />
             </div>
             <div className="relative z-10 max-w-4xl space-y-6 animate-fade-in-up">
                 <div className="inline-flex items-center justify-center gap-4 mb-2">
                     <span className="h-px w-12 bg-gold-400/60"></span>
                     <span className="text-gold-400 font-sans tracking-[0.4em] uppercase text-xs">Ação Social IBOC</span>
                     <span className="h-px w-12 bg-gold-400/60"></span>
                 </div>
                 <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight drop-shadow-lg">Amor em Movimento</h1>
                 <p className="text-rose-100 text-xl md:text-2xl font-light font-serif italic max-w-2xl mx-auto leading-relaxed">
                     "Filhinhos, não amemos de palavra, nem de língua, mas por obra e em verdade."
                 </p>
                 <span className="text-xs font-sans text-gold-500 block uppercase tracking-widest mt-4">1 João 3:18</span>
             </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 py-20 space-y-32">
            {projects.length === 0 ? (
                <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-white/50">
                    <Heart size={48} className="mx-auto text-rose-200 mb-4" />
                    <p className="font-serif text-xl text-gray-500">Nenhum projeto registrado ainda.</p>
                    <p className="text-sm mt-2">Em breve, novas histórias de amor ao próximo.</p>
                </div>
            ) : (
                projects.map((project, idx) => (
                    <div key={project.id} className="group relative">
                        {/* Project Header: Description & Featured Image */}
                        <div className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center mb-12`}>
                             
                             {/* Text Content */}
                             <div className="lg:w-1/2 space-y-8">
                                 <div className="space-y-4">
                                     <div className="flex items-center gap-3">
                                         <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                             {project.status || 'Projeto Social'}
                                         </span>
                                         <span className="h-px w-12 bg-rose-200"></span>
                                     </div>
                                     <h2 className="text-4xl md:text-5xl font-serif text-navy-900 leading-[1.1]">
                                         {project.title}
                                     </h2>
                                 </div>
                                 
                                 <div className="flex flex-wrap gap-6 text-sm text-gray-500 font-medium py-4 border-y border-rose-100">
                                     <div className="flex items-center gap-2">
                                         <Calendar size={18} className="text-gold-500" />
                                         {new Date(project.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                     </div>
                                     {project.location && (
                                         <div className="flex items-center gap-2">
                                             <MapPin size={18} className="text-gold-500" />
                                             {project.location}
                                         </div>
                                     )}
                                     <div className="flex items-center gap-2">
                                         <Camera size={18} className="text-gold-500" />
                                         {project.gallery.length} fotos
                                     </div>
                                 </div>

                                 <p className="text-gray-600 leading-loose font-light text-lg text-justify">
                                     {project.description}
                                 </p>
                             </div>

                             {/* Featured Image - "Framed Art" Effect */}
                             <div className="lg:w-1/2 w-full px-4 lg:px-0">
                                 <div className="relative">
                                     {/* Background Frame Offset */}
                                     <div className={`absolute -inset-4 border-2 border-gold-500/30 rounded-tr-[3rem] rounded-bl-[3rem] -z-10 transition-transform duration-700 group-hover:scale-105 ${idx % 2 === 0 ? 'translate-x-4 translate-y-4' : '-translate-x-4 -translate-y-4'}`}></div>
                                     
                                     <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-rose-900/20 aspect-[4/3] cursor-pointer" onClick={() => setSelectedProject(project)}>
                                         <img 
                                            src={project.bannerUrl || project.gallery[0]?.imageUrl || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070"} 
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                            alt={project.title}
                                         />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                                         <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur text-navy-900 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                             Ver Galeria Completa
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Luxurious Horizontal Carousel */}
                        {project.gallery.length > 0 && (
                            <div className="relative pl-4 lg:pl-0">
                                <h3 className="font-serif italic text-2xl text-gray-400 mb-6 pl-2">Momentos</h3>
                                
                                {/* Scroll Container with Custom Scrollbar */}
                                <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-2 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gold-400/50 hover:scrollbar-thumb-gold-500">
                                    {project.gallery.map((item, i) => (
                                        <div 
                                            key={i} 
                                            className="snap-center shrink-0 w-[300px] md:w-[400px] aspect-[4/3] relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group/card"
                                            onClick={() => setSelectedProject(project)}
                                        >
                                            <img 
                                                src={item.imageUrl} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                                                alt="Momento"
                                            />
                                            {/* Elegant Overlay with Verse */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-rose-950/90 via-rose-900/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 text-center">
                                                <Quote size={20} className="text-gold-400 mx-auto mb-3 opacity-80" />
                                                <p className="text-white font-serif italic text-sm md:text-base leading-relaxed mb-2 drop-shadow-md">
                                                    "{item.verse}"
                                                </p>
                                                <span className="text-[10px] uppercase tracking-widest text-gold-400 font-bold">
                                                    {item.verseReference}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Spacer for right padding */}
                                    <div className="w-4 shrink-0"></div>
                                </div>
                            </div>
                        )}
                        
                        {/* Divider */}
                        {idx !== projects.length - 1 && (
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent mt-24"></div>
                        )}
                    </div>
                ))
            )}
        </div>

        {/* Full Screen Modal Gallery */}
        {selectedProject && (
            <div className="fixed inset-0 bg-navy-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                <button 
                    onClick={() => setSelectedProject(null)} 
                    className="fixed top-6 right-6 text-white/50 hover:text-white z-50 transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                    <XIcon className="w-8 h-8"/>
                </button>
                
                <div className="w-full max-w-7xl my-10">
                    <div className="text-center mb-12">
                        <span className="text-gold-500 text-xs tracking-[0.3em] uppercase block mb-2">Galeria de Fotos</span>
                        <h2 className="text-3xl md:text-5xl font-serif text-white mb-2">{selectedProject.title}</h2>
                        <p className="text-white/60 font-light">{new Date(selectedProject.date).toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {selectedProject.gallery.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-sm p-3 shadow-2xl transform transition-transform hover:-translate-y-2 duration-500 group">
                                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                                    <img src={item.imageUrl} className="w-full h-full object-cover filter sepia-[0.1] group-hover:sepia-0 transition-all duration-500" />
                                </div>
                                <div className="pt-6 pb-4 px-2 text-center">
                                    <p className="text-navy-900 font-serif italic text-lg leading-relaxed mb-3">"{item.verse}"</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="h-px w-8 bg-gold-500/50"></div>
                                        <span className="text-[10px] uppercase tracking-widest text-gold-700 font-bold">{item.verseReference}</span>
                                        <div className="h-px w-8 bg-gold-500/50"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {/* Style for custom scrollbar */}
        <style>{`
            .scrollbar-thin::-webkit-scrollbar {
                height: 6px;
            }
            .scrollbar-track-transparent::-webkit-scrollbar-track {
                background: transparent;
            }
            .scrollbar-thumb-gold-400\\/50::-webkit-scrollbar-thumb {
                background-color: rgba(212, 180, 115, 0.5);
                border-radius: 20px;
            }
            .scrollbar-thumb-gold-400\\/50::-webkit-scrollbar-thumb:hover {
                background-color: #C5A059;
            }
        `}</style>
    </div>
  );
};

// Helper for Close Icon
const XIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);