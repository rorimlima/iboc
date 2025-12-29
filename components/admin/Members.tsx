import React, { useState, useEffect } from 'react';
import { Member, AppUser } from '../../types';
import { Button } from '../ui/Button';
import { Edit2, Trash2, Plus, Search, Filter, Loader2, User, Upload, Camera, Lock, Shield, FileText, Printer, BarChart3, Cake, MapPin, AlertCircle, CheckSquare, MessageCircle, Type } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, uploadImage, updateDocument } from '../../services/firestore';

interface AdminMembersProps {
    currentUser: AppUser | null;
}

export const AdminMembers: React.FC<AdminMembersProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State
  const [currentView, setCurrentView] = useState<'list' | 'reports'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'personal' | 'spiritual' | 'service'>('personal');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Document Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedMemberForDoc, setSelectedMemberForDoc] = useState<Member | null>(null);

  // Form State
  const initialFormState: Omit<Member, 'id'> = {
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    photoUrl: '',
    
    // Pessoal
    fatherName: '',
    motherName: '',
    maritalStatus: 'Solteiro',
    address: '',
    neighborhood: '',
    city: 'Fortaleza',
    
    // Espiritual
    status: 'Ativo',
    role: 'Membro',
    baptismDate: '',
    receptionDate: new Date().toISOString().split('T')[0],
    receptionType: 'Aclamação',
    previousChurch: '',
    
    // Serviço / Auth
    ministries: [],
    spiritualGifts: '',
    username: '',
    password: '',
    permissions: 'viewer'
  };
  const [formData, setFormData] = useState(initialFormState);

  // Permission Logic
  const canManageUsers = currentUser?.type === 'master' || currentUser?.permissions === 'admin';

  // Fetch Members
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    const data = await getCollection<Member>('members');
    // Sort by Name
    data.sort((a, b) => a.fullName.localeCompare(b.fullName));
    setMembers(data);
    setLoading(false);
  };

  // --- Actions ---
  const openWhatsApp = (phone: string) => {
      // Remove tudo que não é número
      const cleanPhone = phone.replace(/\D/g, '');
      // Adiciona 55 se não tiver
      const fullNumber = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${fullNumber}`, '_blank');
  };

  const openGoogleMaps = (member: Member) => {
      const fullAddress = `${member.address}, ${member.neighborhood || ''}, ${member.city || 'Fortaleza'} - CE`;
      const encoded = encodeURIComponent(fullAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  // --- CRUD Handlers ---

  const handleOpenModal = (member?: Member) => {
      setModalTab('personal');
      if (member) {
          setEditingId(member.id);
          // Merge initial state ensures new fields exist even if editing old record
          setFormData({ ...initialFormState, ...member });
      } else {
          setEditingId(null);
          setFormData(initialFormState);
      }
      setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      await deleteDocument('members', id);
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleSave = async () => {
    if (!formData.fullName) return alert("Nome é obrigatório");
    
    setLoading(true);
    try {
      if (editingId) {
          await updateDocument('members', editingId, formData);
          setMembers(members.map(m => m.id === editingId ? { ...formData, id: editingId } : m));
      } else {
          const newMember = await addDocument('members', formData);
          setMembers([...members, newMember as Member]);
      }
      setShowModal(false);
    } catch (error) {
      alert("Erro ao salvar membro");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Regra de formatação: Nome sempre em maiúsculo
    const finalValue = name === 'fullName' ? value.toUpperCase() : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleMinistryChange = (ministry: string) => {
      const current = formData.ministries || [];
      if (current.includes(ministry)) {
          setFormData(prev => ({ ...prev, ministries: current.filter(m => m !== ministry) }));
      } else {
          setFormData(prev => ({ ...prev, ministries: [...current, ministry] }));
      }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
        const url = await uploadImage(file, 'members_photos');
        setFormData(prev => ({ ...prev, photoUrl: url }));
    } catch (error) {
        alert("Erro no upload da foto.");
    } finally {
        setUploadingPhoto(false);
    }
  };

  // --- Batch Operations ---
  const handleBatchFormatNames = async () => {
      if (!confirm("Esta ação irá percorrer TODOS os membros cadastrados e converter seus nomes para LETRAS MAIÚSCULAS. Deseja continuar?")) return;
      
      setLoading(true);
      try {
          let updatedCount = 0;
          for (const member of members) {
              const upperName = member.fullName.toUpperCase();
              
              // Só atualiza se for diferente para economizar escritas
              if (member.fullName !== upperName) {
                  await updateDocument('members', member.id, { fullName: upperName });
                  updatedCount++;
              }
          }
          
          await loadMembers(); // Recarrega a lista
          alert(`Operação concluída!\n\n${updatedCount} nomes foram corrigidos para maiúsculo.`);
      } catch (error) {
          console.error(error);
          alert("Erro ao processar atualização em lote.");
      } finally {
          setLoading(false);
      }
  };

  // --- Filter Logic ---
  const filteredMembers = members.filter(member => {
    const name = member.fullName || '';
    const email = member.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- Document Generator Logic ---
  const handlePrintDocument = (type: 'Recomendação' | 'Transferência' | 'Batismo' | 'Ficha') => {
      if (!selectedMemberForDoc) return;
      const m = selectedMemberForDoc;
      const date = new Date().toLocaleDateString('pt-BR');
      
      let title = '';
      let content = '';

      if (type === 'Recomendação') {
          title = 'Carta de Recomendação';
          content = `
            <p>A quem possa interessar,</p>
            <p>Recomendamos o(a) irmão(ã) <strong>${m.fullName}</strong>, membro desta igreja em plena comunhão, não constando nada que desabone sua conduta cristã até a presente data.</p>
            <p>Recomendamos que o(a) recebam no Senhor com a dignidade que convém aos santos.</p>
          `;
      } else if (type === 'Transferência') {
          title = 'Carta de Transferência';
          content = `
            <p>Ao Pastor e Igreja coirmã,</p>
            <p>Informamos que o(a) irmão(ã) <strong>${m.fullName}</strong>, solicitou transferência para vossa comunidade.</p>
            <p>Ao ser recebido(a) por vós, solicitamos o obséquio de nos comunicar para que possamos desligá-lo(a) do nosso rol de membros.</p>
          `;
      } else if (type === 'Batismo') {
          title = 'Certificado de Batismo';
          content = `
            <div style="text-align: center; padding: 40px; border: 5px double #C5A059;">
                <h1>Certificado de Batismo</h1>
                <p>Certificamos que</p>
                <h2>${m.fullName}</h2>
                <p>Foi batizado(a) em nome do Pai, do Filho e do Espírito Santo.</p>
                <p>Data: ${m.baptismDate ? new Date(m.baptismDate).toLocaleDateString('pt-BR') : '__/__/____'}</p>
                <br/><br/>
                <hr style="width: 50%" />
                <p>Pastor Presidente</p>
            </div>
          `;
      } else if (type === 'Ficha') {
          title = `Ficha Cadastral - ${m.fullName}`;
          content = `
             <h3>Dados Pessoais</h3>
             <p><strong>Nome:</strong> ${m.fullName}</p>
             <p><strong>Est. Civil:</strong> ${m.maritalStatus || '-'} | <strong>Nasc:</strong> ${m.birthDate || '-'}</p>
             <p><strong>Filiação:</strong> ${m.fatherName || '-'} e ${m.motherName || '-'}</p>
             <p><strong>Endereço:</strong> ${m.address} - ${m.neighborhood}</p>
             <hr/>
             <h3>Dados Eclesiásticos</h3>
             <p><strong>Status:</strong> ${m.status} | <strong>Cargo:</strong> ${m.role}</p>
             <p><strong>Batismo:</strong> ${m.baptismDate || '-'} | <strong>Recepção:</strong> ${m.receptionDate || '-'}</p>
             <p><strong>Ministérios:</strong> ${m.ministries?.join(', ') || 'Nenhum'}</p>
          `;
      }

      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
          printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #333; }
                        h1, h2, h3 { color: #003366; }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #C5A059; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">Igreja Batista O Caminho</div>
                        <p>R. Icaraçu, 1110 - Barroso, Fortaleza - CE</p>
                    </div>
                    ${type !== 'Batismo' ? `<h2>${title}</h2>` : ''}
                    <div class="content">${content}</div>
                    ${type !== 'Batismo' && type !== 'Ficha' ? `
                    <br/><br/><br/>
                    <p style="text-align: right;">Fortaleza, ${date}</p>
                    <br/><br/>
                    <div style="border-top: 1px solid #000; width: 200px; margin-left: auto; text-align: center; padding-top: 5px;">Secretaria / Pastor</div>
                    ` : ''}
                </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
      setShowDocModal(false);
  };

  // --- Helpers ---
  const calculateAge = (dateString?: string) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-heading font-bold text-navy-900">Gestão de Membros</h1>
           <p className="text-gray-500 text-sm">Cadastro, relatórios e documentos.</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-gray-200">
           <button 
             onClick={() => setCurrentView('list')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'list' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
           >
              Lista
           </button>
           <button 
             onClick={() => setCurrentView('reports')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${currentView === 'reports' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
           >
              <BarChart3 size={16} /> Relatórios
           </button>
        </div>
        {currentView === 'list' && (
            <Button onClick={() => handleOpenModal()} className="w-full md:w-auto">
              <Plus size={18} className="mr-2" /> Novo Membro
            </Button>
        )}
      </div>

      {/* --- LIST VIEW --- */}
      {currentView === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou email..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select 
                className="w-full md:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white text-gray-900"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Em Observação">Em Observação</option>
                <option value="Ausente">Ausente</option>
                <option value="Transferido">Transferido</option>
              </select>
            </div>
          </div>

          {/* Table - Responsive: Horizontal Scroll & Hidden Columns */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-navy-900" size={32} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                    <tr>
                      <th className="px-6 py-4">Membro</th>
                      <th className="px-6 py-4 hidden md:table-cell">Contato & Localização</th>
                      <th className="px-6 py-4 hidden md:table-cell">Eclesiástico</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                                {member.photoUrl ? (
                                    <img src={member.photoUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                                )}
                             </div>
                             <div>
                                <div className="font-medium text-gray-900">{member.fullName}</div>
                                <div className="text-xs text-gray-500 mt-1">{calculateAge(member.birthDate)} anos • {member.maritalStatus || 'Solteiro'}</div>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex flex-col gap-2">
                             {/* Phone with WhatsApp */}
                             <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{member.phone || 'S/ Tel'}</span>
                                {member.phone && (
                                    <button 
                                      onClick={() => openWhatsApp(member.phone)} 
                                      className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 hover:scale-110 transition-all shadow-sm"
                                      title="Abrir WhatsApp"
                                    >
                                        <MessageCircle size={14} />
                                    </button>
                                )}
                             </div>
                             
                             {/* Address with Maps */}
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 truncate max-w-[150px]" title={`${member.address} - ${member.neighborhood}`}>
                                    {member.address ? `${member.neighborhood || ''}` : 'Sem endereço'}
                                </span>
                                {member.address && (
                                    <button 
                                        onClick={() => openGoogleMaps(member)}
                                        className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-110 transition-all shadow-sm"
                                        title="Localizar no Maps"
                                    >
                                        <MapPin size={14} />
                                    </button>
                                )}
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                              {member.role}
                            </span>
                            {member.ministries && member.ministries.length > 0 && (
                                <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {member.ministries.join(', ')}
                                </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.status === 'Ativo' ? 'bg-green-100 text-green-800' : 
                            member.status === 'Ausente' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                           <button 
                            className="p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded transition-colors" 
                            title="Emitir Documento"
                            onClick={() => { setSelectedMemberForDoc(member); setShowDocModal(true); }}
                           >
                            <Printer size={18} />
                          </button>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded transition-colors"
                            onClick={() => handleOpenModal(member)}
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            onClick={() => handleDelete(member.id)}
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- REPORTS VIEW --- */}
      {currentView === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
           
           {/* Aniversariantes */}
           <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-gold-500">
              <h3 className="font-heading font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <Cake size={20} className="text-gold-500" /> Aniversariantes do Mês
              </h3>
              <ul className="space-y-3">
                  {members.filter(m => {
                      if(!m.birthDate) return false;
                      const month = new Date(m.birthDate).getMonth();
                      return month === new Date().getMonth();
                  }).sort((a,b) => {
                      const dayA = new Date(a.birthDate!).getDate();
                      const dayB = new Date(b.birthDate!).getDate();
                      return dayA - dayB;
                  }).map(m => (
                      <li key={m.id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <span className="text-sm font-medium text-navy-900">{m.fullName}</span>
                          <span className="text-xs bg-gold-100 text-gold-800 px-2 py-1 rounded-full">
                              Dia {new Date(m.birthDate).getDate()}
                          </span>
                      </li>
                  ))}
                  {members.filter(m => m.birthDate && new Date(m.birthDate).getMonth() === new Date().getMonth()).length === 0 && (
                      <p className="text-gray-400 text-sm italic">Nenhum aniversariante neste mês.</p>
                  )}
              </ul>
           </div>

           {/* Estatísticas */}
           <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-navy-900">
              <h3 className="font-heading font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-navy-900" /> Demografia
              </h3>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Total de Membros</span>
                      <span className="font-bold text-lg">{members.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Ativos</span>
                      <span className="font-bold text-green-600">{members.filter(m => m.status === 'Ativo').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Crianças (0-12)</span>
                      <span className="font-bold">{members.filter(m => calculateAge(m.birthDate) <= 12).length}</span>
                  </div>
                   <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Jovens (13-29)</span>
                      <span className="font-bold">{members.filter(m => { const age = calculateAge(m.birthDate); return age > 12 && age < 30; }).length}</span>
                  </div>
              </div>
           </div>

           {/* Membros Ausentes */}
           <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500">
              <h3 className="font-heading font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" /> Membros Ausentes
              </h3>
              <p className="text-xs text-gray-500 mb-3">Membros marcados como 'Ausente' ou 'Em Observação'.</p>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {members.filter(m => m.status === 'Ausente' || m.status === 'Em Observação').map(m => (
                      <li key={m.id} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                          <span className="text-red-900 font-medium truncate max-w-[150px]">{m.fullName}</span>
                          <span className="text-xs text-red-600">{m.status}</span>
                      </li>
                  ))}
                  {members.filter(m => m.status === 'Ausente' || m.status === 'Em Observação').length === 0 && (
                      <p className="text-green-600 text-sm font-medium">Todos os membros estão ativos!</p>
                  )}
              </ul>
           </div>
           
           {/* Manutenção de Cadastro */}
           <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col justify-between border-t-4 border-gray-400">
               <div>
                   <h3 className="font-heading font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                       <Type size={20} className="text-gray-600" /> Manutenção de Cadastro
                   </h3>
                   <p className="text-sm text-gray-500 mb-4">Ferramenta para padronizar todos os nomes em letras MAIÚSCULAS.</p>
               </div>
               <Button variant="outline" onClick={handleBatchFormatNames}>
                   <Type size={18} className="mr-2"/> Padronizar Nomes
               </Button>
           </div>

           {/* Lista de Chamada (Action) */}
           <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                   <h3 className="font-heading font-bold text-lg text-navy-900">Controle de Frequência</h3>
                   <p className="text-sm text-gray-500">Gere uma lista de presença para EBD ou Cultos para impressão.</p>
               </div>
               <Button onClick={() => {
                   const printWindow = window.open('', '', 'width=800,height=600');
                   if(printWindow) {
                       const listHtml = members.sort((a,b) => a.fullName.localeCompare(b.fullName)).map(m => `
                           <tr style="border-bottom: 1px solid #ddd;">
                               <td style="padding: 8px;">${m.fullName}</td>
                               <td style="padding: 8px; border-left: 1px solid #ddd;">[ ] P &nbsp; [ ] F</td>
                           </tr>
                       `).join('');

                       printWindow.document.write(`
                           <html>
                               <head><title>Lista de Chamada</title></head>
                               <body style="font-family: sans-serif; padding: 20px;">
                                   <h2 style="text-align: center;">Lista de Presença / Chamada</h2>
                                   <p style="text-align: center;">Data: ____/____/_______ &nbsp;&nbsp; Evento: ________________________</p>
                                   <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                       <thead>
                                           <tr style="background: #f0f0f0; text-align: left;">
                                               <th style="padding: 10px; border-bottom: 2px solid #ccc;">Nome do Membro</th>
                                               <th style="padding: 10px; border-bottom: 2px solid #ccc; width: 150px;">Presença</th>
                                           </tr>
                                       </thead>
                                       <tbody>${listHtml}</tbody>
                                   </table>
                               </body>
                           </html>
                       `);
                       printWindow.document.close();
                       printWindow.print();
                   }
               }}>
                   <Printer size={18} className="mr-2"/> Imprimir Lista de Chamada
               </Button>
           </div>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-3xl max-h-[90vh] flex flex-col my-4">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-navy-50 rounded-t-xl shrink-0">
              <h3 className="font-heading font-bold text-lg text-navy-900">
                {editingId ? `Editar: ${formData.fullName}` : 'Novo Membro'}
              </h3>
              <button onClick={() => setShowModal(false)}><span className="text-gray-400 text-2xl hover:text-gray-600">&times;</span></button>
            </div>
            
            {/* Tabs Header - Scrollable on mobile */}
            <div className="flex border-b border-gray-200 px-6 overflow-x-auto shrink-0">
                <button 
                  onClick={() => setModalTab('personal')} 
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'personal' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Dados Pessoais
                </button>
                <button 
                  onClick={() => setModalTab('spiritual')} 
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'spiritual' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Vida Eclesiástica
                </button>
                <button 
                  onClick={() => setModalTab('service')} 
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${modalTab === 'service' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Ministério {canManageUsers ? '& Acesso' : ''}
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
               
               {/* --- TAB: PESSOAL --- */}
               {modalTab === 'personal' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="col-span-1 md:col-span-2 flex justify-center mb-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300">
                                    {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-300"/>}
                                </div>
                                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-navy-900 text-white p-1.5 rounded-full cursor-pointer hover:bg-navy-800">
                                    {uploadingPhoto ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14} />}
                                    <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                            </div>
                       </div>
                       
                       <div className="col-span-1 md:col-span-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                           <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" placeholder="Nome Completo" />
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Data de Nascimento</label>
                           <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Estado Civil</label>
                           <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange as any} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none">
                               <option value="Solteiro">Solteiro(a)</option>
                               <option value="Casado">Casado(a)</option>
                               <option value="Viúvo">Viúvo(a)</option>
                               <option value="Divorciado">Divorciado(a)</option>
                               <option value="União Estável">União Estável</option>
                           </select>
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Nome do Pai</label>
                           <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Nome da Mãe</label>
                           <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Telefone / WhatsApp</label>
                           <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                           <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>

                       <div className="col-span-1 md:col-span-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Endereço</label>
                           <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" placeholder="Logradouro, Número" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                           <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                           <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                   </div>
               )}

               {/* --- TAB: ESPIRITUAL --- */}
               {modalTab === 'spiritual' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Situação Atual</label>
                           <select name="status" value={formData.status} onChange={handleInputChange as any} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none">
                               <option value="Ativo">Ativo</option>
                               <option value="Em Observação">Em Observação</option>
                               <option value="Ausente">Ausente</option>
                               <option value="Transferido">Transferido</option>
                               <option value="Falecido">Falecido</option>
                           </select>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Cargo Eclesiástico</label>
                           <select name="role" value={formData.role} onChange={handleInputChange as any} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none">
                               <option value="Membro">Membro</option>
                               <option value="Diácono">Diácono</option>
                               <option value="Liderança">Liderança</option>
                               <option value="Pastor">Pastor</option>
                               <option value="Professor EBD">Professor EBD</option>
                               <option value="Porteiro">Porteiro/Recepção</option>
                               <option value="Músico">Músico/Levita</option>
                           </select>
                       </div>

                       <div className="col-span-1 md:col-span-2 border-t border-gray-100 my-2"></div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Data de Batismo</label>
                           <input type="date" name="baptismDate" value={formData.baptismDate} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Igreja Anterior (Se houver)</label>
                           <input type="text" name="previousChurch" value={formData.previousChurch} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" placeholder="Nome da Igreja" />
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Data de Recepção (IBOC)</label>
                           <input type="date" name="receptionDate" value={formData.receptionDate} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Modo de Recepção</label>
                           <select name="receptionType" value={formData.receptionType} onChange={handleInputChange as any} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none">
                               <option value="Batismo">Batismo</option>
                               <option value="Aclamação">Aclamação (Testemunho)</option>
                               <option value="Transferência">Carta de Transferência</option>
                           </select>
                       </div>
                   </div>
               )}

               {/* --- TAB: SERVICE & AUTH --- */}
               {modalTab === 'service' && (
                   <div className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ministérios que Participa</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {['Louvor', 'Infantil', 'Recepção', 'Intercessão', 'Ação Social', 'Mídia/Tecnologia', 'Jovens', 'Casais', 'Homens', 'Mulheres'].map(min => (
                                   <label key={min} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                       <input 
                                         type="checkbox" 
                                         checked={formData.ministries?.includes(min)} 
                                         onChange={() => handleMinistryChange(min)}
                                         className="rounded text-navy-900 focus:ring-navy-900"
                                       />
                                       <span className="text-sm">{min}</span>
                                   </label>
                               ))}
                           </div>
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">Dons e Talentos (Observações)</label>
                           <textarea name="spiritualGifts" value={formData.spiritualGifts} onChange={handleInputChange} rows={2} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" placeholder="Ex: Toca violão, sabe cozinhar, ensino..." />
                       </div>

                       {/* Only show User Management for Master/Admin */}
                       {canManageUsers ? (
                           <div className="bg-navy-50 p-4 rounded-lg border border-navy-100 mt-4 animate-in fade-in">
                               <h4 className="font-bold text-navy-900 text-sm mb-3 flex items-center gap-2"><Shield size={16}/> Acesso ao Sistema Admin</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                   <div>
                                       <label className="text-xs text-gray-500">Usuário</label>
                                       <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" placeholder="Login" />
                                   </div>
                                   <div>
                                       <label className="text-xs text-gray-500">Senha</label>
                                       <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none" placeholder="Senha" />
                                   </div>
                                   <div className="col-span-1 md:col-span-2">
                                       <label className="text-xs text-gray-500">Nível de Permissão</label>
                                       <select name="permissions" value={formData.permissions} onChange={handleInputChange as any} className="w-full border border-gray-300 bg-white text-gray-900 p-2 rounded focus:ring-2 focus:ring-navy-900 focus:outline-none">
                                           <option value="viewer">Visualizador (Somente Leitura)</option>
                                           <option value="editor">Editor (Financeiro/Conteúdo)</option>
                                           <option value="admin">Administrador (Total)</option>
                                       </select>
                                   </div>
                               </div>
                           </div>
                       ) : (
                           <div className="mt-4 p-3 bg-gray-50 text-gray-500 text-xs rounded border border-gray-100 italic text-center">
                               Somente usuários Master ou Admin podem gerenciar credenciais de acesso.
                           </div>
                       )}
                   </div>
               )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl shrink-0">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Ficha'}
                </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- DOC SELECT MODAL --- */}
      {showDocModal && selectedMemberForDoc && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 w-[95%] max-w-sm">
                  <h3 className="font-bold text-lg text-navy-900 mb-4 text-center">Emitir Documento</h3>
                  <p className="text-center text-gray-500 text-sm mb-6">Selecione o documento para <strong>{selectedMemberForDoc.fullName}</strong></p>
                  
                  <div className="space-y-2">
                      <button onClick={() => handlePrintDocument('Recomendação')} className="w-full p-3 text-left border rounded hover:bg-navy-50 hover:border-navy-900 transition-colors flex items-center gap-3">
                          <FileText size={18} className="text-navy-900"/> Carta de Recomendação
                      </button>
                      <button onClick={() => handlePrintDocument('Transferência')} className="w-full p-3 text-left border rounded hover:bg-navy-50 hover:border-navy-900 transition-colors flex items-center gap-3">
                          <FileText size={18} className="text-navy-900"/> Carta de Transferência
                      </button>
                      <button onClick={() => handlePrintDocument('Batismo')} className="w-full p-3 text-left border rounded hover:bg-navy-50 hover:border-navy-900 transition-colors flex items-center gap-3">
                          <CheckSquare size={18} className="text-navy-900"/> Certificado de Batismo
                      </button>
                      <button onClick={() => handlePrintDocument('Ficha')} className="w-full p-3 text-left border rounded hover:bg-navy-50 hover:border-navy-900 transition-colors flex items-center gap-3">
                          <User size={18} className="text-navy-900"/> Ficha Cadastral Completa
                      </button>
                  </div>

                  <button onClick={() => setShowDocModal(false)} className="mt-6 w-full text-center text-gray-400 hover:text-gray-600 text-sm">Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};