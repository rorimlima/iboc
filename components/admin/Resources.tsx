import React, { useState, useEffect } from 'react';
import { Asset, Member, Transaction, MaintenanceRecord } from '../../types';
import { Button } from '../ui/Button';
import { Package, Search, Plus, Loader2, Wrench, BookOpen, Music, Tv, User, Calendar, DollarSign, CheckCircle2, History, AlertTriangle, ArrowRightLeft, Camera, Edit2, X, Calculator, Trash2 } from 'lucide-react';
import { getCollection, addDocument, updateDocument, uploadImage, deleteDocument } from '../../services/firestore';

export const AdminResources: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'loans' | 'maintenance'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

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
  const [assetForm, setAssetForm] = useState<Partial<Asset>>(initialAssetState);

  const [loanForm, setLoanForm] = useState({ memberId: '', days: 7 });

  const [maintForm, setMaintForm] = useState({ 
    description: '', 
    cost: 0, 
    provider: '', 
    launchFinance: false,
    financeAccount: 'Banco do Brasil'
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

  const handleOpenAssetModal = (asset?: Asset) => {
      if (asset) {
          const { id, ...rest } = asset;
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
      setSubmitting(true);
      try {
          const payload = { ...assetForm, value: Number(assetForm.value), quantity: Number(assetForm.quantity) };
          if (selectedAsset) {
              await updateDocument('assets', selectedAsset.id, payload);
              setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, ...payload } : a));
          } else {
              const newAsset = await addDocument('assets', payload);
              setAssets(prev => [...prev, newAsset as Asset]);
          }
          setShowAssetModal(false);
      } catch (e) { alert("Erro ao salvar patrimônio."); } finally { setSubmitting(false); }
  };

  const handleDeleteAsset = async (id: string) => {
      const assetToDelete = assets.find(a => a.id === id);
      if (!assetToDelete) return;
      if (assetToDelete.status === 'Emprestado') {
          if (!window.confirm("Item emprestado. Deseja forçar a exclusão?")) return;
      } else {
          if (!window.confirm(`Excluir "${assetToDelete.name}"?`)) return;
      }
      try {
          await deleteDocument('assets', id);
          setAssets(prev => prev.filter(a => a.id !== id));
      } catch (e) { alert("Erro ao excluir."); }
  };

  const handleAssetPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
        const url = await uploadImage(file, 'assets_photos');
        setAssetForm(prev => ({ ...prev, photoUrl: url }));
    } catch { alert("Erro no upload."); } finally { setUploadingPhoto(false); }
  };

  const filteredAssets = assets.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-heading font-bold text-navy-900">Patrimônio</h1><p className="text-gray-500 text-sm">Controle de bens e recursos.</p></div>
        <Button onClick={() => handleOpenAssetModal()}><Plus size={18} className="mr-2" /> Novo Item</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Buscar patrimônio..." className={inputClass + " pl-10"} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map(asset => (
                  <div key={asset.id} className="border border-gray-100 rounded-xl overflow-hidden flex flex-col group">
                      <div className="h-32 bg-gray-100 relative">
                          {asset.photoUrl ? <img src={asset.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={40}/></div>}
                      </div>
                      <div className="p-4 flex-1">
                          <h3 className="font-bold text-navy-900">{asset.name}</h3>
                          <div className="flex gap-2 mt-4"><button onClick={() => handleOpenAssetModal(asset)} className="p-1.5 bg-gray-50 rounded hover:bg-gray-100 text-gray-600"><Edit2 size={14}/></button><button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100 text-red-600"><Trash2 size={14}/></button></div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {showAssetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6"><h3 className="font-heading font-bold text-lg text-navy-900">{selectedAsset ? 'Editar Bem' : 'Novo Patrimônio'}</h3><button onClick={() => setShowAssetModal(false)}><X className="text-gray-400" /></button></div>
             <div className="space-y-4">
                <div><label className="text-sm font-medium text-gray-700">Nome</label><input className={inputClass} value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-700">Categoria</label><select className={inputClass} value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value as any})}><option value="Móveis">Móveis</option><option value="Eletrônicos">Eletrônicos</option><option value="Som">Som</option><option value="Outros">Outros</option></select></div>
                    <div><label className="text-sm font-medium text-gray-700">Qtd</label><input type="number" className={inputClass} value={assetForm.quantity} onChange={e => setAssetForm({...assetForm, quantity: parseInt(e.target.value)})} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setShowAssetModal(false)}>Cancelar</Button><Button onClick={handleSaveAsset} disabled={submitting}>Salvar</Button></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};