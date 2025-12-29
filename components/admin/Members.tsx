
import React, { useState, useEffect } from 'react';
import { Member, AppUser } from '../../types';
import { Button } from '../ui/Button';
import { Edit2, Trash2, Plus, Search, Loader2, User, Camera, Shield, X, CheckCircle2, Mail, Phone, MapPin, Calendar, Heart, Award, Briefcase, Lock, UserCheck, BookOpen } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, uploadImage, updateDocument } from '../../services/firestore';

interface AdminMembersProps { currentUser: AppUser | null; }

export const AdminMembers: React.FC<AdminMembersProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const inputClass = "w-full border border-gray-200 p-3 rounded-xl bg-white text-navy-900 focus:ring-2 focus:ring-navy-900 focus:border-transparent focus:outline-none placeholder-gray-400 transition-all text-sm font-medium";
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 block ml-1";

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
          <h1 className="text-2xl font-bold text-navy-900 font-serif">Membros IBOC</h1>
          <p className="text-sm text-gray-500 font-sans tracking-tight">Gestão ministerial e controle de membresia.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }} className="shadow-glow px-10 rounded-xl font-bold">
          <Plus size={18} className="mr-2"/> Novo Membro
        </Button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou cargo..." 
            className={inputClass + " pl-12 bg-stone-50/50 border-gray-100 focus:bg-white"} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] border-b border-gray-100">
              <tr>
                <th className="px-8 py-6">Perfil do Membro</th>
                <th className="px-8 py-6 hidden md:table-cell">Informações de Contato</th>
                <th className="px-8 py-6 hidden lg:table-cell text-center">Eclesiástico</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                    <Loader2 className="animate-spin text-gold-500 mx-auto" size={48} />
                    <p className="text-gray-400 mt-6 italic tracking-widest text-xs uppercase">Sincronizando Fichas...</p>
                  </td>
                </tr>
              ) : (
                members.filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                  <tr key={m.id} className="hover:bg-stone-50/80 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-navy-50 border-4 border-white shadow-xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-500 ring-1 ring-gray-100">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-navy-900 font-serif font-bold text-xl uppercase">{m.fullName[0]}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-navy-900 text-base font-serif">{m.fullName}</p>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-600 font-bold mt-0.5">{m.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden md:table-cell">
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-3 text-gray-600 font-medium"><Mail size={14} className="text-gold-500"/> {m.email || 'Não cadastrado'}</p>
                        <p className="flex items-center gap-3 text-gray-600 font-medium"><Phone size={14} className="text-gold-500"/> {m.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden lg:table-cell text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                          m.status === 'Ativo' ? 'bg-green-50 text-green-700 border border-green-200' : 
                          m.status === 'Ausente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {m.status}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400 uppercase font-bold tracking-tighter">
                          <UserCheck size={10} className="text-gold-500"/> Recepção: {m.receptionDate ? new Date(m.receptionDate).toLocaleDateString('pt-BR') : '---'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => { setEditingId(m.id); setFormData(m); setShowModal(true); }} 
                          className="p-3 text-navy-900 hover:bg-white hover:shadow-lg rounded-xl transition-all border border-transparent hover:border-gray-100"
                          title="Editar Membro"
                        >
                          <Edit2 size={18}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id, m.fullName)} 
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:shadow-lg rounded-xl transition-all border border-transparent hover:border-red-100"
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
        <div className="fixed inset-0 bg-navy-900/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            {/* Modal Header */}
            <div className="p-10 border-b border-gray-100 bg-stone-50/50 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                   <User size={32} className="text-gold-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-navy-900">{editingId ? 'Editar Registro' : 'Novo Membro IBOC'}</h2>
                  <p className="text-xs text-gold-600 uppercase tracking-[0.3em] mt-1 font-bold">Ficha Ministerial de Membresia Completa</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200 shadow-sm">
                <X className="text-gray-400 hover:text-navy-900" size={28}/>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center bg-stone-50/30 p-8 rounded-3xl border border-dashed border-stone-200">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full bg-white border-8 border-white shadow-2xl overflow-hidden ring-1 ring-gold-200 transition-transform duration-500 group-hover:scale-105">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <User size={64} />
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-navy-900/60 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-white" size={32} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-2 right-2 p-3.5 bg-gold-500 text-white rounded-2xl shadow-2xl cursor-pointer hover:bg-gold-600 transition-all border-4 border-white hover:scale-110 active:scale-95">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] mt-6 font-bold">Imagem de Identificação Ministerial</p>
              </div>

              {/* Seção: Identidade & Família */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-gold-50 rounded-lg text-gold-600"><User size={20} /></div>
                  <h4 className="font-serif font-bold text-navy-900 text-2xl italic">Identidade & Família</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome Completo do Membro</label>
                    <input required className={inputClass} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} placeholder="NOME COMPLETO" />
                  </div>
                  <div>
                    <label className={labelClass}>Data de Nascimento</label>
                    <input type="date" className={inputClass} value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Email de Contato</label>
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
                  <div className="lg:col-span-1">
                    <label className={labelClass}>Nome do Pai</label>
                    <input className={inputClass} value={formData.fatherName || ''} onChange={e => setFormData({...formData, fatherName: e.target.value})} placeholder="FILIAÇÃO PATERNA" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={labelClass}>Nome da Mãe</label>
                    <input className={inputClass} value={formData.motherName || ''} onChange={e => setFormData({...formData, motherName: e.target.value})} placeholder="FILIAÇÃO MATERNA" />
                  </div>
                </div>
              </div>

              {/* Seção: Endereço & Localização */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                   <div className="p-2 bg-navy-50 rounded-lg text-navy-800"><MapPin size={20} /></div>
                  <h4 className="font-serif font-bold text-navy-900 text-2xl italic">Endereço & Localização</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Logradouro (Rua, Avenida, Número)</label>
                    <input className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="RUA EXEMPRO, 123" />
                  </div>
                  <div>
                    <label className={labelClass}>Bairro</label>
                    <input className={inputClass} value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} placeholder="BAIRRO" />
                  </div>
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input className={inputClass} value={formData.city || 'Fortaleza'} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Seção: Segurança & Acesso Digital */}
              <div className="space-y-8 bg-gold-50/30 p-8 rounded-[2rem] border border-gold-100 shadow-inner">
                <div className="flex items-center gap-4 border-b border-gold-200/50 pb-4">
                  <div className="p-2 bg-navy-900 rounded-lg text-gold-500 shadow-lg"><Lock size={20} /></div>
                  <h4 className="font-serif font-bold text-navy-900 text-2xl italic">Segurança & Acesso Digital</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className={labelClass}>Usuário / Login</label>
                    <input className={inputClass + " border-gold-200"} value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="usuario.iboc" />
                  </div>
                  <div>
                    <label className={labelClass}>Senha Secreta</label>
                    <input type="password" className={inputClass + " border-gold-200"} value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={labelClass}>Privilégios Administrativos</label>
                    <select className={inputClass + " border-gold-200 font-bold"} value={formData.permissions || 'viewer'} onChange={e => setFormData({...formData, permissions: e.target.value as any})}>
                      <option value="viewer">Membro (Acesso Público)</option>
                      <option value="editor">Líder (Editor de Conteúdo)</option>
                      <option value="admin">Gestor (Controle Total)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção: Caminhada com Cristo (Histórico Eclesiástico) */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                   <div className="p-2 bg-gold-500 rounded-lg text-white shadow-lg"><Award size={20} /></div>
                  <h4 className="font-serif font-bold text-navy-900 text-2xl italic">Caminhada com Cristo</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                    <label className={labelClass}>Status Eclesiástico</label>
                    <select className={inputClass + " font-bold border-navy-900/10"} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      <option value="Ativo">🟢 Ativo</option>
                      <option value="Em Observação">🟡 Em Observação</option>
                      <option value="Ausente">⚪ Ausente</option>
                      <option value="Transferido">🔵 Transferido</option>
                      <option value="Falecido">⚫ Falecido</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Função Ministerial</label>
                    <select className={inputClass} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                      <option value="Membro">Membro</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Liderança">Liderança</option>
                      <option value="Diácono">Diácono(isa)</option>
                      <option value="Professor EBD">Professor EBD</option>
                      <option value="Músico">Músico</option>
                      <option value="Porteiro">Porteiro</option>
                      <option value="Tesoureiro 1">Tesoureiro 1</option>
                      <option value="Tesoureiro 2">Tesoureiro 2</option>
                      <option value="Conselho Fiscal 1">Conselho Fiscal 1</option>
                      <option value="Conselho Fiscal 2">Conselho Fiscal 2</option>
                      <option value="Conselho Fiscal 3">Conselho Fiscal 3</option>
                      <option value="Secretaria 1">Secretaria 1</option>
                      <option value="Secretaria 2">Secretaria 2</option>
                      <option value="Superentendente">Superentendente</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Recepção</label>
                    <select className={inputClass} value={formData.receptionType} onChange={e => setFormData({...formData, receptionType: e.target.value as any})}>
                      <option value="Batismo">Batismo</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Aclamação">Aclamação</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Data de Recepção na IBOC</label>
                    <input type="date" className={inputClass} value={formData.receptionDate || ''} onChange={e => setFormData({...formData, receptionDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Data do Batismo nas Águas</label>
                    <input type="date" className={inputClass} value={formData.baptismDate || ''} onChange={e => setFormData({...formData, baptismDate: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Igreja de Origem</label>
                    <input className={inputClass} value={formData.previousChurch || ''} onChange={e => setFormData({...formData, previousChurch: e.target.value})} placeholder="CONGREGAÇÃO ANTERIOR" />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-2">
                       <BookOpen size={16} className="text-gold-600" />
                       <label className={labelClass + " !mb-0"}>Dons Espirituais & Ministérios de Atuação</label>
                    </div>
                    <textarea 
                       className={inputClass + " h-32 resize-none shadow-inner border-gray-100"} 
                       value={formData.spiritualGifts || ''} 
                       onChange={e => setFormData({...formData, spiritualGifts: e.target.value})} 
                       placeholder="Descreva aqui os dons, habilidades e ministérios em que o membro já atua ou deseja atuar (Ex: Louvor, Kids, Som, Zeladoria...)" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-10 border-t border-stone-50 bg-stone-50/50 flex justify-end gap-6 rounded-b-[2.5rem]">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-12 py-4 rounded-2xl text-gray-500 font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-navy-900 transition-all border border-transparent hover:border-gray-100"
              >
                Descartar
              </button>
              <Button onClick={handleSave} disabled={loading} className="px-20 py-4 rounded-2xl shadow-glow font-bold text-sm">
                {loading ? <Loader2 className="animate-spin mr-3" size={20}/> : <CheckCircle2 size={20} className="mr-3"/>}
                {editingId ? 'Confirmar Atualização' : 'Efetivar Cadastro'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
