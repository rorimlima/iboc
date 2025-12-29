import React, { useEffect, useState } from 'react';
import { SocialProject } from '../../types';
import { getCollection } from '../../services/firestore';
import { Loader2, Calendar, MapPin, Quote, X, Maximize2 } from 'lucide-react';

const IBOCStamp = () => (
    <div className="absolute bottom-2 right-2 flex flex-col items-center pointer-events-none opacity-60 select-none group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full border border-gold-500/50 flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-sm">
            <svg viewBox="0 0 100 100" className="w-5 h-5">
                <path d="M50 10 L 50 90 M 30 40 L 70 40" stroke="#C5A059" strokeWidth="8" fill="none" />
            </svg>
        </div>
        <span className="text-[5px] text-white font-bold tracking-[0.2em] mt-0.5 drop-shadow-md">IBOC SOCIAL</span>
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
        <div className="relative h-[35vh] flex items-center justify-center text-center px-4 overflow-hidden bg-rose-950">
             <div className="absolute inset-0">
                 <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070" className="w-full h-full object-cover opacity-20" />
                 <div className="absolute inset-0 bg-gradient-to-t from-rose-950 via-rose-900/40 to-transparent" />
             </div>
             <div className="relative z-10 space-y-4 animate-fade-in-up">
                 <h1 className="text-4xl md:text-5xl font-serif text-white">Amor em Ação</h1>
                 <p className="text-rose-100 italic text-sm md:text-lg">"Não amemos de palavra, mas por obra e em verdade."</p>
             </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 py-12 space-y-20">
            {projects.map((project) => (
                <div key={project.id} className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-rose-100 pb-4">
                        <div className="max-w-2xl">
                            <span className="text-gold-600 font-bold text-xs uppercase tracking-widest">Ação Social</span>
                            <h2 className="text-3xl font-serif text-navy-900 mt-1">{project.title}</h2>
                            <p className="text-gray-600 text-sm mt-2">{project.description}</p>
                        </div>
                        <div className="flex gap-4 text-[10px] text-gray-500 font-medium bg-white px-3 py-1.5 rounded-full border border-rose-50">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(project.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><MapPin size={12}/> {project.location}</span>
                        </div>
                    </div>

                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                        {project.gallery.map((item, i) => (
                            <div 
                                key={i} 
                                className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-zoom-in break-inside-avoid"
                                onClick={() => setSelectedImage({url: item.imageUrl, verse: item.verse, ref: item.verseReference})}
                            >
                                <img src={item.imageUrl} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" alt="Galeria" />
                                <IBOCStamp />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 size={16} className="text-white"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {selectedImage && (
            <div className="fixed inset-0 bg-navy-900/95 z-[100] flex flex-col items-center justify-center p-4">
                <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 text-white hover:text-gold-500 transition-colors"><X size={32}/></button>
                <div className="w-full h-[70vh] flex items-center justify-center relative">
                    {/* contain garante que a imagem apareça 100% */}
                    <img src={selectedImage.url} className="max-w-full max-h-full object-contain shadow-2xl" />
                    <div className="absolute bottom-4 right-4 scale-150"><IBOCStamp /></div>
                </div>
                {selectedImage.verse && (
                    <div className="max-w-2xl text-center mt-6 animate-fade-in-up">
                        <Quote size={20} className="text-gold-500 mx-auto mb-2" />
                        <p className="text-white font-serif italic text-lg md:text-xl leading-relaxed">"{selectedImage.verse}"</p>
                        <span className="text-gold-500 text-xs font-bold uppercase tracking-widest mt-2 block">{selectedImage.ref}</span>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};