
import React, { useState, useEffect } from 'react';
import { SocialProject, SocialProjectItem } from '../../types';
import { Button } from '../ui/Button';
/* Fix: Added CheckCircle2 to the imports from lucide-react to resolve the reference error on line 269 */
import { Plus, Edit2, Trash2, Heart, MapPin, Calendar, Loader2, Image as ImageIcon, X, Upload, Quote as QuoteIcon, CheckCircle2 } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument, uploadImage } from '../../services/firestore';
import { SOCIAL_ACTION_VERSES } from '../../data';

export const AdminSocialProjects: React.FC = () => {
  const [projects, setProjects] = useState<SocialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);

  const initialForm: Omit<SocialProject, 'id'> = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
    status: 'Realizado',
    bannerUrl: '',
    gallery: []
  };
  const [formData, setFormData] = useState(initialForm);

  const inputClass = "w-full border border-gray-300 p-3 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400 font-medium text-sm";
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1";

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
        const data = await getCollection<SocialProject>('social_projects');
        // Ordenar projetos por data descrescente (mais recentes primeiro)
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setProjects(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleOpenModal = (project?: SocialProject) => {
    if (project) {
        setEditingId(project.id);
        const { id, ...rest } = project;
        setFormData(rest);
    } else {
        setEditingId(null);
        setFormData(initialForm);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
      if(confirm("Tem certeza que deseja excluir este projeto social?")) {
          await deleteDocument('social_projects', id);
          setProjects(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!formData.title) return alert("Título é obrigatório");
      setSubmitting(true);
      try {
          if (editingId) {
              await updateDocument('social_projects', editingId, formData);
              setProjects(prev => prev.map(p => p.id === editingId ? { ...formData, id: editingId } : p).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } else {
              const newProject = await addDocument('social_projects', formData);
              setProjects(prev => [newProject as SocialProject, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          }
          setShowModal(false);
      } catch (e) { alert("Erro ao salvar projeto."); } finally { setSubmitting(false); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      try {
          const url = await uploadImage(file, 'social_banners');
          setFormData(prev => ({ ...prev, bannerUrl: url }));
      } catch { alert("Erro no upload do banner."); } finally { setUploadingBanner(false); }
  };

  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBatchUploading(true);
    try {
        const uploadPromises = Array.from(files).map((file: File) => uploadImage(file, 'social_projects_gallery'));
        const newUrls = await Promise.all(uploadPromises);
        
        const newItems = newUrls.map(url => {
            const randomVerse = SOCIAL_ACTION_VERSES[Math.floor(Math.random() * SOCIAL_ACTION_VERSES.length)];
            return {
                imageUrl: url,
                verse: randomVerse.text,
                verseReference: randomVerse.ref
            };
        });

        setFormData(prev => ({
            ...prev,
            gallery: [...(prev.gallery || []), ...newItems]
        }));
    } catch (error) {
        alert("Erro no upload múltiplo de imagens.");
    } finally {
        setBatchUploading(false);
        e.target.value = '';
    }
  };

  const removeGalleryItem = (idx: number) => {
      setFormData(prev => ({
          ...prev,
          gallery: prev.gallery.filter((_, i) => i !== idx)
      }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-navy-900 font-serif">Projetos Sociais</h1>
            <p className="text-sm text-gray-500 font-sans tracking-tight">Registro editorial das ações benevolentes da IBOC.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-glow px-10 rounded-xl font-bold">
            <Plus size={18} className="mr-2" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
              <div className="col-span-full py-32 flex flex-col items-center">
                  <Loader2 className="animate-spin text-gold-500 mb-4" size={48}/>
                  <p className="text-gray-400 italic">Carregando acervo social...</p>
              </div>
          ) : projects.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-400 italic bg-white rounded-3xl border border-dashed border-gray-200">
                  Nenhum projeto social registrado até o momento.
              </div>
          ) : projects.map(p => (
              <div key={p.id} className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
                  <div className="h-48 relative overflow-hidden bg-navy-900">
                      {p.bannerUrl ? (
                          <img src={p.bannerUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt={p.title} />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={48} className="text-white"/></div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-sm text-center">
                          <span className="block text-lg font-serif font-bold text-navy-900">{new Date(p.date).getDate()}</span>
                          <span className="block text-[8px] uppercase tracking-widest text-gold-600 font-bold">{new Date(p.date).toLocaleDateString('pt-BR', {month: 'short'}).toUpperCase()}</span>
                      </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-serif font-bold text-xl text-navy-900 mb-2 group-hover:text-gold-600 transition-colors leading-tight">{p.title}</h3>
                      <p className="text-gray-500 text-sm font-light mb-6 line-clamp-2 italic">"{p.description}"</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 mt-auto">
                          <div className="flex items-center gap-2"><MapPin size={14} className="text-gold-500"/> {p.location || 'Sede IBOC'}</div>
                          <div className="flex items-center gap-2"><ImageIcon size={14} className="text-gold-500"/> {p.gallery?.length || 0} Fotos</div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-50">
                          <button onClick={() => handleOpenModal(p)} className="flex-1 py-2.5 bg-stone-50 hover:bg-navy-900 hover:text-white rounded-xl transition-all text-gray-600 font-bold text-xs uppercase tracking-widest">Editar</button>
                          <button onClick={() => handleDelete(p.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-navy-900/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                  <div className="p-10 border-b border-gray-100 bg-rose-50/20 flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                           <Heart size={32} className="text-white animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-serif font-bold text-navy-900">{editingId ? 'Editar Projeto Social' : 'Nova Ação Social'}</h2>
                          <p className="text-xs text-rose-600 uppercase tracking-[0.3em] mt-1 font-bold">Memória Benevolente da IBOC</p>
                        </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="p-4 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200 shadow-sm"><X size={28} className="text-gray-400"/></button>
                  </div>

                  <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2">
                            <label className={labelClass}>Título do Projeto</label>
                            <input required className={inputClass} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Projeto Amor em Ação" />
                          </div>
                          <div>
                            <label className={labelClass}>Data da Ação</label>
                            <input type="date" required className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                          </div>
                          <div>
                            <label className={labelClass}>Local / Comunidade</label>
                            <input className={inputClass} value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Bairro, Rua ou Sede" />
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelClass}>Relato Editorial (Descrição)</label>
                            <textarea className={inputClass + " h-32 resize-none"} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva o impacto social e espiritual da ação..." />
                          </div>
                      </div>

                      {/* Banner Section */}
                      <div className="space-y-4">
                          <label className={labelClass}>Banner Principal (Capa)</label>
                          <div className="relative h-48 rounded-3xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-200 group flex items-center justify-center">
                              {formData.bannerUrl ? (
                                  <>
                                      <img src={formData.bannerUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-navy-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <label className="cursor-pointer bg-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-navy-900 shadow-xl flex items-center gap-2">
                                              <Upload size={16}/> Trocar Capa
                                              <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                                          </label>
                                      </div>
                                  </>
                              ) : (
                                  <label className="cursor-pointer flex flex-col items-center gap-3">
                                      {uploadingBanner ? <Loader2 className="animate-spin text-gold-500" size={32}/> : <ImageIcon className="text-stone-300" size={48}/>}
                                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{uploadingBanner ? 'Carregando...' : 'Adicionar Foto de Capa'}</span>
                                      <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                                  </label>
                              )}
                          </div>
                      </div>

                      {/* Multiple Photo Gallery Upload */}
                      <div className="space-y-6">
                          <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                              <h4 className="font-serif font-bold text-xl text-navy-900 italic">Galeria de Fotos (Em Lote)</h4>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Os versículos serão atribuídos automaticamente</p>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                              {formData.gallery.map((item, idx) => (
                                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-stone-100 bg-white shadow-sm">
                                      <img src={item.imageUrl} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                          <p className="text-[8px] text-white italic leading-tight mb-2 line-clamp-3">"{item.verse}"</p>
                                          <button type="button" onClick={() => removeGalleryItem(idx)} className="self-end p-2 bg-red-600 text-white rounded-lg shadow-xl"><X size={12}/></button>
                                      </div>
                                  </div>
                              ))}
                              
                              <label className={`aspect-square rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all hover:border-gold-300 ${batchUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                  {batchUploading ? <Loader2 className="animate-spin text-gold-500" size={32}/> : <Plus className="text-stone-300" size={32}/>}
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-2">{batchUploading ? 'Enviando...' : 'Múltiplas Fotos'}</span>
                                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleBatchImageUpload} />
                              </label>
                          </div>
                      </div>

                      <div className="p-10 border-t border-stone-50 bg-stone-50/50 flex justify-end gap-6 rounded-b-[2.5rem]">
                          <button type="button" onClick={() => setShowModal(false)} className="px-12 py-4 rounded-2xl text-gray-500 font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-navy-900 transition-all border border-transparent hover:border-gray-100">Descartar</button>
                          <Button type="submit" disabled={submitting || uploadingBanner || batchUploading} className="px-20 py-4 rounded-2xl shadow-glow font-bold text-sm">
                              {submitting ? <Loader2 className="animate-spin mr-3" size={20}/> : <CheckCircle2 size={20} className="mr-3"/>}
                              {editingId ? 'Atualizar Projeto' : 'Registrar Ação'}
                          </Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
