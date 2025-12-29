import React, { useState, useEffect } from 'react';
import { ChurchEvent, Member, RosterItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Calendar, MapPin, Clock, Trash2, Loader2, Search, Upload, Image as ImageIcon, Edit2, Users, X, FileDown } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, updateDocument, uploadImage } from '../../services/firestore';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]); // List of members for Roster selection
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialFormState: Omit<ChurchEvent, 'id'> = {
    title: '',
    type: 'Culto',
    start: '',
    end: '',
    location: '',
    description: '',
    bannerUrl: '',
    roster: []
  };
  const [formData, setFormData] = useState(initialFormState);

  // Roster Local State (for adding new items)
  const [newRosterRole, setNewRosterRole] = useState('');
  const [newRosterMemberId, setNewRosterMemberId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eventsData, membersData] = await Promise.all([
        getCollection<ChurchEvent>('events'),
        getCollection<Member>('members')
    ]);
    
    // Ordenar eventos por data
    eventsData.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    setEvents(eventsData);
    setMembers(membersData);
    setLoading(false);
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setNewRosterRole('');
    setNewRosterMemberId('');
    setShowModal(true);
  };

  const handleEdit = (event: ChurchEvent) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      type: event.type,
      start: event.start,
      end: event.end,
      location: event.location,
      description: event.description || '',
      bannerUrl: event.bannerUrl || '',
      roster: event.roster || []
    });
    setNewRosterRole('');
    setNewRosterMemberId('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este evento?')) {
      await deleteDocument('events', id);
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start || !formData.end) {
        return alert("Preencha o título e os horários.");
    }

    setSubmitting(true);
    try {
      let updatedList = [...events];

      // Sanitize Data: Remove undefined values before saving to Firestore
      const cleanData = {
          ...formData,
          description: formData.description || '',
          bannerUrl: formData.bannerUrl || '',
          roster: formData.roster?.map(r => ({
              ...r,
              photoUrl: r.photoUrl || '' // Ensure no undefined in array objects
          })) || []
      };

      if (editingId) {
        // Update existing event
        await updateDocument('events', editingId, cleanData);
        updatedList = updatedList.map(e => e.id === editingId ? { ...cleanData, id: editingId } : e);
      } else {
        // Create new event
        const newEvent = await addDocument('events', cleanData);
        updatedList.push(newEvent as ChurchEvent);
      }
      
      // Recarregar lista para garantir ordem correta
      updatedList.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      setEvents(updatedList);
      setShowModal(false);
      setFormData(initialFormState);
      setEditingId(null);
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      alert(`Erro ao salvar evento: ${error.message || 'Verifique o console'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
        const url = await uploadImage(file, 'events_banners');
        setFormData(prev => ({ ...prev, bannerUrl: url }));
    } catch (error) {
        alert("Erro no upload do banner.");
    } finally {
        setUploadingBanner(false);
    }
  };

  // --- Roster Logic ---
  const handleAddRosterItem = () => {
      if(!newRosterRole || !newRosterMemberId) return;

      const selectedMember = members.find(m => m.id === newRosterMemberId);
      if(!selectedMember) return;

      const newItem: RosterItem = {
          role: newRosterRole,
          memberId: selectedMember.id,
          memberName: selectedMember.fullName,
          photoUrl: selectedMember.photoUrl || '' // Ensure not undefined
      };

      setFormData(prev => ({
          ...prev,
          roster: [...(prev.roster || []), newItem]
      }));

      setNewRosterRole('');
      setNewRosterMemberId('');
  };

  const handleRemoveRosterItem = (index: number) => {
      setFormData(prev => ({
          ...prev,
          roster: prev.roster?.filter((_, i) => i !== index)
      }));
  };

  // --- PDF Export Logic ---
  const generateRosterPDF = (event: ChurchEvent) => {
      const doc = new jsPDF();
      
      // Cores da Identidade Visual (Navy & Gold)
      const navyColor = [10, 24, 39] as [number, number, number];
      const goldColor = [197, 160, 89] as [number, number, number];

      // --- Header ---
      // Fundo Navy Superior
      doc.setFillColor(...navyColor);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Título da Igreja
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("IGREJA BATISTA O CAMINHO", 105, 20, { align: 'center' });
      
      // Subtítulo
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...goldColor); 
      doc.text("LITURGIA & SERVIÇO", 105, 28, { align: 'center' });
      
      // Título do Documento
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Escala de Voluntários", 105, 38, { align: 'center' });

      // --- Detalhes do Evento ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      // Linha dourada decorativa
      doc.setDrawColor(...goldColor);
      doc.setLineWidth(0.5);
      doc.line(14, 55, 196, 55);

      // Info Bloco
      doc.setFont("helvetica", "bold");
      doc.text("Evento:", 14, 65);
      doc.setFont("helvetica", "normal");
      doc.text(event.title, 40, 65);

      doc.setFont("helvetica", "bold");
      doc.text("Data:", 14, 72);
      doc.setFont("helvetica", "normal");
      const dateStr = `${new Date(event.start).toLocaleDateString('pt-BR')} às ${new Date(event.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
      doc.text(dateStr, 40, 72);

      doc.setFont("helvetica", "bold");
      doc.text("Local:", 14, 79);
      doc.setFont("helvetica", "normal");
      doc.text(event.location, 40, 79);

      // --- Tabela ---
      if (event.roster && event.roster.length > 0) {
          autoTable(doc, {
              startY: 90,
              head: [['Função / Ministério', 'Voluntário Responsável']],
              body: event.roster.map(r => [r.role.toUpperCase(), r.memberName]),
              styles: { 
                  fontSize: 11, 
                  cellPadding: 6,
                  lineColor: [220, 220, 220],
                  lineWidth: 0.1
              },
              headStyles: { 
                  fillColor: navyColor, 
                  textColor: [255, 255, 255], 
                  fontStyle: 'bold',
                  halign: 'center'
              },
              columnStyles: {
                  0: { fontStyle: 'bold', textColor: [80, 80, 80] },
                  1: { textColor: [0, 0, 0] }
              },
              alternateRowStyles: {
                  fillColor: [248, 248, 248]
              },
              theme: 'grid'
          });
      } else {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(150, 150, 150);
          doc.text("Nenhum voluntário escalado para este evento até o momento.", 105, 100, { align: 'center' });
      }

      // --- Rodapé Inspiracional ---
      const pageHeight = doc.internal.pageSize.height;
      
      // Frase Teológica / Serviço
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const quote = '"Dormi e sonhei que a vida era alegria. Acordei e vi que a vida era serviço. Agi e eis que o serviço era alegria."';
      const author = "- Rabindranath Tagore";
      
      doc.text(quote, 105, pageHeight - 30, { align: 'center', maxWidth: 160 });
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.text(author, 105, pageHeight - 22, { align: 'center' });

      // Rodapé Técnico
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} via Sistema IBOC`, 14, pageHeight - 10);
      doc.text("Soli Deo Gloria", 196, pageHeight - 10, { align: 'right' });

      doc.save(`Escala_${event.title.replace(/ /g, '_')}.pdf`);
  };

  // Filtragem
  const filteredEvents = events.filter(event => {
    const term = searchTerm.toLowerCase();
    const title = event.title || '';
    const type = event.type || '';
    const location = event.location || '';
    
    return title.toLowerCase().includes(term) ||
           type.toLowerCase().includes(term) ||
           location.toLowerCase().includes(term);
  });

  const formatDateTime = (isoString: string) => {
    if (!isoString) return { day: '-', time: '-' };
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { day: '-', time: '-' };
    return {
        day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-heading font-bold text-navy-900">Agenda da Igreja</h1>
            <p className="text-gray-500 text-sm">Gerencie cultos, reuniões e escalas de voluntários.</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus size={18} className="mr-2" /> Agendar Evento
        </Button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por título, tipo ou local..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-navy-900" size={32}/></div>
        ) : filteredEvents.length === 0 ? (
           <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-xl border border-dashed border-gray-300">
               {searchTerm ? 'Nenhum evento encontrado para a busca.' : 'Nenhum evento agendado.'}
           </div>
        ) : (
           filteredEvents.map(event => {
             const start = formatDateTime(event.start);
             const end = formatDateTime(event.end);
             
             return (
               <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  {/* Banner Image or Color Strip */}
                  {event.bannerUrl ? (
                     <div className="h-32 w-full relative">
                        <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                        <div className={`absolute bottom-0 left-0 w-full h-1 ${
                            event.type === 'Culto' ? 'bg-navy-900' : 
                            event.type === 'Social' ? 'bg-gold-500' : 
                            event.type === 'Reunião' ? 'bg-gray-500' : 'bg-blue-500'
                        }`}></div>
                     </div>
                  ) : (
                     <div className={`h-2 w-full ${
                        event.type === 'Culto' ? 'bg-navy-900' : 
                        event.type === 'Social' ? 'bg-gold-500' : 
                        event.type === 'Reunião' ? 'bg-gray-500' : 'bg-blue-500'
                     }`}></div>
                  )}

                  <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 border border-gray-100 px-2 py-1 rounded">{event.type}</span>
                          <div className="flex gap-2 items-center">
                            {/* Botão PDF Destacado (Dourado & Elegante) */}
                            <button 
                                onClick={() => generateRosterPDF(event)} 
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-50 text-gold-600 border border-gold-200 hover:bg-gold-500 hover:text-white transition-all shadow-sm group/pdf"
                                title="Baixar Escala (PDF)"
                            >
                                <FileDown size={16} className="group-hover/pdf:scale-110 transition-transform" />
                            </button>
                            
                            <div className="h-4 w-px bg-gray-200 mx-1"></div>

                            <button 
                                onClick={() => handleEdit(event)} 
                                className="text-gray-400 hover:text-navy-900 transition-colors p-1"
                                title="Editar Evento"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(event.id)} 
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Excluir Evento"
                            >
                                <Trash2 size={18} />
                            </button>
                          </div>
                      </div>
                      
                      <h3 className="font-heading font-bold text-lg text-gray-800 mb-2">{event.title}</h3>
                      
                      <div className="space-y-2 text-sm text-gray-600 flex-1">
                          <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gold-600"/>
                              <span className="font-medium">{start.day}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gold-600"/>
                              <span>{start.time} - {end.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gold-600"/>
                              <span className="truncate">{event.location}</span>
                          </div>
                      </div>
                      
                      {/* Mini Roster View */}
                      {event.roster && event.roster.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                              <div className="flex -space-x-2 overflow-hidden items-center">
                                  {event.roster.slice(0, 5).map((r, i) => (
                                      <div key={i} title={`${r.role}: ${r.memberName}`} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-navy-900 overflow-hidden">
                                          {r.photoUrl ? <img src={r.photoUrl} className="w-full h-full object-cover"/> : r.memberName.charAt(0)}
                                      </div>
                                  ))}
                                  {event.roster.length > 5 && (
                                      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                                          +{event.roster.length - 5}
                                      </div>
                                  )}
                                  <span className="ml-3 text-xs text-gray-400">{event.roster.length} escalados</span>
                              </div>
                          </div>
                      )}
                  </div>
               </div>
             );
           })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-navy-50 rounded-t-xl">
              <h3 className="font-heading font-bold text-lg text-navy-900">
                {editingId ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button onClick={() => setShowModal(false)}><span className="text-gray-400 text-2xl hover:text-gray-600">&times;</span></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Banner Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gray-50">
                  {formData.bannerUrl ? (
                      <div className="relative w-full h-32 rounded overflow-hidden mb-3 group">
                          <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                          <button 
                             type="button" 
                             onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                             className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Trash2 size={12} />
                          </button>
                      </div>
                  ) : (
                      <ImageIcon className="text-gray-400 mb-2" size={32} />
                  )}
                  
                  <div className="flex items-center justify-center">
                    <input 
                        type="file" 
                        accept="image/*"
                        id="bannerUpload"
                        className="hidden"
                        onChange={handleBannerUpload}
                    />
                    <label 
                        htmlFor="bannerUpload" 
                        className={`text-sm text-blue-600 font-medium cursor-pointer hover:underline flex items-center gap-2 ${uploadingBanner ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {uploadingBanner ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        {uploadingBanner ? 'Enviando...' : formData.bannerUrl ? 'Trocar Banner' : 'Adicionar Foto/Banner'}
                    </label>
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título do Evento</label>
                <input 
                  required
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ex: Culto de Celebração" 
                  className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select 
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                    >
                        <option value="Culto">Culto</option>
                        <option value="Reunião">Reunião</option>
                        <option value="Social">Social</option>
                        <option value="EBD">EBD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Ex: Templo Principal"
                      className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                    <input 
                      required
                      type="datetime-local" 
                      name="start"
                      value={formData.start}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                    <input 
                      required
                      type="datetime-local" 
                      name="end"
                      value={formData.end}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Detalhes adicionais sobre o evento..."
                  className="w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none" 
                />
              </div>

              {/* Roster / Escala Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-sm text-navy-900 flex items-center gap-2 mb-3">
                      <Users size={16} /> Escala de Voluntários
                  </h4>
                  
                  {/* Add New Roster Item */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <input 
                          type="text"
                          placeholder="Função (Ex: Louvor)"
                          className="flex-1 border p-2 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                          value={newRosterRole}
                          onChange={(e) => setNewRosterRole(e.target.value)}
                      />
                      <select 
                          className="flex-1 border p-2 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
                          value={newRosterMemberId}
                          onChange={(e) => setNewRosterMemberId(e.target.value)}
                      >
                          <option value="">Selecione um Membro</option>
                          {members.map(m => (
                              <option key={m.id} value={m.id}>{m.fullName}</option>
                          ))}
                      </select>
                      <button 
                          type="button" 
                          onClick={handleAddRosterItem}
                          disabled={!newRosterRole || !newRosterMemberId}
                          className="bg-navy-900 text-white px-3 py-2 rounded text-sm hover:bg-navy-800 disabled:opacity-50"
                      >
                          <Plus size={16} />
                      </button>
                  </div>

                  {/* List Roster */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.roster && formData.roster.length > 0 ? (
                          formData.roster.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                          {item.photoUrl && <img src={item.photoUrl} className="w-full h-full object-cover"/>}
                                      </div>
                                      <div>
                                          <span className="font-bold text-navy-900 mr-1">{item.role}:</span>
                                          <span className="text-gray-600">{item.memberName}</span>
                                      </div>
                                  </div>
                                  <button 
                                      type="button" 
                                      onClick={() => handleRemoveRosterItem(idx)}
                                      className="text-red-400 hover:text-red-600"
                                  >
                                      <X size={14} />
                                  </button>
                              </div>
                          ))
                      ) : (
                          <p className="text-xs text-center text-gray-400 py-2">Ninguém escalado ainda.</p>
                      )}
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Agendar Evento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};