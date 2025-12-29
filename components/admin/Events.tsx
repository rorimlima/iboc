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
      
      // Cabeçalho Navy
      doc.setFillColor(10, 24, 39);
      doc.rect(0, 0, 210, 50, 'F');
      
      // Logo Vetorial Minimalista no PDF
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(1);
      doc.circle(25, 25, 12, 'S');
      doc.setDrawColor(255, 255, 255);
      doc.line(25, 18, 25, 32); // Cruz Vertical
      doc.line(20, 23, 30, 23); // Cruz Horizontal

      // Título da Igreja
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("IGREJA BATISTA O CAMINHO", 45, 22);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(197, 160, 89);
      doc.text("SOLI DEO GLORIA", 45, 28);

      // Info do Evento
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(`ESCALA DE LITURGIA: ${event.title.toUpperCase()}`, 45, 40);

      // Corpo do PDF
      doc.setTextColor(10, 24, 39);
      doc.setFontSize(10);
      const dateStr = new Date(event.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      doc.setFont("helvetica", "bold");
      doc.text("INFORMAÇÕES GERAIS", 14, 65);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 67, 196, 67);

      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${dateStr}`, 14, 75);
      doc.text(`Horário: ${timeStr}`, 14, 82);
      doc.text(`Local: ${event.location}`, 14, 89);

      // Agrupamento de Escala
      const grouped: Record<string, string[]> = {};
      event.roster?.forEach(i => {
          if (!grouped[i.role]) grouped[i.role] = [];
          grouped[i.role].push(i.memberName);
      });

      const tableBody = Object.entries(grouped).map(([role, list]) => [
          { content: role.toUpperCase(), styles: { fontStyle: 'bold', textColor: [10, 24, 39] } },
          list.join(', ')
      ]);

      autoTable(doc, {
          startY: 100,
          head: [['FUNÇÃO / MINISTÉRIO', 'MEMBROS DESIGNADOS']],
          body: tableBody,
          theme: 'striped',
          headStyles: { 
            fillColor: [10, 24, 39], 
            textColor: [197, 160, 89],
            fontSize: 10,
            halign: 'left'
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 6,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 60 }
          },
          margin: { left: 14, right: 14 }
      });

      // Rodapé
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} - Sistema de Gestão IBOC`, 105, 285, { align: 'center' });

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
            <h1 className="text-2xl font-bold text-navy-900">Agenda & Escalas</h1>
            <p className="text-sm text-gray-500">Organize os cultos e as equipes de serviço.</p>
        </div>
        <Button onClick={handleOpenModal}><Plus size={18} className="mr-2" /> Novo Evento</Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por título ou local..." 
            className={inputClass + " pl-10"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-navy-900" size={40}/></div> : 
          events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className="p-5 flex-1">
                <div className="flex justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase bg-navy-50 text-navy-900 px-2 py-1 rounded tracking-widest">{event.type}</span>
                  <div className="flex gap-2">
                    <button onClick={() => generatePDF(event)} title="Gerar PDF" className="p-1.5 text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"><FileDown size={18}/></button>
                    <button onClick={() => handleEdit(event)} title="Editar" className="p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-50 rounded-lg transition-colors"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(event.id)} title="Excluir" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-navy-900 leading-tight mb-3">{event.title}</h3>
                <div className="text-xs text-gray-500 space-y-2">
                   <div className="flex items-center gap-2"><Calendar size={14} className="text-gold-500"/> {new Date(event.start).toLocaleDateString('pt-BR', {day:'2-digit', month:'long'})} às {new Date(event.start).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>
                   <div className="flex items-center gap-2"><MapPin size={14} className="text-gold-500"/> {event.location}</div>
                </div>
                {event.roster && event.roster.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-50">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Equipe Escalada</p>
                    <div className="flex -space-x-2">
                        {event.roster.slice(0, 6).map((r, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-navy-50 overflow-hidden ring-1 ring-gray-100" title={`${r.role}: ${r.memberName}`}>
                            {r.photoUrl ? <img src={r.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-navy-900 uppercase">{r.memberName[0]}</div>}
                        </div>
                        ))}
                        {event.roster.length > 6 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gold-500 text-white flex items-center justify-center text-[10px] font-bold">
                                +{event.roster.length - 6}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-navy-900">{editingId ? 'Editar Evento' : 'Novo Evento'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Título do Evento</label>
                  <input required className={inputClass} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Data e Hora de Início</label>
                  <input type="datetime-local" required className={inputClass} value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Local</label>
                  <input required className={inputClass} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div className="bg-stone-50 p-5 rounded-xl border border-gray-100">
                <h4 className="font-bold text-navy-900 mb-4 flex items-center gap-2"><Users size={18} className="text-gold-500"/> Escala de Voluntários</h4>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="flex-1">
                     <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Função</label>
                     <input placeholder="Ex: Louvor, Recepção..." className={inputClass} value={newRosterRole} onChange={e => setNewRosterRole(e.target.value)} />
                  </div>
                  <div className="sm:pt-5">
                    <Button type="button" onClick={handleAddRosterBatch} disabled={!newRosterRole || selectedMemberIds.length === 0} className="w-full">Escalar Selecionados</Button>
                  </div>
                </div>

                <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Selecione os Membros</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-white rounded-lg border border-gray-200">
                    {members.map(m => (
                        <button 
                        key={m.id} 
                        type="button"
                        onClick={() => setSelectedMemberIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                        className={`text-left p-2 rounded-lg border text-[11px] flex items-center gap-2 transition-all ${selectedMemberIds.includes(m.id) ? 'bg-navy-900 text-white border-navy-900 shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                        >
                        {selectedMemberIds.includes(m.id) ? <CheckCircle2 size={14} className="text-gold-400"/> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white"/>}
                        <span className="truncate font-medium">{m.fullName}</span>
                        </button>
                    ))}
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                   {formData.roster?.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-gold-200">
                           <div className="flex flex-col">
                               <span className="text-[9px] uppercase font-bold text-gold-600 tracking-tighter">{item.role}</span>
                               <span className="text-sm font-medium text-navy-900">{item.memberName}</span>
                           </div>
                           <button type="button" onClick={() => setFormData(prev => ({ ...prev, roster: prev.roster?.filter((_, i) => i !== idx)}))} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={16}/></button>
                       </div>
                   ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="px-8">Cancelar</Button>
                <Button type="submit" disabled={submitting} className="px-10">{submitting ? 'Salvando...' : 'Salvar Evento'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};