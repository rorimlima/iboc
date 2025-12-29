import React, { useState, useEffect } from 'react';
import { Asset, Member, Transaction, MaintenanceRecord } from '../../types';
import { Button } from '../ui/Button';
import { Package, Search, Plus, Loader2, Wrench, BookOpen, Music, Tv, User, Calendar, DollarSign, CheckCircle2, History, AlertTriangle, ArrowRightLeft, Camera, Edit2, X, Calculator, Trash2 } from 'lucide-react';
import { getCollection, addDocument, updateDocument, uploadImage, deleteDocument } from '../../services/firestore';

export const AdminResources: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Views
  const [activeTab, setActiveTab] = useState<'inventory' | 'loans' | 'maintenance'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Forms
  const initialAssetState: Omit<Asset, 'id'> = {
    name: '',
    category: 'Outros',
    acquisitionDate: new Date().toISOString().split('T')[0],
    value: 0,
    quantity: 1,
    condition: 'Novo',
    status: 'Disponível',
    location: 'Sede',
    photoUrl: ''
  };
  // Use Partial<Asset> to allow optional fields like maintenanceHistory to be stored in form state during edit
  const [assetForm, setAssetForm] = useState<Partial<Asset>>(initialAssetState);

  // Loan Form State
  const [loanForm, setLoanForm] = useState({ memberId: '', days: 7 });

  // Maintenance Form State
  const [maintForm, setMaintForm] = useState({ 
    description: '', 
    cost: 0, 
    provider: '', 
    launchFinance: false,
    financeAccount: 'Banco do Brasil' // default account for finance launch
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [assetsData, membersData] = await Promise.all([
        getCollection<Asset>('assets'),
        getCollection<Member>('members')
    ]);
    setAssets(assetsData);
    setMembers(membersData.sort((a,b) => a.fullName.localeCompare(b.fullName)));
    setLoading(false);
  };

  // --- CRUD Asset ---

  const handleOpenAssetModal = (asset?: Asset) => {
      if (asset) {
          const { id, ...rest } = asset;
          // Spread existing asset data into form to preserve history/loans not visible in form
          setAssetForm({ ...rest }); 
          setSelectedAsset(asset);
      } else {
          setAssetForm(initialAssetState);
          setSelectedAsset(null);
      }
      setShowAssetModal(true);
  };

  const handleSaveAsset = async () => {
      if (!assetForm.name) return alert("Nome do bem é obrigatório.");
      if ((assetForm.quantity || 0) < 1) return alert("A quantidade mínima é 1.");

      setSubmitting(true);
      try {
          // Clean data before saving
          const payload = {
              ...assetForm,
              value: Number(assetForm.value),
              quantity: Number(assetForm.quantity)
          };

          if (selectedAsset) {
              await updateDocument('assets', selectedAsset.id, payload);
              // Update local state preserving the ID
              setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, ...payload } : a));
          } else {
              const newAsset = await addDocument('assets', payload);
              setAssets(prev => [...prev, newAsset as Asset]);
          }
          setShowAssetModal(false);
      } catch (e) {
          alert("Erro ao salvar patrimônio.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleDeleteAsset = async (id: string) => {
      const assetToDelete = assets.find(a => a.id === id);
      if (!assetToDelete) return;
      
      // Permitir exclusão forçada mesmo se estiver emprestado, mas com aviso forte.
      if (assetToDelete.status === 'Emprestado') {
          const confirmForce = window.confirm(
              `ATENÇÃO: O item "${assetToDelete.name}" consta como EMPRESTADO.\n\n` +
              `Excluí-lo agora deixará o histórico incompleto e você não poderá registrar a devolução.\n\n` +
              `Deseja FORÇAR a exclusão mesmo assim?`
          );
          if (!confirmForce) return;
      } else {
          if (!window.confirm(`Tem certeza que deseja excluir "${assetToDelete.name}"?\n\nEsta ação removerá todo o histórico de manutenção e empréstimos deste item.`)) return;
      }
      
      try {
          await deleteDocument('assets', id);
          setAssets(prev => prev.filter(a => a.id !== id));
      } catch (e: any) {
          console.error(e);
          alert("Erro ao excluir item: " + (e.message || "Verifique suas permissões."));
      }
  };

  const handleAssetPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
        const url = await uploadImage(file, 'assets_photos');
        setAssetForm(prev => ({ ...prev, photoUrl: url }));
    } catch {
        alert("Erro no upload.");
    } finally {
        setUploadingPhoto(false);
    }
  };

  // --- Loan Logic ---

  const handleOpenLoanModal = (asset: Asset) => {
      setSelectedAsset(asset);
      setLoanForm({ memberId: '', days: 7 });
      setShowLoanModal(true);
  };

  const handleSaveLoan = async () => {
      if (!selectedAsset || !loanForm.memberId) return;
      const member = members.find(m => m.id === loanForm.memberId);
      if (!member) return;

      const loanDate = new Date();
      const returnDate = new Date();
      returnDate.setDate(loanDate.getDate() + loanForm.days);

      const updateData: Partial<Asset> = {
          status: 'Emprestado',
          currentLoan: {
              memberId: member.id,
              memberName: member.fullName,
              loanDate: loanDate.toISOString(),
              expectedReturnDate: returnDate.toISOString()
          }
      };

      setSubmitting(true);
      try {
          await updateDocument('assets', selectedAsset.id, updateData);
          setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, ...updateData } : a));
          setShowLoanModal(false);
      } catch (e) {
          alert("Erro ao registrar empréstimo.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleReturnLoan = async (asset: Asset) => {
      if (!confirm(`Confirmar devolução de "${asset.name}"?`)) return;
      
      const updateData: Partial<Asset> = {
          status: 'Disponível',
          currentLoan: undefined // Remove current loan data
          // In a real app, push to a loanHistory array
      };

      try {
          // Send field deletion to Firestore (undefined fields are typically ignored or require deleteField())
          // For simplicity in this helper, we update the object structure.
          await updateDocument('assets', asset.id, { status: 'Disponível', currentLoan: null });
          setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'Disponível', currentLoan: undefined } : a));
      } catch (e) {
          alert("Erro ao devolver item.");
      }
  };

  // --- Maintenance Logic ---

  const handleOpenMaintModal = (asset: Asset) => {
      setSelectedAsset(asset);
      setMaintForm({ description: '', cost: 0, provider: '', launchFinance: false, financeAccount: 'Banco do Brasil' });
      setShowMaintModal(true);
  };

  const handleSaveMaintenance = async () => {
      if (!selectedAsset || !maintForm.description) return alert("Descrição obrigatória.");
      
      setSubmitting(true);
      try {
          const maintRecord: MaintenanceRecord = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              description: maintForm.description,
              cost: Number(maintForm.cost),
              provider: maintForm.provider
          };

          // 1. Launch Finance if requested
          if (maintForm.launchFinance && maintForm.cost > 0) {
              const transaction: Omit<Transaction, 'id'> = {
                  type: 'Saída',
                  category: 'Manutenção',
                  amount: Number(maintForm.cost),
                  date: new Date().toISOString().split('T')[0],
                  description: `Manutenção: ${selectedAsset.name} - ${maintForm.description}`,
                  paymentMethod: 'Transferência', // Default fallback
                  bankAccount: maintForm.financeAccount as any,
                  contributorName: maintForm.provider
              };
              const transRef = await addDocument('financial', transaction);
              maintRecord.financeTransactionId = transRef.id;
          }

          // 2. Update Asset
          const updatedHistory = [...(selectedAsset.maintenanceHistory || []), maintRecord];
          const updateData: Partial<Asset> = {
              status: 'Em Manutenção', // Set status to maintenance
              condition: 'Em Manutenção',
              maintenanceHistory: updatedHistory
          };

          await updateDocument('assets', selectedAsset.id, updateData);
          setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, ...updateData, maintenanceHistory: updatedHistory } : a));
          
          setShowMaintModal(false);
          alert(maintForm.launchFinance ? "Manutenção registrada e despesa lançada no financeiro!" : "Histórico de manutenção atualizado.");

      } catch (e) {
          alert("Erro ao salvar manutenção.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleFinishMaintenance = async (asset: Asset) => {
      if (!confirm("Finalizar manutenção e marcar item como Disponível?")) return;
      
      const updateData: Partial<Asset> = {
          status: 'Disponível',
          condition: 'Bom' // Default to good after fix
      };

      try {
          await updateDocument('assets', asset.id, updateData);
          setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, ...updateData } : a));
      } catch (e) {
          alert("Erro ao finalizar manutenção.");
      }
  };

  // Filter
  const filteredAssets = assets.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'Móveis': return <Package />;
          case 'Som': return <Music />;
          case 'Instrumentos': return <Music />;
          case 'Eletrônicos': return <Tv />;
          case 'Literatura': return <BookOpen />;
          default: return <Package />;
      }
  };

  const inputClass = "w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-900";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-heading font-bold text-navy-900">Patrimônio e Recursos</h1>
           <p className="text-gray-500 text-sm">Controle de bens, empréstimos e manutenções.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => handleOpenAssetModal()}>
                <Plus size={18} className="mr-2" /> Novo Item
            </Button>
        </div>
      </div>

      {/* Navigation Tabs - Horizontal Scroll on Mobile */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-lg shadow-sm overflow-x-auto whitespace-nowrap">
          <button 
             onClick={() => setActiveTab('inventory')}
             className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'inventory' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <Package size={18} /> Inventário
          </button>
          <button 
             onClick={() => setActiveTab('loans')}
             className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'loans' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <ArrowRightLeft size={18} /> Empréstimos Ativos
             {assets.filter(a => a.status === 'Emprestado').length > 0 && (
                 <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{assets.filter(a => a.status === 'Emprestado').length}</span>
             )}
          </button>
          <button 
             onClick={() => setActiveTab('maintenance')}
             className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'maintenance' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <Wrench size={18} /> Histórico de Manutenção
          </button>
      </div>

      {/* Content Area */}
      <div className="bg-white p-6 rounded-b-lg shadow-sm min-h-[400px]">
          
          {/* --- INVENTORY VIEW --- */}
          {activeTab === 'inventory' && (
              <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar patrimônio..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {loading ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredAssets.map(asset => {
                              const quantity = asset.quantity || 1;
                              const totalValue = quantity * asset.value;
                              return (
                              <div key={asset.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                                  <div className="h-32 bg-gray-100 relative">
                                      {asset.photoUrl ? (
                                          <img src={asset.photoUrl} className="w-full h-full object-cover" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                                              {getCategoryIcon(asset.category)}
                                          </div>
                                      )}
                                      <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded shadow-sm 
                                          ${asset.status === 'Disponível' ? 'bg-green-100 text-green-700' : 
                                            asset.status === 'Emprestado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {asset.status}
                                      </div>
                                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                          Qtd: {quantity}
                                      </div>
                                  </div>
                                  <div className="p-4 flex-1">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <span className="text-xs text-gray-500 uppercase font-bold">{asset.category}</span>
                                              <h3 className="font-bold text-navy-900 text-lg leading-tight">{asset.name}</h3>
                                          </div>
                                          <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                              <button 
                                                onClick={() => handleOpenAssetModal(asset)} 
                                                className="bg-gray-100 hover:bg-navy-900 hover:text-white p-1.5 rounded-full transition-colors" 
                                                title="Editar"
                                              >
                                                  <Edit2 size={14} />
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteAsset(asset.id)} 
                                                className="bg-gray-100 hover:bg-red-600 hover:text-white p-1.5 rounded-full transition-colors" 
                                                title="Excluir"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      </div>
                                      
                                      <div className="mt-3 space-y-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                          <p className="flex justify-between">
                                              <span>Valor Unit.:</span> 
                                              <span>R$ {asset.value.toFixed(2)}</span>
                                          </p>
                                          <p className="flex justify-between font-bold text-navy-900 border-t border-gray-200 pt-1 mt-1">
                                              <span>Total Estimado:</span> 
                                              <span>R$ {totalValue.toFixed(2)}</span>
                                          </p>
                                      </div>
                                      
                                      <div className="mt-2 text-xs text-gray-500">
                                          <p>Local: {asset.location}</p>
                                          <p>Condição: {asset.condition}</p>
                                      </div>

                                      {asset.currentLoan && (
                                          <div className="mt-3 bg-red-50 p-2 rounded text-xs border border-red-100">
                                              <p className="font-bold text-red-800 flex items-center gap-1"><User size={12}/> {asset.currentLoan.memberName}</p>
                                              <p className="text-red-600">Devolução: {new Date(asset.currentLoan.expectedReturnDate).toLocaleDateString()}</p>
                                          </div>
                                      )}
                                  </div>
                                  
                                  {/* Actions Bar */}
                                  <div className="bg-gray-50 p-3 flex gap-2 border-t border-gray-100">
                                      {asset.status === 'Disponível' ? (
                                          <button 
                                            onClick={() => handleOpenLoanModal(asset)}
                                            className="flex-1 bg-white border border-gray-200 text-navy-900 text-xs font-medium py-2 rounded hover:bg-navy-50 flex items-center justify-center gap-1"
                                          >
                                              <ArrowRightLeft size={14}/> Emprestar
                                          </button>
                                      ) : asset.status === 'Emprestado' ? (
                                           <button 
                                            onClick={() => handleReturnLoan(asset)}
                                            className="flex-1 bg-navy-900 text-white text-xs font-medium py-2 rounded hover:bg-navy-800 flex items-center justify-center gap-1"
                                          >
                                              <CheckCircle2 size={14}/> Receber
                                          </button>
                                      ) : (
                                           <button 
                                            onClick={() => handleFinishMaintenance(asset)}
                                            className="flex-1 bg-green-600 text-white text-xs font-medium py-2 rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                          >
                                              <CheckCircle2 size={14}/> Finalizar Mnt.
                                          </button>
                                      )}

                                      <button 
                                        onClick={() => handleOpenMaintModal(asset)}
                                        className="flex-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium py-2 rounded hover:bg-gray-100 flex items-center justify-center gap-1"
                                      >
                                          <Wrench size={14}/> Manutenção
                                      </button>
                                  </div>
                              </div>
                          )})}
                      </div>
                  )}
              </div>
          )}

          {/* --- LOANS VIEW --- */}
          {activeTab === 'loans' && (
              <div>
                  <h3 className="font-bold text-navy-900 mb-4">Itens Emprestados Atualmente</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                              <tr>
                                  <th className="px-4 py-3">Item</th>
                                  <th className="px-4 py-3">Qtd</th>
                                  <th className="px-4 py-3">Membro</th>
                                  <th className="px-4 py-3 hidden md:table-cell">Data Empréstimo</th>
                                  <th className="px-4 py-3">Previsão Devolução</th>
                                  <th className="px-4 py-3 text-right">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {assets.filter(a => a.status === 'Emprestado' && a.currentLoan).map(asset => (
                                  <tr key={asset.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 font-medium text-navy-900">{asset.name}</td>
                                      <td className="px-4 py-3 text-center">{asset.quantity || 1}</td>
                                      <td className="px-4 py-3">{asset.currentLoan?.memberName}</td>
                                      <td className="px-4 py-3 hidden md:table-cell">{new Date(asset.currentLoan!.loanDate).toLocaleDateString()}</td>
                                      <td className="px-4 py-3">
                                          <span className={new Date(asset.currentLoan!.expectedReturnDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                                              {new Date(asset.currentLoan!.expectedReturnDate).toLocaleDateString()}
                                          </span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                          <Button size="sm" variant="secondary" onClick={() => handleReturnLoan(asset)}>
                                              Receber
                                          </Button>
                                      </td>
                                  </tr>
                              ))}
                              {assets.filter(a => a.status === 'Emprestado').length === 0 && (
                                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum empréstimo ativo.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* --- MAINTENANCE HISTORY VIEW --- */}
          {activeTab === 'maintenance' && (
              <div>
                  <h3 className="font-bold text-navy-900 mb-4">Histórico de Manutenções</h3>
                  <div className="space-y-4">
                      {assets.filter(a => a.maintenanceHistory && a.maintenanceHistory.length > 0).map(asset => (
                          <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-bold text-navy-900 border-b border-gray-100 pb-2 mb-2">{asset.name}</h4>
                              <div className="space-y-2">
                                  {asset.maintenanceHistory?.map((rec, idx) => (
                                      <div key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm bg-gray-50 p-2 rounded gap-2">
                                          <div className="flex flex-col md:flex-row gap-1 md:gap-4">
                                              <span className="font-mono text-gray-500">{new Date(rec.date).toLocaleDateString()}</span>
                                              <span className="font-medium text-gray-800">{rec.description}</span>
                                              <span className="text-gray-500 text-xs flex items-center">({rec.provider})</span>
                                          </div>
                                          <div className="flex items-center gap-2 self-end md:self-auto">
                                              <span className="font-bold text-red-600">- R$ {rec.cost.toFixed(2)}</span>
                                              {rec.financeTransactionId && (
                                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded flex items-center gap-1" title="Lançado no Financeiro">
                                                      <DollarSign size={10} /> Contabilizado
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                      {assets.filter(a => a.maintenanceHistory && a.maintenanceHistory.length > 0).length === 0 && (
                           <p className="text-center text-gray-400 py-8">Nenhum histórico de manutenção registrado.</p>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* --- ASSET MODAL --- */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-bold text-lg text-navy-900">{selectedAsset ? 'Editar Bem' : 'Novo Patrimônio'}</h3>
                <button onClick={() => setShowAssetModal(false)}><X className="text-gray-400" /></button>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-center mb-4">
                     <div className="w-full h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                         {assetForm.photoUrl ? (
                             <img src={assetForm.photoUrl} className="w-full h-full object-cover" />
                         ) : (
                             <Package className="text-gray-300" size={48} />
                         )}
                         <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                             {uploadingPhoto ? <Loader2 className="animate-spin"/> : <div className="flex flex-col items-center"><Camera size={24}/><span>Alterar Foto</span></div>}
                             <input type="file" className="hidden" accept="image/*" onChange={handleAssetPhotoUpload} />
                         </label>
                     </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Item</label>
                    <input className={inputClass} value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} placeholder="Ex: Projetor Epson X24" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoria</label>
                        <select className={inputClass} value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value as any})}>
                            <option value="Móveis">Móveis</option>
                            <option value="Som">Som</option>
                            <option value="Instrumentos">Instrumentos</option>
                            <option value="Eletrônicos">Eletrônicos</option>
                            <option value="Literatura">Literatura (Livros)</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                        <input type="number" min="1" className={inputClass} value={assetForm.quantity} onChange={e => setAssetForm({...assetForm, quantity: Math.max(1, parseInt(e.target.value))})} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor Unitário (R$)</label>
                        <input type="number" step="0.01" className={inputClass} value={assetForm.value} onChange={e => setAssetForm({...assetForm, value: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Estimado</label>
                        <div className="w-full border border-gray-200 bg-gray-50 p-2 rounded-lg text-gray-900 font-bold flex items-center justify-between">
                            R$ {((assetForm.quantity || 0) * (assetForm.value || 0)).toFixed(2)}
                            <Calculator size={14} className="text-gray-400"/>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Aquisição</label>
                        <input type="date" className={inputClass} value={assetForm.acquisitionDate} onChange={e => setAssetForm({...assetForm, acquisitionDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Condição</label>
                        <select className={inputClass} value={assetForm.condition} onChange={e => setAssetForm({...assetForm, condition: e.target.value as any})}>
                            <option value="Novo">Novo</option>
                            <option value="Bom">Bom</option>
                            <option value="Regular">Regular</option>
                            <option value="Ruim">Ruim</option>
                            <option value="Em Manutenção">Em Manutenção</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Localização (Sala/Armário)</label>
                    <input className={inputClass} value={assetForm.location} onChange={e => setAssetForm({...assetForm, location: e.target.value})} placeholder="Ex: Sala 1, Armário B" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAssetModal(false)}>Cancelar</Button>
                    <Button onClick={handleSaveAsset} disabled={submitting}>Salvar</Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- LOAN MODAL --- */}
      {showLoanModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-sm p-6">
                 <h3 className="font-bold text-lg mb-4">Novo Empréstimo</h3>
                 <p className="text-gray-600 mb-4 text-sm">Item: <strong>{selectedAsset?.name}</strong></p>
                 
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium mb-1">Membro</label>
                         <select className={inputClass} value={loanForm.memberId} onChange={e => setLoanForm({...loanForm, memberId: e.target.value})}>
                             <option value="">Selecione...</option>
                             {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1">Duração (Dias)</label>
                         <input type="number" className={inputClass} value={loanForm.days} onChange={e => setLoanForm({...loanForm, days: Number(e.target.value)})} />
                     </div>
                 </div>

                 <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowLoanModal(false)}>Cancelar</Button>
                    <Button onClick={handleSaveLoan} disabled={submitting || !loanForm.memberId}>Confirmar</Button>
                </div>
              </div>
          </div>
      )}

      {/* --- MAINTENANCE MODAL --- */}
      {showMaintModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-md p-6">
                 <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Wrench size={20}/> Registrar Manutenção</h3>
                 <p className="text-gray-600 mb-4 text-sm">Item: <strong>{selectedAsset?.name}</strong></p>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium mb-1">Descrição do Serviço</label>
                         <input className={inputClass} value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})} placeholder="Ex: Troca de válvula, Limpeza..." />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium mb-1">Custo (R$)</label>
                             <input type="number" className={inputClass} value={maintForm.cost} onChange={e => setMaintForm({...maintForm, cost: Number(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1">Prestador</label>
                             <input className={inputClass} value={maintForm.provider} onChange={e => setMaintForm({...maintForm, provider: e.target.value})} placeholder="Ex: TecnicaFrio" />
                         </div>
                     </div>

                     {/* FINANCE INTEGRATION */}
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
                         <label className="flex items-center gap-2 cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={maintForm.launchFinance} 
                               onChange={e => setMaintForm({...maintForm, launchFinance: e.target.checked})} 
                               className="w-4 h-4 text-navy-900 rounded"
                             />
                             <span className="font-bold text-navy-900 text-sm">Lançar Despesa no Financeiro?</span>
                         </label>
                         
                         {maintForm.launchFinance && (
                             <div className="mt-3 animate-in fade-in">
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conta de Saída</label>
                                 <select 
                                    className={`text-sm ${inputClass}`}
                                    value={maintForm.financeAccount}
                                    onChange={e => setMaintForm({...maintForm, financeAccount: e.target.value})}
                                 >
                                      <option value="Banco do Brasil">Banco do Brasil</option>
                                      <option value="Caixa Econômica">Caixa Econômica</option>
                                      <option value="Tesouraria (Espécie)">Tesouraria (Espécie)</option>
                                 </select>
                                 <p className="text-xs text-blue-600 mt-2">Uma transação de saída será criada automaticamente.</p>
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowMaintModal(false)}>Cancelar</Button>
                    <Button onClick={handleSaveMaintenance} disabled={submitting}>Salvar Registro</Button>
                </div>
              </div>
          </div>
      )}

    </div>
  );
};