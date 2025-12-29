
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { Clock, MapPin, Calendar, CalendarPlus, Quote as QuoteIcon, ChevronRight, ChevronLeft, Heart, Image as ImageIcon } from 'lucide-react';
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
        const futureEvents = eventsData.filter(e => {
            if (!e.start) return false;
            return new Date(e.end || e.start) >= now;
        });
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
    if (!event.start) return;
    try {
        const startDateTime = new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endDateTime = new Date(event.end || event.start).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const url = new URL('https://calendar.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', event.title);
        url.searchParams.append('dates', `${startDateTime}/${endDateTime}`);
        url.searchParams.append('details', event.description || '');
        url.searchParams.append('location', event.location || "IBOC");
        window.open(url.toString(), '_blank');
    } catch (e) {
        console.error("Erro ao gerar link de calendário", e);
    }
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

  // DESTAQUE DINÂMICO: Usa estritamente o que a liderança configurou ou cai para o próximo da agenda
  const upcomingEvent = useMemo(() => {
    // Se a liderança preencheu o título do destaque no painel, ele é soberano
    if (content.nextEventTitle && content.nextEventTitle !== "Conferência de Família" || content.nextEventBannerUrl) {
      return {
        id: 'featured-manual',
        title: content.nextEventTitle,
        start: `${content.nextEventDate}T${content.nextEventTime || '19:00'}:00`,
        end: `${content.nextEventDate}T${content.nextEventTime || '19:00'}:00`,
        location: content.nextEventLocation,
        description: content.nextEventDescription,
        bannerUrl: content.nextEventBannerUrl,
        type: 'Destaque'
      } as ChurchEvent;
    }
    // Caso contrário, pega o primeiro da agenda automatizada
    return events.length > 0 ? events[0] : null;
  }, [content, events]);

  const carouselEvents = useMemo(() => {
      // Se estamos com destaque manual, mostramos todos os da agenda no carrossel
      if (upcomingEvent?.id === 'featured-manual') return events;
      // Se o destaque é o primeiro da agenda, mostramos o resto
      return events.length > 1 ? events.slice(1) : [];
  }, [upcomingEvent, events]);

  return (
    <div className="flex flex-col w-full bg-stone-50">
      
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:h-[85vh] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img 
             src={content.heroImageUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"} 
             alt="Sanctuary" 
             className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-105"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-navy-900/40 via-navy-900/20 to-navy-900/90" />
        </div>

        <div className="relative z-20 max-w-4xl mx-auto space-y-8 pt-12">
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="inline-flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-gold-500/50"></div>
              <span className="text-white/90 font-sans tracking-[0.4em] uppercase text-xs md:text-sm font-medium">Igreja Batista O Caminho</span>
              <div className="h-[1px] w-12 bg-gold-500/50"></div>
            </div>
          </div>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight drop-shadow-2xl">
              {content.heroTitle}
            </h1>
          </div>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <p className="text-white/90 text-lg md:text-2xl font-light max-w-2xl mx-auto font-sans leading-relaxed">
              {content.heroSubtitle}
            </p>
          </div>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" variant="secondary" onClick={() => onNavigate(PageView.PUBLIC_ABOUT)} className="min-w-[200px] shadow-glow hover:scale-105 transition-all duration-300 rounded-xl">
                {content.heroButtonText}
              </Button>
              <button 
                onClick={() => onNavigate(PageView.PUBLIC_CONTACT)}
                className="text-white border-b border-white/30 hover:border-gold-400 pb-1 transition-all text-sm uppercase tracking-widest hover:text-gold-400 font-medium"
              >
                Planeje sua Visita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <div className="container mx-auto px-4 relative z-30 -mt-16 mb-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-soft grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden border border-gray-100/50">
            {[
                { icon: Clock, title: "Horários de Culto", desc: "Quarta & Sexta 19h30 | Domingo 18h", action: null },
                { icon: MapPin, title: "Onde Estamos", desc: "R. Icaraçu, 1110 - Barroso, Fortaleza", action: openMap }
            ].map((item, idx) => (
                <div key={idx} onClick={item.action || undefined} className={`p-10 flex items-center gap-6 hover:bg-stone-50 transition-colors group ${item.action ? 'cursor-pointer' : ''}`}>
                    <div className="text-gold-500 group-hover:scale-110 transition-transform duration-500 bg-gold-50 p-4 rounded-full">
                        <item.icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-xl text-navy-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 font-light leading-relaxed">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {upcomingEvent && (
          <section className="py-24 bg-stone-50 overflow-hidden">
             <div className="container mx-auto px-6">
                <div className="mb-12 text-left">
                   <span className="text-gold-600 font-sans font-bold tracking-[0.2em] uppercase text-xs">Agenda Ministerial</span>
                   <h2 className="text-3xl md:text-5xl font-serif text-navy-900 mt-3">Vida em Comunidade</h2>
                   <div className="w-16 h-1 bg-gold-500 mt-4"></div>
                </div>

                <RevealOnScroll>
                    <div className="bg-navy-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px] mb-20 group">
                        <div className="md:w-1/2 p-10 md:p-20 flex flex-col justify-center relative">
                            <div className="relative z-10">
                                <span className="text-gold-500 font-sans font-bold tracking-[0.3em] uppercase text-[10px] mb-6 block border-l-2 border-gold-500 pl-4">
                                    Destaque da Semana
                                </span>
                                <h2 className="text-4xl md:text-6xl font-serif text-white mb-8 leading-tight">
                                    {upcomingEvent.title}
                                </h2>
                                <p className="text-gray-400 mb-12 text-lg font-light leading-relaxed">
                                    {upcomingEvent.description || "Convidamos você e sua família para um momento inesquecível de adoração."}
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                                    <div className="flex items-center gap-4 text-white/90">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-gold-500"><Calendar size={20}/></div>
                                        <span className="text-base font-medium capitalize">
                                            {upcomingEvent.start ? new Date(upcomingEvent.start).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' }) : '---'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-white/90">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-gold-500"><Clock size={20}/></div>
                                        <span className="text-base font-medium">
                                            {upcomingEvent.start ? new Date(upcomingEvent.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                                        </span>
                                    </div>
                                </div>

                                <Button variant="secondary" onClick={() => handleAddToCalendar(upcomingEvent)} className="w-full md:w-auto text-navy-900 shadow-glow rounded-xl px-12 py-5 font-bold">
                                    <CalendarPlus className="mr-3" size={20} /> Adicionar à Agenda
                                </Button>
                            </div>
                        </div>
                        <div className="md:w-1/2 relative min-h-[350px]">
                            <img 
                                src={upcomingEvent.bannerUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" 
                                alt={upcomingEvent.title} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-navy-900/10 to-navy-900"></div>
                        </div>
                    </div>
                </RevealOnScroll>

                {carouselEvents.length > 0 && (
                    <div className="relative">
                        <div className="flex justify-between items-center mb-8 px-2">
                             <h3 className="text-2xl font-serif text-navy-900 italic">Outros Encontros</h3>
                             <div className="flex gap-4">
                                <button onClick={scrollLeft} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-navy-900 hover:text-white transition-all shadow-sm bg-white"><ChevronLeft size={24}/></button>
                                <button onClick={scrollRight} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-navy-900 hover:text-white transition-all shadow-sm bg-white"><ChevronRight size={24}/></button>
                             </div>
                        </div>

                        <div ref={scrollContainerRef} className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {carouselEvents.map((event) => {
                                const startDate = event.start ? new Date(event.start) : new Date();
                                return (
                                    <div key={event.id} className="min-w-[300px] sm:min-w-[350px] bg-white rounded-3xl shadow-soft hover:shadow-xl transition-all duration-500 snap-center group border border-gray-100 flex flex-col h-full">
                                        <div className="relative h-56 overflow-hidden rounded-t-3xl">
                                            <img src={event.bannerUrl || "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop"} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-center shadow-xl border border-gold-100/50">
                                                <span className="block text-2xl font-serif text-navy-900 leading-none font-bold">{startDate.getDate()}</span>
                                                <span className="block text-[10px] uppercase tracking-widest text-gold-600 mt-1 font-bold">{startDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <div className="mb-4"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600 bg-gold-50 px-3 py-1 rounded-full">{event.type}</span></div>
                                            <h3 className="text-2xl font-serif text-navy-900 mb-4 group-hover:text-gold-600 transition-colors line-clamp-2 min-h-[4rem] leading-tight">{event.title}</h3>
                                            <div className="space-y-3 mb-8 text-gray-500 text-sm font-light">
                                                <div className="flex items-center gap-3"><Clock size={16} className="text-gold-500" /><span>{startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                                <div className="flex items-center gap-3"><MapPin size={16} className="text-gold-500" /><span className="truncate">{event.location}</span></div>
                                            </div>
                                            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                                <button onClick={() => handleAddToCalendar(event)} className="text-gold-600 hover:text-navy-900 transition-colors"><CalendarPlus size={20}/></button>
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
    </div>
  );
};
