import React, { useState, useEffect } from 'react';
import { ChurchEvent, Member, RosterItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Calendar, MapPin, Trash2, Loader2, Search, Edit2, Users, X, FileDown, CheckCircle2, ImageIcon, Upload, Image as ImageIconLucide } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, updateDocument, uploadImage } from '../../services/firestore';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newRosterRole, setNewRosterRole] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

  const initialFormState: Omit<ChurchEvent, 'id'> = {
    title: '',
    type: 'Culto',
    start: '',
    end: '',
    location: 'Templo Principal',
    description: '',
    bannerUrl: '',
    roster: []
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eventsData, membersData] = await Promise.all([
        getCollection<ChurchEvent>('events'),
        getCollection<Member>('members')
    ]);
    eventsData.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    setEvents(eventsData);
    setMembers(membersData.sort((a,b) => a.fullName.localeCompare(b.fullName)));
    setLoading(false);
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setNewRosterRole('');
    setSelectedMemberIds([]);
    setShowModal(true);
  };

  const handleEdit = (event: ChurchEvent) => {
    setEditingId(event.id);
    setFormData({ ...event });
    setNewRosterRole('');
    setSelectedMemberIds([]);
    setShowModal(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      try {
          const url = await uploadImage(file, 'event_banners');
          setFormData(prev => ({ ...prev, bannerUrl: url }));
      } catch (error) {
          alert("Erro ao carregar imagem do banner.");
      } finally {
          setUploadingBanner(false);
      }
  };

  const handleAddRosterBatch = () => {
      if(!newRosterRole || selectedMemberIds.length === 0) return;
      const newItems: RosterItem[] = selectedMemberIds.map(id => {
          const m = members.find(member => member.id === id);
          return {
              memberId: id,
              memberName: m?.fullName || 'Desconhecido',
              role: newRosterRole,
              photoUrl: m?.photoUrl || ''
          };
      });
      setFormData(prev => ({ ...prev, roster: [...(prev.roster || []), ...newItems] }));
      setNewRosterRole('');
      setSelectedMemberIds([]);
  };

  const generatePDF = (event: ChurchEvent) => {
      const doc = new jsPDF();
      
      doc.setFillColor(10, 24, 39);
      doc.rect(0, 0, 210, 60, 'F');
      
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(1.5);
      doc.circle(30, 30, 15, 'S');
      doc.setDrawColor(255, 255, 255);
      doc.line(30, 20, 30, 40); 
      doc.line(23, 28, 37, 28); 

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("IGREJA BATISTA O CAMINHO", 55, 28);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(197, 160, 89);
      doc.text("AMANDO A DEUS, SERVINDO AO PRÓXIMO", 55, 36);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`ESCALA DE LITURGIA E SERVIÇO`, 55, 50);

      doc.setTextColor(10, 24, 39);
      doc.setFontSize(11);
      const dateStr = new Date(event.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
      const timeStr = new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      doc.setFont("helvetica", "bold");
      doc.text("DETALHES DO CULTO / EVENTO", 15, 75);
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.5);
      doc.line(15, 78, 195, 78);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`EVENTO: ${event.title.toUpperCase()}`, 15, 88);
      doc.text(`DATA: ${dateStr}`, 15, 95);
      doc.text(`HORÁRIO: ${timeStr}`, 15, 102);
      doc.text(`LOCAL: ${event.location.toUpperCase()}`, 15, 109);

      const grouped: Record<string, string[]> = {};
      event.roster?.forEach(i => {
          if (!grouped[i.role]) grouped[i.role] = [];
          grouped[i.role].push(i.memberName);
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("DESIGNAÇÕES DE EQUIPE", 15, 125);
      doc.line(15, 128, 195, 128);

      let currentY = 140;
      Object.entries(grouped).forEach(([role, list]) => {
          doc.setFillColor(197, 160, 89);
          doc.circle(18, currentY - 1, 1, 'F');
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(10, 24, 39);
          doc.setFontSize(10);
          doc.text(role.toUpperCase(), 23, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text(list.join('  •  '), 85, currentY);
          
          doc.setDrawColor(240, 240, 240);
          doc.line(15, currentY + 4, 195, currentY + 4);
          
          currentY += 12;

          if (currentY > 270) {
              doc.addPage();
              currentY = 20;
          }
      });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`"Servi uns aos outros conforme o dom que cada um recebeu" - 1 Pedro 4:10`, 105, 280, { align: 'center' });
      doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')} via Sistema Administrativo IBOC`, 105, 285, { align: 'center' });

      doc.save(`Escala_IBOC_${event.title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
          await updateDocument('events', editingId, formData);
          setEvents(prev => prev.map(ev => ev.id === editingId ? { ...formData, id: editingId } : ev));
      } else {
          const newEv = await addDocument('events', formData);
          setEvents(prev => [...prev, newEv as ChurchEvent]);
      }
      setShowModal(false);
    } catch (e) { alert("Erro ao salvar."); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Deseja excluir este evento?")) {
        await deleteDocument('events', id);
        setEvents(prev => prev.filter(e => e.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-navy-900 font-serif">Agenda & Escalas</h1>
            <p className="text-sm text-gray-500 font-sans tracking-tight">Gestão litúrgica e de voluntariado com visual premium.</p>
        </div>
        <Button onClick={handleOpenModal} className="shadow-glow"><Plus size={18} className="mr-2" /> Agendar Culto</Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
          <input 
            type="text" 
            placeholder="Filtrar por nome do culto ou local..." 
            className={inputClass + " pl-12 rounded-xl border-gray-100 bg-stone-50/50"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full py-32 flex flex-col items-center"><Loader2 className="animate-spin text-gold-500 mb-4" size={48}/><p className="text-gray-400 italic">Sincronizando agenda...</p></div> : 
          events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
              {/* Event Banner Preview in Card */}
              <div className="h-40 relative overflow-hidden bg-navy-900">
                  {event.bannerUrl ? (
                      <img src={event.bannerUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" alt={event.title} />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                          <ImageIconLucide size={48} className="text-white" />
                      </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent"></div>
                  <span className="absolute bottom-3 left-4 text-[10px] font-bold uppercase bg-gold-500 text-navy-900 px-3 py-1 rounded-full tracking-[0.2em] shadow-sm">{event.type}</span>
              </div>

              <div className="p-6 flex-1">
                <div className="flex justify-between mb-4">
                  <div className="text-sm text-gold-600 font-bold uppercase tracking-widest">{new Date(event.start).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => generatePDF(event)} title="Baixar Escala PDF" className="p-2 text-navy-900 hover:bg-gold-50 rounded-xl transition-colors"><FileDown size={18}/></button>
                    <button onClick={() => handleEdit(event)} title="Editar" className="p-2 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded-xl transition-colors"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(event.id)} title="Excluir" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h3 className="font-serif font-bold text-xl text-navy-900 leading-tight mb-4 group-hover:text-gold-600 transition-colors">{event.title}</h3>
                <div className="text-sm text-gray-500 space-y-3">
                   <div className="flex items-center gap-3"><Calendar size={16} className="text-gold-500"/> <span className="capitalize">{new Date(event.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span></div>
                   <div className="flex items-center gap-3"><MapPin size={16} className="text-gold-500"/> {event.location}</div>
                </div>
                {event.roster && event.roster.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-50">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-4">Escala de Serviço</p>
                    <div className="flex -space-x-3">
                        {event.roster.slice(0, 5).map((r, i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-stone-100 overflow-hidden shadow-sm" title={`${r.role}: ${r.memberName}`}>
                            {r.photoUrl ? <img src={r.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-navy-900 uppercase">{r.memberName[0]}</div>}
                        </div>
                        ))}
                        {event.roster.length > 5 && (
                            <div className="w-10 h-10 rounded-full border-4 border-white bg-gold-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                +{event.roster.length - 5}
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-navy-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-8 border-b border-stone-50 bg-stone-50/50">
              <div>
                  <h2 className="text-2xl font-serif font-bold text-navy-900">{editingId ? 'Editar Escala' : 'Novo Agendamento'}</h2>
                  <p className="text-xs text-gold-600 uppercase tracking-widest mt-1">Planejamento Litúrgico & Estético</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-gray-100"><X className="text-gray-400 hover:text-navy-900"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Banner Upload Section */}
              <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Capa Cinematográfica do Evento</label>
                  <div className="relative group/banner h-64 rounded-2xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center transition-all hover:border-gold-400/50">
                      {formData.bannerUrl ? (
                          <>
                            <img src={formData.bannerUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-navy-900/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-navy-900 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
                                    <Upload size={16}/> Alterar Capa
                                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                                </label>
                            </div>
                          </>
                      ) : (
                          <div className="flex flex-col items-center gap-3">
                              {uploadingBanner ? <Loader2 className="animate-spin text-gold-500" size={32} /> : <Upload className="text-stone-300" size={48} />}
                              <label className="cursor-pointer bg-navy-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-navy-800 transition-colors">
                                  {uploadingBanner ? 'Processando...' : 'Carregar Banner'}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                              </label>
                              <p className="text-[10px] text-gray-400 uppercase tracking-tight">Recomendado: 1200x600px</p>
                          </div>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Título do Culto / Evento</label>
                  <input required className={inputClass + " rounded-xl border-gray-200 focus:border-gold-500"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Culto de Celebração" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Data e Horário</label>
                  <input type="datetime-local" required className={inputClass + " rounded-xl border-gray-200"} value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Localização</label>
                  <input required className={inputClass + " rounded-xl border-gray-200"} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Templo Principal" />
                </div>
              </div>

              <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="font-serif font-bold text-xl text-navy-900 flex items-center gap-3"><Users size={20} className="text-gold-500"/> Escala de Voluntários</h4>
                    <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-3 py-1 rounded-full uppercase tracking-tighter">Equipe Ministerial</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1">
                     <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Função / Ministério</label>
                     <input placeholder="Ex: Louvor, Portaria, Mídia..." className={inputClass + " rounded-xl border-gray-100 bg-white"} value={newRosterRole} onChange={e => setNewRosterRole(e.target.value)} />
                  </div>
                  <div className="sm:pt-6">
                    <Button type="button" onClick={handleAddRosterBatch} disabled={!newRosterRole || selectedMemberIds.length === 0} className="w-full h-[46px] rounded-xl shadow-md">Adicionar à Escala</Button>
                  </div>
                </div>

                <div className="mb-8">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Membros Disponíveis</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-4 bg-white rounded-xl border border-gray-100 shadow-inner">
                    {members.map(m => (
                        <button 
                        key={m.id} 
                        type="button"
                        onClick={() => setSelectedMemberIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                        className={`text-left p-3 rounded-xl border text-[11px] flex items-center gap-3 transition-all ${selectedMemberIds.includes(m.id) ? 'bg-navy-900 text-white border-navy-900 shadow-glow' : 'bg-stone-50 text-gray-600 hover:bg-stone-100 border-stone-100'}`}
                        >
                        {selectedMemberIds.includes(m.id) ? <CheckCircle2 size={16} className="text-gold-400"/> : <div className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white"/>}
                        <span className="truncate font-medium">{m.fullName}</span>
                        </button>
                    ))}
                    </div>
                </div>

                <div className="space-y-3">
                   {formData.roster?.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-100 shadow-sm transition-all hover:border-gold-300 group">
                           <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-gold-50 flex items-center justify-center text-gold-600 font-bold text-[10px]">{item.memberName[0]}</div>
                               <div className="flex flex-col">
                                   <span className="text-[9px] uppercase font-bold text-gold-600 tracking-widest">{item.role}</span>
                                   <span className="text-sm font-medium text-navy-900">{item.memberName}</span>
                               </div>
                           </div>
                           <button type="button" onClick={() => setFormData(prev => ({ ...prev, roster: prev.roster?.filter((_, i) => i !== idx)}))} className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-stone-50 group-hover:bg-red-50 rounded-lg"><X size={16}/></button>
                       </div>
                   ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="px-10 rounded-xl">Descartar</Button>
                <Button type="submit" disabled={submitting || uploadingBanner} className="px-12 rounded-xl shadow-glow">{submitting ? 'Processando...' : 'Confirmar Agenda'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};