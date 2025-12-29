
import React, { useState, useEffect } from 'react';
import { SiteContent, ChurchEvent, SocialProject, SocialProjectItem } from '../../types';
import { Button } from '../ui/Button';
import { Save, Loader2, Upload, ImageIcon, Calendar, Download, X, Plus, Heart, Trash2, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { getSiteContent, updateSiteContent, uploadImage, getCollection } from '../../services/firestore';
import { INITIAL_SITE_CONTENT, SOCIAL_ACTION_VERSES } from '../../data';

interface AdminSiteContentProps {
  content: SiteContent;
  onUpdate: (newContent: SiteContent) => void;
}

export const AdminSiteContent: React.FC<AdminSiteContentProps> = ({ content: initialContent, onUpdate }) => {
  const [formData, setFormData] = useState<SiteContent>(initialContent);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingEventBanner, setUploadingEventBanner] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);

  const [agendaEvents, setAgendaEvents] = useState<ChurchEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [socialProjects, setSocialProjects] = useState<SocialProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Estilos globais para inputs garantindo fundo branco e texto escuro
  const inputClass = "w-full border border-gray-200 p-3 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-900 focus:border-transparent focus:outline-none placeholder-gray-400 transition-all text-sm font-medium shadow-sm appearance-none";
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 block ml-1";

  useEffect(() => {
    const loadContent = async () => {
      const data = await getSiteContent();
      if (data) {
        setFormData(data);
        onUpdate(data);
      } else {
        setFormData(INITIAL_SITE_CONTENT);
      }
      setFetching(false);
    };
    loadContent();
  }, [onUpdate]);

  const loadAgendaEvents = async () => {
    setLoadingEvents(true);
    try {
      const events = await getCollection<ChurchEvent>('events');
      const now = new Date();
      // Filtra eventos que ainda vão acontecer
      const futureEvents = events.filter(e => e.start && new Date(e.end || e.start) >= now);
      
      if (futureEvents.length === 0) {
        alert("Não encontramos eventos futuros na agenda.");
      } else {
        futureEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setAgendaEvents(futureEvents);
      }
    } catch (error) {
      alert("Erro ao carregar agenda.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const importAgendaEvent = (event: ChurchEvent) => {
    if (!event.start) return alert("Evento sem data válida.");
    
    setSelectedEventId(event.id);

    try {
        const startDate = new Date(event.start);
        const dateStr = startDate.toISOString().split('T')[0];
        const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

        setFormData(prev => ({
          ...prev,
          nextEventTitle: event.title,
          nextEventDate: dateStr,
          nextEventTime: timeStr,
          nextEventLocation: event.location,
          nextEventDescription: event.description || '',
          nextEventBannerUrl: event.bannerUrl || ''
        }));
        
        // Pequeno delay para feedback visual antes de fechar a lista
        setTimeout(() => {
          setAgendaEvents([]);
          setSelectedEventId(null);
        }, 300);

    } catch (err) {
        alert("Erro no processamento da data.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
        const url = await uploadImage(file, 'site_assets');
        setFormData(prev => ({ ...prev, heroImageUrl: url }));
    } catch { alert("Erro no upload."); } finally { setUploading(false); }
  };

  const handleEventBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEventBanner(true);
    try {
        const url = await uploadImage(file, 'highlight_banners');
        setFormData(prev => ({ ...prev, nextEventBannerUrl: url }));
    } catch { alert("Erro no upload."); } finally { setUploadingEventBanner(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSiteContent(formData);
      onUpdate(formData); 
      alert('Destaques publicados com sucesso!');
    } catch { alert('Erro ao salvar conteúdo.'); } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="animate-spin text-navy-900" size={40}/>
      <p className="text-gray-400 font-medium italic">Sincronizando Conteúdo...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-navy-900 font-serif">Gestão de Destaques</h1>
           <p className="text-sm text-gray-500">Controle o que aparece na vitrine da IBOC.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading || uploading || batchUploading || uploadingEventBanner} className="shadow-glow px-10 rounded-xl font-bold">
          {loading ? <Loader2 className="mr-2 animate-spin" size={18}/> : <Save size={18} className="mr-2" />}
          {loading ? 'PUBLICANDO...' : 'PUBLICAR NO SITE'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção Banner de Boas-Vindas */}
        <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 space-y-6">
          <h3 className="font-serif font-bold text-xl text-navy-900 flex items-center gap-3">
            <ImageIcon size={24} className="text-gold-500"/> Banner de Entrada (Hero)
          </h3>
          <div className="space-y-6">
             <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-50 border border-gray-100 group">
                {formData.heroImageUrl ? (
                  <img src={formData.heroImageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <ImageIcon size={40} className="opacity-20 mb-2"/>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Sem Imagem</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-navy-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-navy-900 px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl uppercase tracking-widest flex items-center gap-2">
                        {uploading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>} 
                        {uploading ? 'Enviando...' : 'Alterar Imagem'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>
             </div>
            <div>
              <label className={labelClass}>Título de Boas-Vindas</label>
              <input name="heroTitle" value={formData.heroTitle} onChange={handleChange} className={inputClass} placeholder="EX: UM LUGAR DE FÉ E AMOR" />
            </div>
            <div>
              <label className={labelClass}>Subtítulo / Chamada</label>
              <textarea name="heroSubtitle" value={formData.heroSubtitle} onChange={handleChange} className={`${inputClass} h-24 resize-none`} rows={3} placeholder="Descreva o propósito da nossa igreja..."/>
            </div>
          </div>
        </div>

        {/* Seção Destaque Semanal - FERRAMENTA DE IMPORTAÇÃO */}
        <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
             <h3 className="font-serif font-bold text-xl text-gold-600 flex items-center gap-3">
               <Calendar size={24}/> Destaque Semanal
             </h3>
             <button 
              type="button" 
              onClick={loadAgendaEvents} 
              className="text-[10px] bg-gold-50 text-gold-700 px-4 py-2 rounded-xl hover:bg-gold-100 font-bold uppercase tracking-widest border border-gold-200 transition-all flex items-center gap-2"
             >
                {loadingEvents ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>} 
                {loadingEvents ? 'Carregando...' : 'Sincronizar Agenda'}
             </button>
          </div>

          {agendaEvents.length > 0 && (
              <div className="p-4 bg-gold-50/40 rounded-2xl border border-dashed border-gold-200 space-y-2 max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-gold-700 uppercase tracking-widest">Selecione para importar:</span>
                  <button onClick={() => setAgendaEvents([])} className="text-gold-400 hover:text-gold-700"><X size={16}/></button>
                </div>
                <div className="grid gap-2">
                  {agendaEvents.map(ev => (
                      <button 
                        key={ev.id} 
                        onClick={() => importAgendaEvent(ev)} 
                        className={`w-full text-left text-xs p-4 bg-white hover:bg-navy-900 hover:text-white rounded-xl border border-gold-100 transition-all flex justify-between items-center group shadow-sm ${selectedEventId === ev.id ? 'ring-2 ring-gold-500 bg-gold-50' : ''}`}
                      >
                          <div className="flex flex-col">
                            <span className="font-bold text-navy-900 group-hover:text-white">{ev.title}</span>
                            <span className="text-[10px] opacity-60 flex items-center gap-1 mt-1">
                              <MapPin size={10}/> {ev.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="block font-bold opacity-80">{new Date(ev.start).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                                <span className="block opacity-60 text-[10px]">{new Date(ev.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              {selectedEventId === ev.id ? <CheckCircle2 size={18} className="text-green-500 animate-in zoom-in"/> : <Plus size={16} className="text-gold-400 group-hover:text-white"/>}
                          </div>
                      </button>
                  ))}
                </div>
              </div>
          )}

          <div className="space-y-6">
            <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-50 border border-gray-100 group">
                {formData.nextEventBannerUrl ? (
                  <img src={formData.nextEventBannerUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <ImageIcon size={40} className="opacity-20 mb-2"/>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Banner do Evento</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-navy-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-navy-900 px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl uppercase tracking-widest flex items-center gap-2">
                        {uploadingEventBanner ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>} 
                        {uploadingEventBanner ? 'Enviando...' : 'Carregar Banner'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleEventBannerUpload} />
                    </label>
                </div>
            </div>

            <div>
              <label className={labelClass}>Título do Destaque</label>
              <input name="nextEventTitle" value={formData.nextEventTitle} onChange={handleChange} className={inputClass} placeholder="EX: CONFERÊNCIA DE FAMÍLIA" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Data Fixada</label>
                <input name="nextEventDate" value={formData.nextEventDate} onChange={handleChange} type="date" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Horário Previsto</label>
                <input name="nextEventTime" value={formData.nextEventTime} onChange={handleChange} type="time" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Local do Encontro</label>
              <input name="nextEventLocation" value={formData.nextEventLocation} onChange={handleChange} className={inputClass} placeholder="EX: TEMPLO PRINCIPAL" />
            </div>
            <div>
              <label className={labelClass}>Convite Curto (Descrição)</label>
              <textarea name="nextEventDescription" value={formData.nextEventDescription} onChange={handleChange} className={`${inputClass} h-24 resize-none`} rows={3} placeholder="Texto curto que convida as pessoas para o destaque..."/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
