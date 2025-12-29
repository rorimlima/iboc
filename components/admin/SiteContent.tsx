
import React, { useState, useEffect } from 'react';
import { SiteContent, ChurchEvent, SocialProject, SocialProjectItem } from '../../types';
import { Button } from '../ui/Button';
import { Save, Loader2, Upload, ImageIcon, Calendar, Download, X, Plus, Heart, Trash2 } from 'lucide-react';
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
  const [batchUploading, setBatchUploading] = useState(false);

  const [agendaEvents, setAgendaEvents] = useState<ChurchEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [socialProjects, setSocialProjects] = useState<SocialProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

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
      const futureEvents = events.filter(e => new Date(e.start) >= now);
      futureEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setAgendaEvents(futureEvents);
    } catch (error) {
      alert("Erro ao carregar agenda.");
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadSocialProjects = async () => {
      setLoadingProjects(true);
      const data = await getCollection<SocialProject>('social_projects');
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSocialProjects(data);
      setLoadingProjects(false);
  };

  const importSocialProject = (project: SocialProject) => {
      if(!confirm(`Deseja substituir o destaque pelos dados de "${project.title}"?`)) return;
      
      setFormData(prev => ({
          ...prev,
          socialProjectTitle: project.title,
          socialProjectDescription: project.description,
          socialProjectItems: project.gallery.slice(0, 4)
      }));
  };

  const importAgendaEvent = (event: ChurchEvent) => {
    if(!confirm(`Deseja atualizar o destaque para "${event.title}"?`)) return;

    const startDate = new Date(event.start);
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setFormData(prev => ({
      ...prev,
      nextEventTitle: event.title,
      nextEventDate: dateStr,
      nextEventTime: timeStr,
      nextEventLocation: event.location,
      nextEventDescription: event.description || ''
    }));
    setAgendaEvents([]);
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
    } catch (error) {
        alert("Erro no upload da imagem.");
    } finally {
        setUploading(false);
    }
  };

  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBatchUploading(true);
    try {
        const uploadPromises = Array.from(files).map((file: File) => uploadImage(file, 'social_projects'));
        const newUrls = await Promise.all(uploadPromises);
        
        const now = Date.now();
        const newItems: SocialProjectItem[] = newUrls.map((url, index) => {
            const randomVerse = SOCIAL_ACTION_VERSES[Math.floor(Math.random() * SOCIAL_ACTION_VERSES.length)];
            return {
                imageUrl: url,
                verse: randomVerse.text,
                verseReference: randomVerse.ref,
                registeredAt: now + index
            };
        });

        setFormData(prev => ({
            ...prev,
            socialProjectItems: [...(prev.socialProjectItems || []), ...newItems]
        }));
    } catch (error) {
        alert("Erro no upload múltiplo.");
    } finally {
        setBatchUploading(false);
        e.target.value = '';
    }
  };

  const removeSocialItem = (registeredAt: number) => {
      setFormData(prev => ({
          ...prev,
          socialProjectItems: prev.socialProjectItems?.filter(item => item.registeredAt !== registeredAt)
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSiteContent(formData);
      onUpdate(formData); 
      alert('Conteúdo atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao salvar conteúdo.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy-900"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-heading font-bold text-navy-900">Conteúdo do Site</h1>
           <p className="text-gray-500 text-sm">Controle dos destaques da Home Page.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading || uploading || batchUploading}>
          {loading ? <Loader2 className="mr-2 animate-spin" size={18}/> : <Save size={18} className="mr-2" />}
          {loading ? 'Salvando...' : 'Publicar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Banner Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-navy-900 mb-4 border-b pb-2 flex items-center gap-2">
            <ImageIcon size={20} className="text-gold-600"/> Banner Principal
          </h3>
          <div className="space-y-4">
             <div className="flex items-start gap-4">
                <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {formData.heroImageUrl ? <img src={formData.heroImageUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Sem imagem</div>}
                </div>
                <div className="flex-1">
                    <input type="file" accept="image/*" id="heroImageUpload" className="hidden" onChange={handleImageUpload} />
                    <label htmlFor="heroImageUpload" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        {uploading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Upload className="mr-2" size={16}/>} Carregar Imagem
                    </label>
                </div>
             </div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label><input name="heroTitle" value={formData.heroTitle} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label><textarea name="heroSubtitle" value={formData.heroSubtitle} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" rows={3}/></div>
          </div>
        </div>

        {/* Social Project Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center border-b pb-2 mb-4">
                 <h3 className="font-heading font-bold text-lg text-navy-900 flex items-center gap-2">
                    <Heart size={20} className="text-red-500"/> Destaque Social
                 </h3>
                 <button type="button" onClick={loadSocialProjects} className="text-[10px] bg-navy-50 text-navy-900 px-2 py-1 rounded hover:bg-navy-100 flex items-center gap-1 font-bold uppercase tracking-widest">
                    <Download size={12}/> Importar Projeto
                 </button>
             </div>
             {socialProjects.length > 0 && (
                <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-dashed border-stone-200 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {socialProjects.map(p => (
                        <button key={p.id} onClick={() => { importSocialProject(p); setSocialProjects([]); }} className="text-left text-xs p-2 hover:bg-white rounded border border-transparent hover:border-stone-100 transition-all flex justify-between">
                            <span className="font-bold">{p.title}</span>
                            <span className="text-gray-400">{new Date(p.date).toLocaleDateString()}</span>
                        </button>
                    ))}
                </div>
             )}
             <div className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label><input name="socialProjectTitle" value={formData.socialProjectTitle || ''} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label><textarea name="socialProjectDescription" value={formData.socialProjectDescription || ''} onChange={handleChange} rows={2} className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" /></div>
                
                <div className="grid grid-cols-3 gap-2">
                    {formData.socialProjectItems?.map((item) => (
                        <div key={item.registeredAt} className="relative group rounded overflow-hidden aspect-square border border-gray-100">
                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                            <button onClick={() => removeSocialItem(item.registeredAt)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                        </div>
                    ))}
                    <label className="aspect-square rounded border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                        {batchUploading ? <Loader2 size={16} className="animate-spin text-gold-600" /> : <Plus size={16} className="text-gray-400" />}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleBatchImageUpload} />
                    </label>
                </div>
             </div>
        </div>

        {/* Next Event Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h3 className="font-heading font-bold text-lg text-gold-600 flex items-center gap-2">
                <Calendar size={20}/> Próximo Evento (Destaque)
             </h3>
             <button type="button" onClick={loadAgendaEvents} className="text-[10px] bg-gold-50 text-gold-700 px-2 py-1 rounded hover:bg-gold-100 flex items-center gap-1 font-bold uppercase tracking-widest border border-gold-200">
                <Download size={12}/> Agenda
             </button>
          </div>
          {agendaEvents.length > 0 && (
              <div className="mb-4 p-3 bg-gold-50/30 rounded-lg border border-dashed border-gold-100 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {agendaEvents.map(ev => (
                    <button key={ev.id} onClick={() => importAgendaEvent(ev)} className="text-left text-xs p-2 hover:bg-white rounded border border-transparent hover:border-gold-100 transition-all flex justify-between">
                        <span className="font-bold">{ev.title}</span>
                        <span className="text-gold-600">{new Date(ev.start).toLocaleDateString()}</span>
                    </button>
                ))}
              </div>
          )}
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label><input name="nextEventTitle" value={formData.nextEventTitle} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label><input name="nextEventDate" value={formData.nextEventDate} onChange={handleChange} type="date" className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label><input name="nextEventTime" value={formData.nextEventTime} onChange={handleChange} type="time" className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>
            </div>
          </div>
        </div>

        {/* Live Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">YouTube Live</h3>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link do Canal/Live</label><input name="youtubeLiveLink" value={formData.youtubeLiveLink} onChange={handleChange} type="url" placeholder="https://youtube.com/..." className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900" /></div>
        </div>
      </div>
    </div>
  );
};
