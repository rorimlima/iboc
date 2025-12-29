import React, { useState, useEffect } from 'react';
import { Transaction, Member, BankAccount } from '../../types';
import { Button } from '../ui/Button';
import { PlusCircle, MinusCircle, Loader2, Upload, FileText, Paperclip, Wallet, Landmark, Trash2, Edit2, X, FileDown, CheckCircle2, Calendar, Search, CreditCard, QrCode } from 'lucide-react';
import { getCollection, addDocument, uploadImage, updateDocument, deleteDocument } from '../../services/firestore';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const AdminFinance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const getLocalDate = () => new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(getLocalDate());
  const [useDateFilter, setUseDateFilter] = useState(false);

  const [reportStartDate, setReportStartDate] = useState(getLocalDate().slice(0, 8) + '01');
  const [reportEndDate, setReportEndDate] = useState(getLocalDate());

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

  const initialTransactionForm: Omit<Transaction, 'id'> = {
      type: 'Entrada',
      category: 'Dízimo',
      amount: 0,
      date: getLocalDate(),
      description: '',
      contributorName: '',
      paymentMethod: 'Pix',
      bankAccount: '', 
      attachmentUrl: '',
      closingStatus: 'Aberto',
      isReconciled: false
  };
  const [formData, setFormData] = useState(initialTransactionForm);

  const initialAccountForm: Omit<BankAccount, 'id'> = {
      name: '',
      type: 'Banco',
      bankName: '',
      agency: '',
      accountNumber: '',
      pixKey: '',
      pixHolder: '',
      initialBalance: 0,
      description: ''
  };
  const [accountFormData, setAccountFormData] = useState(initialAccountForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [financeData, membersData, accountsData] = await Promise.all([
            getCollection<Transaction>('financial'),
            getCollection<Member>('members'),
            getCollection<BankAccount>('accounts')
        ]);
        financeData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        membersData.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setTransactions(financeData);
        setMembers(membersData);
        setAccounts(accountsData);
    } catch (error) {
        console.error("Erro ao carregar dados", error);
    } finally {
        setLoading(false);
    }
  };

  const consolidatedBalance = transactions
      .filter(t => t.isReconciled)
      .reduce((acc, t) => acc + (t.type === 'Entrada' ? Number(t.amount) : -Number(t.amount)), 0);

  const treasuryInflow = transactions
      .filter(t => t.type === 'Entrada' && t.paymentMethod === 'Dinheiro')
      .reduce((acc, t) => acc + Number(t.amount), 0);

  const bankInflow = transactions
      .filter(t => t.type === 'Entrada' && t.paymentMethod !== 'Dinheiro')
      .reduce((acc, t) => acc + Number(t.amount), 0);

  const handleOpenModal = (type: 'Entrada' | 'Saída') => {
      if (accounts.length === 0) return alert("Cadastre uma conta primeiro.");
      setModalType(type);
      setEditingId(null);
      const defaultAccount = accounts[0]?.name || '';
      const isTreasury = accounts.find(a => a.name === defaultAccount)?.type === 'Tesouraria';

      setFormData({ 
          ...initialTransactionForm, 
          type, 
          category: type === 'Entrada' ? 'Dízimo' : 'Manutenção',
          bankAccount: defaultAccount,
          paymentMethod: isTreasury ? 'Dinheiro' : 'Pix',
      });
      setShowModal(true);
  };

  const handleEditTransaction = (t: Transaction) => {
      setEditingId(t.id);
      setModalType(t.type);
      setFormData({ ...t, contributorName: t.contributorName || '', attachmentUrl: t.attachmentUrl || '' });
      setShowModal(true);
  };

  const handleDeleteTransaction = async (id: string) => {
      if(!confirm("Confirmar exclusão?")) return;
      await deleteDocument('financial', id);
      setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description || formData.amount <= 0) return alert("Preencha os campos obrigatórios.");
      setSubmitting(true);
      const payload = { ...formData, amount: Number(formData.amount) };
      try {
          if (editingId) {
              await updateDocument('financial', editingId, payload);
              setTransactions(prev => prev.map(t => t.id === editingId ? { ...payload, id: editingId } : t));
          } else {
              const newTrans = await addDocument('financial', payload);
              setTransactions([newTrans as Transaction, ...transactions]);
          }
          setShowModal(false);
      } catch(e) { alert("Erro ao salvar."); } finally { setSubmitting(false); }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!accountFormData.name) return alert("Nome obrigatório");
      setAccountSubmitting(true);
      try {
          if(editingAccount) {
              await updateDocument('accounts', editingAccount.id, accountFormData);
              setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...accountFormData, id: editingAccount.id } : a));
          } else {
              const newAcc = await addDocument('accounts', accountFormData);
              setAccounts(prev => [...prev, newAcc as BankAccount]);
          }
          setShowAccountModal(false);
      } catch(e) { alert("Erro ao salvar conta"); } finally { setAccountSubmitting(false); }
  };

  const toggleReconciliation = async (t: Transaction) => {
      const newStatus = !t.isReconciled;
      setTransactions(prev => prev.map(tr => tr.id === t.id ? { ...tr, isReconciled: newStatus } : tr));
      await updateDocument('financial', t.id, { isReconciled: newStatus });
  };

  const generateConferidosReport = () => {
      const filtered = transactions.filter(t => t.isReconciled && t.date >= reportStartDate && t.date <= reportEndDate);
      if (filtered.length === 0) return alert("Nenhum lançamento conferido encontrado.");
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const doc = new jsPDF();
      doc.setFillColor(10, 24, 39);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Relatório de Conferência", 105, 15, { align: 'center' });
      const totalIncome = filtered.filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = filtered.filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.amount, 0);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
          startY: 70,
          head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Conta']],
          body: filtered.map(t => [new Date(t.date).toLocaleDateString('pt-BR'), t.type, t.category, t.description, t.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}), t.bankAccount]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [10, 24, 39] }
      });
      doc.save(`Conferidos_${reportStartDate}_${reportEndDate}.pdf`);
  };

  const filteredTransactions = useDateFilter ? transactions.filter(t => t.date === filterDate) : transactions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-heading font-bold text-navy-900">Gestão Financeira</h1><p className="text-gray-500 text-sm">Controle de caixa e bancos.</p></div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setAccountFormData(initialAccountForm); setEditingAccount(null); setShowAccountModal(true); }}><Landmark size={16} className="mr-2" /> Contas</Button>
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal('Entrada')}><PlusCircle size={16} className="mr-2" /> Entrada</Button>
          <Button variant="danger" size="sm" onClick={() => handleOpenModal('Saída')}><MinusCircle size={16} className="mr-2" /> Saída</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-navy-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group"><div className="relative z-10"><p className="text-xs uppercase tracking-wider text-gold-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Saldo Consolidado</p><h2 className="text-3xl font-heading font-bold">R$ {consolidatedBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2></div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-600 relative overflow-hidden"><div className="relative z-10"><p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Tesouraria (Caixa)</p><h3 className="text-2xl font-bold text-green-700">R$ {treasuryInflow.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3></div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 relative overflow-hidden"><div className="relative z-10"><p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Banco (Digital)</p><h3 className="text-2xl font-bold text-blue-700">R$ {bankInflow.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3></div></div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
          <div className="flex flex-col gap-1 w-full lg:w-auto"><label className="text-xs font-bold text-gray-500 uppercase">Filtrar Tabela por Data</label><div className="flex items-center gap-2"><input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setUseDateFilter(true); }} className={inputClass + " w-auto p-1.5 text-sm"} />{useDateFilter && <button onClick={() => setUseDateFilter(false)} className="text-red-500 hover:text-red-700 text-sm font-medium underline">Limpar</button>}</div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200"><tr><th className="px-6 py-3">Conferência</th><th className="px-6 py-3">Data</th><th className="px-6 py-3">Descrição</th><th className="px-6 py-3 text-right">Valor</th><th className="px-6 py-3 text-center">Ações</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredTransactions.map(t => (<tr key={t.id} className="hover:bg-gray-50 group"><td className="px-6 py-3"><button onClick={() => toggleReconciliation(t)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${t.isReconciled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{t.isReconciled ? 'Conferido' : 'Aberto'}</button></td><td className="px-6 py-3 text-gray-900">{new Date(t.date).toLocaleDateString('pt-BR')}</td><td className="px-6 py-3 text-gray-900 font-medium">{t.description}</td><td className={`px-6 py-3 text-right font-bold ${t.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toFixed(2)}</td><td className="px-6 py-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditTransaction(t)} className="text-gray-400 hover:text-navy-900"><Edit2 size={16}/></button><button onClick={() => handleDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>

      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-lg p-6">
                  <h3 className="font-heading font-bold text-lg mb-4 text-navy-900">{editingId ? 'Editar' : `Nova ${modalType}`}</h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Descrição</label><input className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label><input type="number" step="0.01" className={inputClass} value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input type="date" className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                      </div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Conta</label><select className={inputClass} value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})}>{accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
                      <div className="flex justify-end gap-2 mt-4"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button><Button type="submit" disabled={submitting}>Salvar</Button></div>
                  </form>
              </div>
          </div>
      )}

      {showAccountModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-lg p-6">
                  <h3 className="font-heading font-bold text-lg mb-4 text-navy-900">Gerenciar Conta</h3>
                  <form onSubmit={handleSaveAccount} className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Nome Conta</label><input className={inputClass} value={accountFormData.name} onChange={e => setAccountFormData({...accountFormData, name: e.target.value})} /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Saldo Inicial</label><input type="number" step="0.01" className={inputClass} value={accountFormData.initialBalance} onChange={e => setAccountFormData({...accountFormData, initialBalance: parseFloat(e.target.value)})} /></div>
                      <div className="flex justify-end gap-2 mt-4"><Button variant="outline" type="button" onClick={() => setShowAccountModal(false)}>Fechar</Button><Button type="submit" disabled={accountSubmitting}>Salvar</Button></div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};