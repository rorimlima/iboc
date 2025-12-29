import React, { useState, useEffect } from 'react';
import { ChurchEvent, Member, RosterItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Calendar, MapPin, Clock, Trash2, Loader2, Search, Upload, Image as ImageIcon, Edit2, Users, X, FileDown, CheckCircle2 } from 'lucide-react';
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

  const [newRosterRole, setNewRosterRole] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

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
    setSelectedMemberIds([]);
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
    if (!formData.title || !formData.start || !formData.end) return alert("Preencha o título e os horários.");

    setSubmitting(true);
    try {
      const cleanData = {
          ...formData,
          description: formData.description || '',
          bannerUrl: formData.bannerUrl || '',
          roster: formData.roster || []
      };

      if (editingId) {
        await updateDocument('events', editingId, cleanData);
        setEvents(prev => prev.map(e => e.id === editingId ? { ...cleanData, id: editingId } : e));
      } else {
        const newEvent = await addDocument('events', cleanData);
        setEvents(prev => [...prev, newEvent as ChurchEvent].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      }
      setShowModal(false);
    } catch (error: any) {
      alert(`Erro ao salvar evento: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRosterItems = () => {
      if(!newRosterRole || selectedMemberIds.length === 0) return;

      const newRosterItems: RosterItem[] = selectedMemberIds.map(id => {
          const member = members.find(m => m.id === id);
          return {
              role: newRosterRole,
              memberId: member!.id,
              memberName: member!.fullName,
              photoUrl: member!.photoUrl || ''
          };
      });

      setFormData(prev => ({
          ...prev,
          roster: [...(prev.roster || []), ...newRosterItems]
      }));

      setNewRosterRole('');
      setSelectedMemberIds([]);
  };

  const generateRosterPDF = (event: ChurchEvent) => {
      const doc = new jsPDF();
      const navyColor = [10, 24, 39] as [number, number, number];

      doc.setFillColor(...navyColor);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("IGREJA BATISTA O CAMINHO", 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text("Escala de Serviço e Liturgia", 105, 35, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Evento: ${event.title}`, 14, 60);
      doc.text(`Data: ${new Date(event.start).toLocaleDateString('pt-BR')} ${new Date(event.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`, 14, 67);
      doc.text(`Local: ${event.location}`, 14, 74);

      const groupedRoster: Record<string, string[]> = {};
      event.roster?.forEach(item => {
          if (!groupedRoster[item.role]) groupedRoster[item.role] = [];
          groupedRoster[item.role].push(item.memberName);
      });

      autoTable(doc, {
          startY: 85,
          head: [['Função / Ministério', 'Membros Escalados']],
          body: Object.entries(groupedRoster).map(([role, members]) => [
              role.toUpperCase(),
              members.join(', ')
          ]),
          headStyles: { fillColor: navyColor },
          styles: { fontSize: 10, cellPadding: 5 },
          columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
      });

      doc.save(`Escala_IBOC_${event.title}.pdf`);
  };

  const toggleMemberSelection = (id: string) => {
      setSelectedMemberIds(prev => 
          prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900">Agenda & Escalas</h1>
        <Button onClick={handleOpenModal}><Plus size={18} className="mr-2" /> Novo Evento</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar eventos..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <Loader2 className="animate-spin mx-auto col-span-full" /> : 
          events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
              {event.bannerUrl && <img src={event.bannerUrl} className="h-32 w-full object-cover" />}
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase bg-navy-50 text-navy-900 px-2 py-1 rounded">{event.type}</span>
                  <div className="flex gap-2">
                    <button onClick={() => generateRosterPDF(event)} className="text-gold-600 hover:text-gold-700"><FileDown size={18}/></button>
                    <button onClick={() => handleEdit(event)} className="text-gray-400 hover:text-navy-900"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(event.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-800">{event.title}</h3>
                <div className="text-sm text-gray-500 space-y-1 mt-2">
                  <div className="flex items-center gap-2"><Calendar size={14}/> {new Date(event.start).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2"><MapPin size={14}/> {event.location}</div>
                </div>
                {event.roster && event.roster.length > 0 && (
                  <div className="mt-4 flex -space-x-2">
                    {event.roster.slice(0, 5).map((r, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        {r.photoUrl ? <img src={r.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">{r.memberName[0]}</div>}
                      </div>
                    ))}
                    {event.roster.length > 5 && <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px]">+{event.roster.length - 5}</div>}
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-navy-900">{editingId ? 'Editar Evento' : 'Novo Evento'}</h2>
              <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                  <input className={inputClass} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Início</label>
                  <input type="datetime-local" className={inputClass} value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Local</label>
                  <input className={inputClass} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Users size={16}/> Montar Escala (Vários membros)</h4>
                <div className="flex gap-2 mb-4">
                  <input placeholder="Função (ex: Louvor)" className={inputClass} value={newRosterRole} onChange={e => setNewRosterRole(e.target.value)} />
                  <Button type="button" size="sm" onClick={handleAddRosterItems} disabled={!newRosterRole || selectedMemberIds.length === 0}>Adicionar Grupo</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto mb-4 p-2 bg-white rounded border border-gray-200">
                  {members.map(m => (
                    <button 
                      key={m.id} 
                      type="button"
                      onClick={() => toggleMemberSelection(m.id)}
                      className={`text-left p-1.5 rounded border text-xs flex items-center gap-2 transition-colors ${selectedMemberIds.includes(m.id) ? 'bg-navy-900 text-white border-navy-900' : 'bg-gray-50 text-gray-900 hover:border-navy-200'}`}
                    >
                      {selectedMemberIds.includes(m.id) ? <CheckCircle2 size={12}/> : <div className="w-3 h-3 rounded-full border border-gray-300 bg-white"/>}
                      <span className="truncate">{m.fullName}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {formData.roster?.map((r, i) => (
                    <div key={i} className="flex justify-between bg-white p-2 rounded border border-gray-100 text-xs text-gray-900">
                      <span><strong>{r.role}:</strong> {r.memberName}</span>
                      <button type="button" onClick={() => setFormData({...formData, roster: formData.roster?.filter((_, idx) => idx !== i)})} className="text-red-500 hover:text-red-700 transition-colors"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};