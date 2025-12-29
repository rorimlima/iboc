import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { Clock, MapPin, Calendar, CalendarPlus, Quote as QuoteIcon, Users, ChevronRight, ChevronLeft, Heart } from 'lucide-react';
import { PageView, SiteContent, ChurchEvent, SocialProject } from '../../types';
import { INSPIRATIONAL_QUOTES } from '../../data';
import { getCollection } from '../../services/firestore';

interface HomeProps {
  onNavigate: (page: PageView) => void;
  content: SiteContent;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, content }) => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [latestSocialProject, setLatestSocialProject] = useState<SocialProject | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        const eventsData = await getCollection<ChurchEvent>('events');
        const now = new Date();
        const futureEvents = eventsData.filter(e => new Date(e.end) >= now);
        futureEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setEvents(futureEvents);

        const projectsData = await getCollection<SocialProject>('social_projects');
        if (projectsData.length > 0) {
            projectsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setLatestSocialProject(projectsData[0]);
        }
    };
    fetchData();
  }, []);

  const openMap = () => {
    const address = "R. Icaraçu, 1110 - Barroso, Fortaleza - CE, 60862-735";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleAddToCalendar = (event: ChurchEvent) => {
    const startDateTime = new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDateTime = new Date(event.end).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('dates', `${startDateTime}/${endDateTime}`);
    url.searchParams.append('details', event.description || '');
    url.searchParams.append('location', event.location || "IBOC");
    window.open(url.toString(), '_blank');
  };

  const dailyQuote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return INSPIRATIONAL_QUOTES[dayOfYear % INSPIRATIONAL_QUOTES.length];
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () => { if(scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' }); };
  const scrollRight = () => { if(scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' }); };

  const upcomingEvent = events.length > 0 ? events[0] : null;
  const carouselEvents = events.length > 1 ? events.slice(1) : [];

  return (
    <div className="flex flex-col w-full bg-stone-50">
      
      {/* Hero Section - Refined Animations */}
      <section className="relative min-h-[600px] md:h-[80vh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img 
             src={content.heroImageUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"} 
             alt="Sanctuary" 
             className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-105"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-navy-900/40 via-navy-900/20 to-navy-900/80 mix-blend-multiply" />
           <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-20 max-w-4xl mx-auto space-y-8 pt-12">
          
          <RevealOnScroll className="transition-all duration-1000">
            <div className="inline-flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-white/60"></div>
              <span className="text-white/90 font-sans tracking-[0.4em] uppercase text-xs md:text-sm">Bem-vindo à IBOC</span>
              <div className="h-[1px] w-12 bg-white/60"></div>
            </div>
          </RevealOnScroll>
          
          <RevealOnScroll delay={300} className="transition-all duration-1000">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight drop-shadow-lg">
              {content.heroTitle}
            </h1>
          </RevealOnScroll>
          
          <RevealOnScroll delay={600} className="transition-all duration-1000">
            <p className="text-white/90 text-lg md:text-2xl font-light max-w-2xl mx-auto font-sans leading-relaxed">
              {content.heroSubtitle}
            </p>
          </RevealOnScroll>
          
          <RevealOnScroll delay={900} className="transition-all duration-1000">
            <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" variant="secondary" onClick={() => onNavigate(PageView.PUBLIC_ABOUT)} className="min-w-[180px] shadow-glow hover:scale-105 transition-transform duration-300">
                {content.heroButtonText}
              </Button>
              <button 
                onClick={() => onNavigate(PageView.PUBLIC_CONTACT)}
                className="text-white border-b border-white/50 hover:border-white pb-1 transition-all text-sm uppercase tracking-widest hover:text-gold-200"
              >
                Planeje sua Visita
              </button>
            </div>
          </RevealOnScroll>

        </div>
      </section>

      {/* Quick Info Bar - Removed YouTube/Ao Vivo Column */}
      <div className="container mx-auto px-4 relative z-30 -mt-16 mb-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-soft grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden border border-gray-50">
            {[
                { icon: Clock, title: "Horários de Culto", desc: "Qua & Sex 19h30 | Dom 18h", action: null },
                { icon: MapPin, title: "Onde Estamos", desc: "R. Icaraçu, 1110 - Barroso, Fortaleza", action: openMap }
            ].map((item, idx) => (
                <div key={idx} onClick={item.action || undefined} className={`p-8 flex items-center gap-6 hover:bg-stone-50 transition-colors group ${item.action ? 'cursor-pointer' : ''}`}>
                    <div className="text-gold-500 group-hover:scale-110 transition-transform duration-300">
                        <item.icon size={32} strokeWidth={1.2} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-xl text-navy-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 font-light leading-relaxed">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

       {/* Agenda Section */}
       {events.length > 0 && (
          <section className="py-16 bg-stone-50 overflow-hidden">
             <div className="container mx-auto px-6">
                
                <div className="mb-10 text-left">
                   <span className="text-gold-600 font-sans font-bold tracking-[0.2em] uppercase text-xs">Nossa Agenda</span>
                   <h2 className="text-3xl md:text-4xl font-serif text-navy-900 mt-3">Vida em Comunidade</h2>
                   <p className="text-gray-500 font-light mt-2">Participe dos nossos encontros e fortaleça sua fé.</p>
                </div>

                {upcomingEvent && (
                    <RevealOnScroll>
                        <div className="bg-navy-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px] mb-16">
                            <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center relative">
                                <div className="absolute top-0 left-0 p-[200px] bg-gold-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                                
                                <div className="relative z-10">
                                    <span className="text-gold-500 font-sans font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
                                        Próximo Grande Encontro
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-serif text-white mb-6 leading-tight">
                                        {upcomingEvent.title}
                                    </h2>
                                    <p className="text-gray-300 mb-10 text-lg font-light leading-relaxed border-l-2 border-gold-500 pl-6 line-clamp-3">
                                        {upcomingEvent.description || "Venha participar deste momento especial de comunhão e adoração."}
                                    </p>
                                    
                                    <div className="space-y-5 mb-10 text-white/80 font-light">
                                        <div className="flex items-center gap-4">
                                            <Calendar className="text-gold-500" size={20}/>
                                            <span className="text-lg capitalize">
                                                {new Date(upcomingEvent.start).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Clock className="text-gold-500" size={20}/>
                                            <span className="text-lg">
                                                {new Date(upcomingEvent.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <MapPin className="text-gold-500" size={20}/>
                                            <span className="text-lg">{upcomingEvent.location}</span>
                                        </div>
                                    </div>

                                    <Button variant="secondary" onClick={() => handleAddToCalendar(upcomingEvent)} className="w-full md:w-auto text-navy-900 shadow-glow">
                                        <CalendarPlus className="mr-2" size={18} /> Confirmar Presença
                                    </Button>
                                </div>
                            </div>
                            <div className="md:w-1/2 relative min-h-[300px]">
                                <img 
                                    src={upcomingEvent.bannerUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-overlay md:mix-blend-normal transition-transform duration-[20s] hover:scale-105" 
                                    alt={upcomingEvent.title} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-navy-900/90 md:to-navy-900"></div>
                            </div>
                        </div>
                    </RevealOnScroll>
                )}

                {carouselEvents.length > 0 && (
                    <div className="relative">
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="text-xl font-serif text-navy-900 italic">Mais na Agenda</h3>
                             <div className="flex gap-3">
                                <button onClick={scrollLeft} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-all"><ChevronLeft size={20}/></button>
                                <button onClick={scrollRight} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-navy-900 hover:text-white hover:border-navy-900 transition-all"><ChevronRight size={20}/></button>
                             </div>
                        </div>

                        <div 
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto pb-10 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                        {carouselEvents.map((event) => {
                            const startDate = new Date(event.start);
                            return (
                                <div key={event.id} className="min-w-[280px] sm:min-w-[320px] bg-white rounded-t-2xl rounded-b-lg shadow-sm hover:shadow-lg transition-all duration-500 snap-center group border border-gray-100/50">
                                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                                    <img 
                                        src={event.bannerUrl || "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop"} 
                                        alt={event.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-navy-900/10 group-hover:bg-navy-900/20 transition-colors" />
                                    
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg text-center shadow-sm border border-gold-100">
                                        <span className="block text-2xl font-serif text-navy-900 leading-none">{startDate.getDate()}</span>
                                        <span className="block text-[10px] uppercase tracking-widest text-gold-600 mt-1">{startDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
                                    </div>
                                    </div>
                                    
                                    <div className="p-6">
                                    <div className="mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 border border-gold-200 px-2 py-1 rounded-full">{event.type}</span>
                                    </div>
                                    <h3 className="text-xl font-serif text-navy-900 mb-3 group-hover:text-gold-600 transition-colors line-clamp-2 min-h-[3.5rem]">{event.title}</h3>
                                    
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-3 text-gray-500 text-sm font-light">
                                            <Clock size={16} className="text-gold-500" />
                                            <span>{startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-500 text-sm font-light">
                                            <MapPin size={16} className="text-gold-500" />
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Users size={12} /> Equipe
                                        </p>
                                        <div className="flex -space-x-2">
                                            {event.roster && event.roster.length > 0 ? event.roster.slice(0,4).map((r, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-navy-900 font-bold overflow-hidden" title={r.memberName}>
                                                    {r.photoUrl ? <img src={r.photoUrl} className="w-full h-full object-cover"/> : r.memberName.charAt(0)}
                                                </div>
                                            )) : <span className="text-sm text-gray-400 italic font-light">A confirmar</span>}
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}
             </div>
          </section>
       )}

      {latestSocialProject && (
          <section className="py-20 bg-stone-100">
             <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="lg:w-1/3 space-y-6 text-center lg:text-left lg:sticky lg:top-24">
                        <span className="text-gold-600 font-sans font-bold tracking-[0.2em] uppercase text-xs flex items-center justify-center lg:justify-start gap-2">
                            <Heart size={14} className="fill-current"/> Projeto Social
                        </span>
                        <h2 className="text-4xl md:text-5xl font-serif text-navy-900 leading-tight">
                            {latestSocialProject.title}
                        </h2>
                        <div className="w-16 h-1 bg-gold-500 mx-auto lg:mx-0"></div>
                        <p className="text-gray-600 font-light text-lg leading-relaxed">
                            {latestSocialProject.description}
                        </p>
                        <div className="pt-4 flex flex-col gap-2">
                            <Button variant="outline" onClick={() => onNavigate(PageView.PUBLIC_SOCIAL)} className="border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white transition-all">
                                Ver Todos os Projetos
                            </Button>
                        </div>
                    </div>

                    <div className="lg:w-2/3 w-full">
                        {latestSocialProject.gallery && latestSocialProject.gallery.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {latestSocialProject.gallery.slice(0, 4).map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`rounded-xl overflow-hidden shadow-md group relative bg-white flex flex-col h-full hover:shadow-xl transition-shadow duration-500`}
                                    >
                                        <div className="h-64 overflow-hidden relative">
                                            <img 
                                                src={item.imageUrl} 
                                                alt={`Ação Social ${idx + 1}`} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-navy-900/10 group-hover:bg-navy-900/0 transition-colors"></div>
                                        </div>
                                        
                                        <div className="p-6 flex-1 flex flex-col justify-center text-center bg-white relative z-10 border-t border-gray-100">
                                            <QuoteIcon size={20} className="text-gold-400 mx-auto mb-3 opacity-50" />
                                            <p className="text-navy-900 font-serif italic text-lg leading-relaxed mb-3">
                                                "{item.verse}"
                                            </p>
                                            <span className="text-[10px] uppercase tracking-widest text-gold-600 font-bold block">
                                                {item.verseReference}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                                <img 
                                    src={latestSocialProject.bannerUrl || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070"} 
                                    className="w-full h-full object-cover rounded-xl"
                                    alt="Projeto Social"
                                />
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </section>
      )}

      <section className="relative py-32 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full z-0">
            <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1505481353724-5c91dc5725f4?q=80&w=2070"
            >
                <source src="https://cdn.coverr.co/videos/coverr-sun-shining-through-trees-in-forest-4554/1080p.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-stone-50/60 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white opacity-80"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
           <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-10 md:p-16 text-center shadow-soft relative overflow-hidden group">
                
                <div className="mb-8 flex justify-center">
                    <div className="w-14 h-14 rounded-full border border-gold-500/30 flex items-center justify-center bg-white/50 backdrop-blur-sm shadow-sm">
                        <QuoteIcon size={24} className="text-gold-500 fill-current" />
                    </div>
                </div>

                <blockquote className="font-serif text-2xl md:text-4xl text-navy-900 leading-relaxed mb-10 relative drop-shadow-sm">
                    "{dailyQuote.text}"
                </blockquote>

                <div className="flex flex-col items-center">
                    <div className="w-20 h-px bg-gold-500 mb-5"></div>
                    <cite className="font-sans font-bold text-lg text-gold-700 not-italic tracking-widest uppercase">
                        {dailyQuote.author}
                    </cite>
                    {dailyQuote.source && (
                        <span className="text-xs text-gray-500 mt-2 font-light italic opacity-80">{dailyQuote.source}</span>
                    )}
                     <span className="mt-8 px-4 py-1.5 bg-navy-900/5 border border-navy-900/10 text-navy-800 text-[10px] rounded-full uppercase tracking-[0.2em] hover:bg-navy-900/10 transition-colors cursor-default font-medium">
                      {dailyQuote.type === 'Bible' ? 'Palavra do Dia' : 'Reflexão'}
                  </span>
                </div>
           </div>
        </div>
      </section>

      <section className="py-24 bg-navy-900 text-white relative overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
         <div className="absolute top-0 right-0 p-[300px] bg-gold-600/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
         
         <div className="container mx-auto px-6 relative z-10 text-center max-w-2xl">
            <span className="text-gold-500 font-sans tracking-[0.3em] uppercase text-xs mb-4 block">Uma Família de Fé</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight">Há um lugar para você aqui</h2>
            <p className="text-gray-300 text-lg font-light leading-relaxed mb-10">
                Independentemente da sua história ou momento de vida, queremos caminhar junto com você em sua jornada com Deus.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="secondary" size="lg" onClick={() => onNavigate(PageView.PUBLIC_CONTACT)} className="shadow-glow">Agende uma Visita</Button>
                <Button variant="outline" className="text-white border-white/30 hover:bg-white hover:text-navy-900 hover:border-white">Conheça Nossos Ministérios</Button>
            </div>
         </div>
      </section>
    </div>
  );
};