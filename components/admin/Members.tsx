import React, { useState, useEffect } from 'react';
import { Member, AppUser } from '../../types';
import { Button } from '../ui/Button';
import { Edit2, Trash2, Plus, Search, Filter, Loader2, User, Camera, Shield, Printer, BarChart3, Cake, MessageCircle, X } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, uploadImage, updateDocument } from '../../services/firestore';

interface AdminMembersProps { currentUser: AppUser | null; }

export const AdminMembers: React.FC<AdminMembersProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'reports'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

  const initialFormState: Omit<Member, 'id'> = {
    fullName: '', email: '', phone: '', birthDate: '', photoUrl: '', maritalStatus: 'Solteiro', address: '', status: 'Ativo', role: 'Membro', receptionDate: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    const data = await getCollection<Member>('members');
    setMembers(data.sort((a, b) => a.fullName.localeCompare(b.fullName)));
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.fullName) return alert("Nome obrigatório");
    setLoading(true);
    try {
      if (editingId) {
          await updateDocument('members', editingId, formData);
          setMembers(prev => prev.map(m => m.id === editingId ? { ...formData, id: editingId } : m));
      } else {
          const newM = await addDocument('members', formData);
          setMembers(prev => [...prev, newM as Member]);
      }
      setShowModal(false);
    } catch (e) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900">Membros</h1>
        <Button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }}><Plus size={18} className="mr-2"/> Novo Membro</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar..." className={inputClass + " pl-10"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Membro</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">{m.photoUrl ? <img src={m.photoUrl} className="w-full h-full object-cover"/> : <User size={16} className="m-2 text-gray-400"/>}</div>
                    <span className="font-medium text-gray-900">{m.fullName}</span>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700">{m.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingId(m.id); setFormData(m); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-navy-900"><Edit2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-navy-900">Cadastro de Membro</h3><button onClick={() => setShowModal(false)}><X/></button></div>
            <div className="space-y-4">
               <div><label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label><input className={inputClass} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-bold text-gray-500 uppercase">Status</label><select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="Ativo">Ativo</option><option value="Ausente">Ausente</option></select></div>
                 <div><label className="text-xs font-bold text-gray-500 uppercase">Telefone</label><input className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
               </div>
               <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};