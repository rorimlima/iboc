import React, { useState, useEffect } from 'react';
import { SocialProject, SocialProjectItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Edit2, Trash2, Heart, MapPin, Calendar, Loader2, Image as ImageIcon, X, Upload, Quote as QuoteIcon } from 'lucide-react';
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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await getCollection<SocialProject>('social_projects');
    // Sort by Date Desc
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setProjects(data);
    setLoading(false);
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
      if(confirm("Tem certeza que deseja excluir este projeto?")) {
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
              setProjects(prev => prev.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
          } else {
              const newProject = await addDocument('social_projects', formData);
              setProjects(prev => [newProject as SocialProject, ...prev]);
          }
          setShowModal(false);
      } catch (e) {
          alert("Erro ao salvar projeto.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      try {
          const url = await uploadImage(file, 'social_banners');
          setFormData(prev => ({ ...prev, bannerUrl: url }));
      } catch (e) {
          alert("Erro no upload do banner.");
      } finally {
          setUploadingBanner(false);
      }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      setBatchUploading(true);
      try {
          const promises = Array.from(files).map((file: File) => uploadImage(file, 'social_gallery'));
          const urls = await Promise.all(promises);

          // Assign Random Verses
          const newItems: SocialProjectItem[] = urls.map(url => {
              const randomVerse = SOCIAL_ACTION_VERSES[Math.floor(Math.random() * SOCIAL_ACTION_VERSES.length)];
              return {
                  imageUrl: url,
                  verse: randomVerse.text,
                  verseReference: randomVerse.ref
              };
          });

          setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newItems] }));
      } catch (e) {
          alert("Erro no upload da galeria.");
      } finally {
          setBatchUploading(false);
      }
  };

  const removeGalleryItem = (index: number) => {
      setFormData(prev => ({
          ...prev,
          gallery: prev.gallery.filter((_, i) => i !== index)
      }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-navy-900">Projetos Sociais</h1>
          <p className="text-gray-500 text-sm">Registre ações de amor ao próximo.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
            <Plus size={18} className="mr-2" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
              <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-navy-900"/></div>
          ) : projects.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  Nenhum projeto registrado.
              </div>
          ) : (
              projects.map(project => (
                  <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      <div className="h-40 relative bg-gray-100">
                          {project.bannerUrl ? (
                              <img src={project.bannerUrl} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300"><Heart size={48} /></div>
                          )}
                          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded shadow-sm ${project.status === 'Realizado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {project.status}
                          </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-heading font-bold text-lg text-navy-900 mb-2">{project.title}</h3>
                          <div className="text-sm text-gray-500 space-y-1 mb-4 flex-1">
                              <div className="flex items-center gap-2"><Calendar size={14}/> {new Date(project.date).toLocaleDateString()}</div>
                              <div className="flex items-center gap-2"><MapPin size={14}/> {project.location || 'Local não informado'}</div>
                              <div className="flex items-center gap-2"><ImageIcon size={14}/> {project.gallery.length} fotos</div>
                          </div>
                          
                          <div className="flex gap-2 pt-4 border-t border-gray-100">
                              <button onClick={() => handleOpenModal(project)} className="flex-1 py-2 text-sm text-navy-900 bg-gray-50 hover:bg-gray-100 rounded flex items-center justify-center gap-2 font-medium">
                                  <Edit2 size={16}/> Editar
                              </button>
                              <button onClick={() => handleDelete(project.id)} className="flex-1 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded flex items-center justify-center gap-2 font-medium">
                                  <Trash2 size={16}/> Excluir
                              </button>
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-rose-50 rounded-t-xl">
                      <h3 className="font-heading font-bold text-lg text-rose-900">{editingId ? 'Editar Projeto' : 'Novo Projeto Social'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="text-gray-400"/></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div className="flex justify-center mb-4">
                           <div className="w-full h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                               {formData.bannerUrl ? (
                                   <img src={formData.bannerUrl} className="w-full h-full object-cover" />
                               ) : (
                                   <div className="text-center text-gray-400">
                                       <Heart size={32} className="mx-auto mb-2 opacity-50"/>
                                       <span className="text-sm">Banner do Projeto</span>
                                   </div>
                               )}
                               <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                   {uploadingBanner ? <Loader2 className="animate-spin"/> : <Upload size={24}/>}
                                   <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                               </label>
                           </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700">Título</label>
                          <input required className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Sopão Solidário"/>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Data</label>
                              <input required type="date" className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Status</label>
                              <select className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                  <option value="Planejamento">Planejamento</option>
                                  <option value="Realizado">Realizado</option>
                              </select>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Local</label>
                          <input className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ex: Comunidade do Barroso"/>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700">Descrição</label>
                          <textarea className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva como foi a ação..."/>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-gray-700 text-sm">Galeria de Fotos</h4>
                              <label className={`bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-rose-700 flex items-center gap-2 ${batchUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                  {batchUploading ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>} Adicionar Fotos
                                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                              </label>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                              {formData.gallery.map((item, idx) => (
                                  <div key={idx} className="relative group rounded overflow-hidden aspect-square border border-gray-200">
                                      <img src={item.imageUrl} className="w-full h-full object-cover"/>
                                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                          <p className="text-[10px] text-white truncate text-center">"{item.verse}"</p>
                                      </div>
                                      <button type="button" onClick={() => removeGalleryItem(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                          <X size={12}/>
                                      </button>
                                  </div>
                              ))}
                              {formData.gallery.length === 0 && <p className="col-span-full text-center text-xs text-gray-400 py-4">Nenhuma foto adicionada.</p>}
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                          <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                          <Button type="submit" disabled={submitting || batchUploading || uploadingBanner}>Salvar Projeto</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};