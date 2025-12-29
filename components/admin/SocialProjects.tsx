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

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await getCollection<SocialProject>('social_projects');
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
      } catch (e) { alert("Erro ao salvar projeto."); } finally { setSubmitting(false); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      try {
          const url = await uploadImage(file, 'social_banners');
          setFormData(prev => ({ ...prev, bannerUrl: url }));
      } catch { alert("Erro no upload."); } finally { setUploadingBanner(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-heading font-bold text-navy-900">Projetos Sociais</h1><p className="text-gray-500 text-sm">Registro de ações sociais.</p></div>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2" /> Novo Projeto</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (<Loader2 className="animate-spin text-navy-900 mx-auto col-span-full"/>) : projects.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  {p.bannerUrl && <img src={p.bannerUrl} className="h-40 object-cover" />}
                  <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-navy-900 mb-2">{p.title}</h3>
                      <div className="flex gap-2 mt-auto"><button onClick={() => handleOpenModal(p)} className="flex-1 py-1.5 bg-gray-50 rounded text-gray-600"><Edit2 size={14}/></button><button onClick={() => handleDelete(p.id)} className="flex-1 py-1.5 bg-red-50 rounded text-red-600"><Trash2 size={14}/></button></div>
                  </div>
              </div>
          ))}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-rose-50 rounded-t-xl"><h3 className="font-heading font-bold text-lg text-rose-900">{editingId ? 'Editar Projeto' : 'Novo Projeto'}</h3><button onClick={() => setShowModal(false)}><X className="text-gray-400"/></button></div>
                  <form onSubmit={handleSave} className="p-6 space-y-4 bg-white">
                      <div><label className="block text-sm font-medium text-gray-700">Título</label><input required className={inputClass} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Data</label><input type="date" className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Local</label><input className={inputClass} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Descrição</label><textarea className={inputClass} rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100"><Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button><Button type="submit" disabled={submitting}>Salvar</Button></div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};