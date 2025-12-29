import React, { useState, useEffect } from 'react';
import { Member, AppUser } from '../../types';
import { Button } from '../ui/Button';
import { Edit2, Trash2, Plus, Search, Loader2, User, Camera, Shield, X, CheckCircle2, Mail, Phone, MapPin, Calendar, Heart, Award, Briefcase, Lock, UserCheck } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, uploadImage, updateDocument } from '../../services/firestore';

interface AdminMembersProps { currentUser: AppUser | null; }

export const AdminMembers: React.FC<AdminMembersProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const inputClass = "w-full border border-gray-200 p-2.5 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:border-transparent focus:outline-none placeholder-gray-400 transition-all text-sm";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1";

  const initialFormState: Omit<Member, 'id'> = {
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    photoUrl: '',
    fatherName: '',
    motherName: '',
    maritalStatus: 'Solteiro',
    address: '',
    neighborhood: '',
    city: 'Fortaleza',
    baptismDate: '',
    receptionDate: new Date().toISOString().split('T')[0],
    receptionType: 'Batismo',
    status: 'Ativo',
    previousChurch: '',
    role: 'Membro',
    ministries: [],
    spiritualGifts: '',
    username: '',
    password: '',
    permissions: 'viewer'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getCollection<Member>('members');
      setMembers(data.sort((a, b) => a.fullName.localeCompare(b.fullName)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, 'members_photos');
      setFormData(prev => ({ ...prev, photoUrl: url }));
    } catch (e) {
      alert("Erro ao carregar foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!formData.fullName) return alert("O nome completo é obrigatório.");
    setLoading(true);
    try {
      const payload = { ...formData, fullName: formData.fullName.toUpperCase() };
      if (editingId) {
          await updateDocument('members', editingId, payload);
          setMembers(prev => prev.map(m => m.id === editingId ? { ...payload, id: editingId } : m));
      } else {
          const newM = await addDocument('members', payload);
          setMembers(prev => [...prev, newM as Member].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      }
      setShowModal(false);
    } catch (e) { 
      alert("Erro ao salvar membro."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o cadastro de ${name}?`)) {
      await deleteDocument('members', id);
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 font-serif">Membros</h1>
          <p className="text-sm text-gray-500">Gestão completa do corpo de membros.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }} className="shadow-glow">
          <Plus size={18} className="mr-2"/> Novo Membro
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou cargo..." 
            className={inputClass + " pl-12 bg-stone-50/50"} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-gray-500 font-bold uppercase tracking-widest text-[10px] border-b border-gray-100">
              <tr>
                <th className="px-6 py-5">Membro</th>
                <th className="px-6 py-5 hidden md:table-cell">Contato</th>
                <th className="px-6 py-5 hidden lg:table-cell">Cargo / Status</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin text-gold-500 mx-auto" size={40} />
                    <p className="text-gray-400 mt-4 italic">Sincronizando registros...</p>
                  </td>
                </tr>
              ) : members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-400 italic">Nenhum membro encontrado.</td>
                </tr>
              ) : (
                members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                  <tr key={m.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-navy-50 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-navy-900 font-bold text-lg">{m.fullName[0]}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-navy-900 text-base">{m.fullName}</p>
                          <p className="text-[10px] uppercase tracking-tighter text-gold-600 font-bold">{m.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-gray-600"><Mail size={12} className="text-gray-400"/> {m.email || 'N/A'}</p>
                        <p className="flex items-center gap-2 text-gray-600"><Phone size={12} className="text-gray-400"/> {m.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex flex-col gap-2">
                        <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          m.status === 'Ativo' ? 'bg-green-50 text-green-700 border border-green-100' : 
                          m.status === 'Ausente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {m.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Recepção: {new Date(m.receptionDate || '').toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingId(m.id); setFormData(m); setShowModal(true); }} 
                          className="p-2 text-navy-900 hover:bg-navy-50 rounded-xl transition-all"
                          title="Editar Ficha"
                        >
                          <Edit2 size={18}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id, m.fullName)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif font-bold text-navy-900">{editingId ? 'Editar Membro' : 'Novo Cadastro'}</h2>
                <p className="text-xs text-gold-600 uppercase tracking-widest mt-1">Ficha Ministerial de Membresia</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-100">
                <X className="text-gray-400 hover:text-navy-900" size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-stone-100 border-4 border-white shadow-xl overflow-hidden ring-1 ring-gold-200">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <User size={48} />
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-navy-900/40 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2.5 bg-gold-500 text-white rounded-full shadow-lg cursor-pointer hover:bg-gold-600 transition-all border-2 border-white">
                    <Camera size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-4 font-bold">Foto do Perfil</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                  <User size={18} className="text-gold-500" />
                  <h4 className="font-serif font-bold text-navy-900 text-lg">Informações Pessoais</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome Completo</label>
                    <input required className={inputClass} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} placeholder="NOME DO MEMBRO" />
                  </div>
                  <div>
                    <label className={labelClass}>Data de Nascimento</label>
                    <input type="date" className={inputClass} value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>E-mail</label>
                    <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemplo@email.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Telefone / WhatsApp</label>
                    <input className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(85) 90000-0000" />
                  </div>
                  <div>
                    <label className={labelClass}>Estado Civil</label>
                    <select className={inputClass} value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})}>
                      <option value="Solteiro">Solteiro(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Viúvo">Viúvo(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className={labelClass}>Pai</label>
                    <input className={inputClass} value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} placeholder="NOME DO PAI" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Mãe</label>
                    <input className={inputClass} value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} placeholder="NOME DA MÃE" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                  <Lock size={18} className="text-gold-500" />
                  <h4 className="font-serif font-bold text-navy-900 text-lg">Credenciais de Acesso ao Site</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Usuário / Login</label>
                    <input className={inputClass} value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Nome de usuário" />
                  </div>
                  <div>
                    <label className={labelClass}>Senha de Acesso</label>
                    <input type="password" className={inputClass} value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={labelClass}>Nível de Permissão</label>
                    <select className={inputClass} value={formData.permissions || 'viewer'} onChange={e => setFormData({...formData, permissions: e.target.value as any})}>
                      <option value="viewer">Visualizador (Membro)</option>
                      <option value="editor">Editor (Liderança)</option>
                      <option value="admin">Administrador (TI/Secretaria)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                  <MapPin size={18} className="text-gold-500" />
                  <h4 className="font-serif font-bold text-navy-900 text-lg">Endereço & Localização</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Logradouro (Rua, Nº)</label>
                    <input className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Rua exemplo, 000" />
                  </div>
                  <div>
                    <label className={labelClass}>Bairro</label>
                    <input className={inputClass} value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} placeholder="Ex: Barroso" />
                  </div>
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input className={inputClass} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                  <Award size={18} className="text-gold-500" />
                  <h4 className="font-serif font-bold text-navy-900 text-lg">Vida Eclesiástica</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Status de Membresia</label>
                    <select className={inputClass + " font-bold"} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      <option value="Ativo">🟢 Ativo</option>
                      <option value="Em Observação">🟡 Em Observação</option>
                      <option value="Ausente">⚪ Ausente</option>
                      <option value="Transferido">🔵 Transferido</option>
                      <option value="Falecido">⚫ Falecido</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Cargo / Função</label>
                    <select className={inputClass} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                      <option value="Membro">Membro</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Liderança">Liderança</option>
                      <option value="Diácono">Diácono(isa)</option>
                      <option value="Professor EBD">Professor EBD</option>
                      <option value="Músico">Músico</option>
                      <option value="Porteiro">Porteiro</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Forma de Recepção</label>
                    <select className={inputClass} value={formData.receptionType} onChange={e => setFormData({...formData, receptionType: e.target.value as any})}>
                      <option value="Batismo">Batismo</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Aclamação">Aclamação</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Data de Recepção</label>
                    <input type="date" className={inputClass} value={formData.receptionDate} onChange={e => setFormData({...formData, receptionDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Data do Batismo</label>
                    <input type="date" className={inputClass} value={formData.baptismDate} onChange={e => setFormData({...formData, baptismDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Igreja Anterior</label>
                    <input className={inputClass} value={formData.previousChurch} onChange={e => setFormData({...formData, previousChurch: e.target.value})} placeholder="Se houver" />
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelClass}>Dons Espirituais / Talentos</label>
                    <textarea className={inputClass + " h-24"} value={formData.spiritualGifts} onChange={e => setFormData({...formData, spiritualGifts: e.target.value})} placeholder="Descreva os dons e talentos do membro..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-stone-50 bg-stone-50/50 flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="px-10 rounded-xl">Descartar</Button>
              <Button onClick={handleSave} disabled={loading} className="px-14 rounded-xl shadow-glow">
                {loading ? <Loader2 className="animate-spin mr-2" size={18}/> : <CheckCircle2 size={18} className="mr-2"/>}
                {editingId ? 'Atualizar Ficha' : 'Salvar Cadastro'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};