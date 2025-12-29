import React, { useState, useEffect } from 'react';
import { ChurchEvent, Member, RosterItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Calendar, MapPin, Trash2, Loader2, Search, Edit2, Users, X, FileDown, CheckCircle2 } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, updateDocument } from '../../services/firestore';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("IGREJA BATISTA O CAMINHO", 105, 22, { align: 'center' });
      doc.setFontSize(14);
      doc.text("Escala de Evento e Liturgia", 105, 35, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text(event.title, 14, 60);
      doc.setFontSize(10);
      doc.text(`Data: ${new Date(event.start).toLocaleDateString('pt-BR')} às ${new Date(event.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`, 14, 68);
      doc.text(`Local: ${event.location}`, 14, 74);

      const grouped: Record<string, string[]> = {};
      event.roster?.forEach(i => {
          if (!grouped[i.role]) grouped[i.role] = [];
          grouped[i.role].push(i.memberName);
      });

      autoTable(doc, {
          startY: 85,
          head: [['Função', 'Membros Escalados']],
          body: Object.entries(grouped).map(([role, list]) => [role.toUpperCase(), list.join(', ')]),
          headStyles: { fillColor: [10, 24, 39] },
          styles: { fontSize: 10, cellPadding: 5 }
      });
      doc.save(`Escala_${event.title}.pdf`);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900">Agenda & Escalas</h1>
        <Button onClick={handleOpenModal}><Plus size={18} className="mr-2" /> Novo Evento</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar eventos..." 
            className={inputClass + " pl-10"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-navy-900" size={40}/></div> : 
          events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
              <div className="p-5 flex-1">
                <div className="flex justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase bg-navy-50 text-navy-900 px-2 py-1 rounded">{event.type}</span>
                  <div className="flex gap-2">
                    <button onClick={() => generatePDF(event)} className="text-navy-900 hover:text-gold-600"><FileDown size={18}/></button>
                    <button onClick={() => handleEdit(event)} className="text-gray-400 hover:text-navy-900"><Edit2 size={18}/></button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-navy-900 leading-tight mb-2">{event.title}</h3>
                <div className="text-xs text-gray-500 space-y-1">
                   <div className="flex items-center gap-2"><Calendar size={12}/> {new Date(event.start).toLocaleDateString('pt-BR')}</div>
                   <div className="flex items-center gap-2"><MapPin size={12}/> {event.location}</div>
                </div>
                {event.roster && event.roster.length > 0 && (
                  <div className="mt-4 flex -space-x-2">
                    {event.roster.slice(0, 6).map((r, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden" title={r.memberName}>
                        {r.photoUrl ? <img src={r.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">{r.memberName[0]}</div>}
                      </div>
                    ))}
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
                <h4 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Users size={16}/> Escala Multi-Membro</h4>
                <div className="flex gap-2 mb-4">
                  <input placeholder="Função (ex: Louvor)" className={inputClass} value={newRosterRole} onChange={e => setNewRosterRole(e.target.value)} />
                  <Button type="button" size="sm" onClick={handleAddRosterBatch} disabled={!newRosterRole || selectedMemberIds.length === 0}>Adicionar</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded border border-gray-200 mb-4">
                  {members.map(m => (
                    <button 
                      key={m.id} 
                      type="button"
                      onClick={() => setSelectedMemberIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                      className={`text-left p-1.5 rounded border text-[11px] flex items-center gap-2 transition-colors ${selectedMemberIds.includes(m.id) ? 'bg-navy-900 text-white border-navy-900' : 'bg-gray-50 text-gray-800'}`}
                    >
                      {selectedMemberIds.includes(m.id) ? <CheckCircle2 size={12}/> : <div className="w-3 h-3 rounded-full border border-gray-300 bg-white"/>}
                      <span className="truncate">{m.fullName}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                   {formData.roster?.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-xs">
                           <span><strong>{item.role}:</strong> {item.memberName}</span>
                           <button type="button" onClick={() => setFormData(prev => ({ ...prev, roster: prev.roster?.filter((_, i) => i !== idx)}))} className="text-red-500"><X size={14}/></button>
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