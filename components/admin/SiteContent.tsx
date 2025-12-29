import React, { useState, useEffect } from 'react';
import { SiteContent, ChurchEvent, SocialProject } from '../../types';
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

  // Estados para Importação da Agenda (Dropdown)
  const [agendaEvents, setAgendaEvents] = useState<ChurchEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Estado para importar Projeto Social
  const [socialProjects, setSocialProjects] = useState<SocialProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load Content from Firestore on mount
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

  // Carregar Eventos da Agenda para Importação (Dropdown)
  const loadAgendaEvents = async () => {
    setLoadingEvents(true);
    try {
      const events = await getCollection<ChurchEvent>('events');
      // Filtrar apenas eventos futuros e ordenar
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

  // Carregar Projetos Sociais para Importação
  const loadSocialProjects = async () => {
      setLoadingProjects(true);
      const data = await getCollection<SocialProject>('social_projects');
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSocialProjects(data);
      setLoadingProjects(false);
  };

  const importSocialProject = (project: SocialProject) => {
      if(!confirm(`Deseja substituir o conteúdo da seção "Projeto Social" pelos dados de "${project.title}"?`)) return;
      
      setFormData(prev => ({
          ...prev,
          socialProjectTitle: project.title,
          socialProjectDescription: project.description,
          socialProjectItems: project.gallery.slice(0, 3) // Pegar as 3 primeiras fotos
      }));
  };

  // Função para importar evento selecionado do dropdown
  const importAgendaEvent = (event: ChurchEvent) => {
    if(!confirm(`Deseja atualizar o destaque para o evento "${event.title}"?`)) return;

    const startDate = new Date(event.start);
    
    // Formatar data para YYYY-MM-DD (Input Date)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Formatar hora para HH:MM (Input Time)
    const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setFormData(prev => ({
      ...prev,
      nextEventTitle: event.title,
      nextEventDate: dateStr,
      nextEventTime: timeStr,
      nextEventLocation: event.location,
      nextEventDescription: event.description || ''
    }));
    
    // Limpar lista para fechar dropdown visualmente (opcional, ou manter)
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
        alert("Erro no upload da imagem. Verifique as permissões do Firebase Storage.");
    } finally {
        setUploading(false);
    }
  };

  // --- Lógica de Upload em Lote para Projeto Social com ATRIBUIÇÃO AUTOMÁTICA DE VERSÍCULOS ---
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBatchUploading(true);
    try {
        // 1. Upload das Imagens
        const uploadPromises = Array.from(files).map((file: File) => uploadImage(file, 'social_projects'));
        const newUrls = await Promise.all(uploadPromises);
        
        // 2. O "Teólogo Virtual" atribui versículos
        const newItems = newUrls.map(url => {
            // Pick a random verse from the pool
            const randomVerse = SOCIAL_ACTION_VERSES[Math.floor(Math.random() * SOCIAL_ACTION_VERSES.length)];
            return {
                imageUrl: url,
                verse: randomVerse.text,
                verseReference: randomVerse.ref
            };
        });

        // 3. Atualizar Estado
        setFormData(prev => ({
            ...prev,
            socialProjectItems: [...(prev.socialProjectItems || []), ...newItems]
        }));
    } catch (error) {
        alert("Erro no upload múltiplo de imagens.");
    } finally {
        setBatchUploading(false);
        // Limpa o input
        e.target.value = '';
    }
  };

  const removeSocialItem = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          socialProjectItems: prev.socialProjectItems?.filter((_, index) => index !== indexToRemove)
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSiteContent(formData);
      onUpdate(formData); 
      alert('Conteúdo do site atualizado no Banco de Dados!');
    } catch (error) {
      alert('Erro ao salvar conteúdo.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
     return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy-900"/></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-heading font-bold text-navy-900">Gestão de Conteúdo</h1>
           <p className="text-gray-500 text-sm">Atualize os textos e imagens da página inicial.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading || uploading || batchUploading}>
          {loading ? <Loader2 className="mr-2 animate-spin" size={18}/> : <Save size={18} className="mr-2" />}
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Banner Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-navy-900 mb-4 border-b pb-2 flex items-center gap-2">
            <ImageIcon size={20} className="text-gold-600"/> Banner Principal (Hero)
          </h3>
          
          <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Fundo</label>
             <div className="flex items-start gap-4">
                <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {formData.heroImageUrl ? (
                        <img src={formData.heroImageUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">Sem imagem</div>
                    )}
                </div>
                <div className="flex-1">
                    <input 
                        type="file" 
                        accept="image/*"
                        id="heroImageUpload"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                    <label 
                        htmlFor="heroImageUpload" 
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {uploading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Upload className="mr-2" size={16}/>}
                        {uploading ? 'Enviando...' : 'Carregar Nova Imagem'}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Recomendado: 1920x1080px (JPG/PNG)</p>
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal</label>
              <input 
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                type="text" 
                className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <textarea 
                name="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Botão</label>
              <input 
                name="heroButtonText"
                value={formData.heroButtonText}
                onChange={handleChange}
                type="text" 
                className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Social Project Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center border-b pb-2 mb-4">
                 <h3 className="font-heading font-bold text-lg text-navy-900 flex items-center gap-2">
                    <Heart size={20} className="text-red-500"/> Destaque: Projeto Social
                 </h3>
                 <div className="relative group">
                     <button 
                         type="button" 
                         onClick={loadSocialProjects}
                         className="text-xs bg-navy-50 text-navy-900 px-3 py-1.5 rounded-lg hover:bg-navy-100 flex items-center gap-1 font-medium"
                     >
                        <Download size={14}/> Importar de Projeto
                     </button>
                     {/* Dropdown de Projetos */}
                     {socialProjects.length > 0 && (
                         <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-xl rounded-lg border border-gray-100 z-50 p-1">
                             <p className="text-[10px] text-gray-400 p-2 uppercase tracking-wide">Selecione para importar:</p>
                             {socialProjects.map(p => (
                                 <button 
                                     key={p.id}
                                     type="button"
                                     onClick={() => { importSocialProject(p); setSocialProjects([]); }}
                                     className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex justify-between items-center"
                                 >
                                     <span className="truncate">{p.title}</span>
                                     <span className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString()}</span>
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Projeto</label>
                  <input 
                    name="socialProjectTitle"
                    value={formData.socialProjectTitle || ''}
                    onChange={handleChange}
                    type="text" 
                    placeholder="Ex: Amor em Ação"
                    className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    name="socialProjectDescription"
                    value={formData.socialProjectDescription || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                  />
                </div>
                
                {/* Batch Image Upload + Verses */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Galeria & Versículos</label>
                   <p className="text-xs text-gray-500 mb-3 bg-blue-50 p-2 rounded border border-blue-100">
                      O sistema atribuirá automaticamente um versículo bíblico sobre amor ao próximo para cada foto carregada.
                   </p>
                   
                   <div className="grid grid-cols-2 gap-3 mb-3">
                       {formData.socialProjectItems && formData.socialProjectItems.map((item, idx) => (
                           <div key={idx} className="relative group border border-gray-200 rounded overflow-hidden flex flex-col">
                               <div className="h-24 w-full bg-gray-100">
                                   <img src={item.imageUrl} className="w-full h-full object-cover" />
                               </div>
                               <div className="p-2 text-[10px] bg-gray-50 flex-1">
                                   <p className="font-bold text-navy-900 mb-1 line-clamp-2">"{item.verse}"</p>
                                   <span className="text-gold-600">{item.verseReference}</span>
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => removeSocialItem(idx)}
                                 className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   <X size={12} />
                               </button>
                           </div>
                       ))}
                       
                       <label className={`h-32 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${batchUploading ? 'pointer-events-none opacity-50' : ''}`}>
                           {batchUploading ? <Loader2 className="animate-spin text-navy-900"/> : <Plus className="text-gray-400" />}
                           <span className="text-[10px] text-gray-500 mt-1">{batchUploading ? 'Processando...' : 'Adicionar Fotos'}</span>
                           <input 
                             type="file" 
                             multiple 
                             accept="image/*"
                             className="hidden"
                             onChange={handleBatchImageUpload}
                           />
                       </label>
                   </div>
                </div>
             </div>
        </div>

        {/* Next Event Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h3 className="font-heading font-bold text-lg text-gold-600 flex items-center gap-2">
                <Calendar size={20}/> Destaque: Próximo Evento
             </h3>
             <div className="relative group">
                 <button 
                     type="button" 
                     onClick={loadAgendaEvents}
                     className="text-xs bg-gold-50 text-gold-700 border border-gold-200 px-3 py-1.5 rounded-lg hover:bg-gold-100 flex items-center gap-1 font-medium"
                 >
                    <Download size={14}/> Importar da Agenda
                 </button>
                 {/* Dropdown de Eventos */}
                 {agendaEvents.length > 0 && (
                     <div className="absolute right-0 top-full mt-2 w-72 bg-white shadow-xl rounded-lg border border-gray-100 z-50 p-1 max-h-64 overflow-y-auto">
                         <p className="text-[10px] text-gray-400 p-2 uppercase tracking-wide">Próximos Eventos:</p>
                         {agendaEvents.map(ev => {
                             const d = new Date(ev.start);
                             return (
                               <button 
                                   key={ev.id}
                                   type="button"
                                   onClick={() => importAgendaEvent(ev)}
                                   className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex justify-between items-center group"
                               >
                                   <div className="overflow-hidden">
                                      <span className="truncate font-medium block text-navy-900">{ev.title}</span>
                                      <span className="text-[10px] text-gray-500">{ev.type}</span>
                                   </div>
                                   <div className="text-right flex-shrink-0 ml-2">
                                       <span className="text-xs font-bold text-gold-600 block">{d.getDate()}</span>
                                       <span className="text-[10px] text-gray-400 uppercase">{d.toLocaleDateString('pt-BR', {month:'short'})}</span>
                                   </div>
                               </button>
                             )
                         })}
                     </div>
                 )}
             </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Evento</label>
              <input 
                name="nextEventTitle"
                value={formData.nextEventTitle}
                onChange={handleChange}
                type="text" 
                className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input 
                  name="nextEventDate"
                  value={formData.nextEventDate}
                  onChange={handleChange}
                  type="date" 
                  className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input 
                  name="nextEventTime"
                  value={formData.nextEventTime}
                  onChange={handleChange}
                  type="time" 
                  className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
              <input 
                name="nextEventDescription"
                value={formData.nextEventDescription}
                onChange={handleChange}
                type="text" 
                className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
              <input 
                name="nextEventLocation"
                value={formData.nextEventLocation}
                onChange={handleChange}
                type="text" 
                className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-gray-800 mb-4 border-b pb-2">Links Externos</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link do YouTube (Live)</label>
            <input 
              name="youtubeLiveLink"
              value={formData.youtubeLiveLink}
              onChange={handleChange}
              type="url" 
              placeholder="https://youtube.com/..."
              className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};