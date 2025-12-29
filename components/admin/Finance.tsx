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
  
  // Transaction Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Accounts Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Filter Date State (Visualização na Tabela)
  const getLocalDate = () => new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(getLocalDate());
  const [useDateFilter, setUseDateFilter] = useState(false);

  // Report Date Range State (Exportação)
  const [reportStartDate, setReportStartDate] = useState(getLocalDate().slice(0, 8) + '01'); // 1st of month
  const [reportEndDate, setReportEndDate] = useState(getLocalDate());

  // Form States
  const inputClass = "w-full border border-gray-300 p-2 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-navy-900 focus:outline-none placeholder-gray-400";

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

  // Load Data
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

        // Sort by Date Descending
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

  // --- CALCULATION LOGIC FOR CARDS ---

  // 1. Saldo Consolidado: Soma de todos os valores gerados que tenham o status de conferencia ok
  const consolidatedBalance = transactions
      .filter(t => t.isReconciled)
      .reduce((acc, t) => acc + (t.type === 'Entrada' ? Number(t.amount) : -Number(t.amount)), 0);

  // 2. Tesouraria (Caixa): Soma todas a entradas em dinheiro
  const treasuryInflow = transactions
      .filter(t => t.type === 'Entrada' && t.paymentMethod === 'Dinheiro')
      .reduce((acc, t) => acc + Number(t.amount), 0);

  // 3. Banco: Soma as entradas em Pix, Transferencia, Cartao de Credito, Debito, Cheque (tudo que não é Dinheiro)
  const bankInflow = transactions
      .filter(t => t.type === 'Entrada' && t.paymentMethod !== 'Dinheiro')
      .reduce((acc, t) => acc + Number(t.amount), 0);


  // --- Transaction Logic ---
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
      } catch(e) {
          alert("Erro ao salvar.");
      } finally {
          setSubmitting(false);
      }
  };

  // --- Account Logic ---
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
      } catch(e) { alert("Erro ao salvar conta"); } 
      finally { setAccountSubmitting(false); }
  };

  // --- New Simplified Conferência Logic ---
  const toggleReconciliation = async (t: Transaction) => {
      const newStatus = !t.isReconciled;
      // Optimistic update
      setTransactions(prev => prev.map(tr => tr.id === t.id ? { ...tr, isReconciled: newStatus } : tr));
      // Save to DB
      await updateDocument('financial', t.id, { isReconciled: newStatus });
  };

  // --- Export Report Logic ---
  const generateConferidosReport = () => {
      // 1. Filtrar transações: Conferidas (isReconciled=true) E dentro do prazo
      const filtered = transactions.filter(t => {
          return t.isReconciled && t.date >= reportStartDate && t.date <= reportEndDate;
      });

      if (filtered.length === 0) {
          alert("Nenhum lançamento conferido encontrado neste período.");
          return;
      }

      // 2. Ordenar por data
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 3. Gerar PDF
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFillColor(10, 24, 39); // Navy 900
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Relatório de Conferência", 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Período: ${new Date(reportStartDate).toLocaleDateString('pt-BR')} a ${new Date(reportEndDate).toLocaleDateString('pt-BR')}`, 105, 25, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 32, { align: 'center' });

      // Totais
      const totalIncome = filtered.filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = filtered.filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.amount, 0);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Total Entradas Conferidas: R$ ${totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 50);
      doc.text(`Total Saídas Conferidas: R$ ${totalExpense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 56);
      doc.text(`Saldo do Período Conferido: R$ ${(totalIncome - totalExpense).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 62);

      // Tabela
      autoTable(doc, {
          startY: 70,
          head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Conta']],
          body: filtered.map(t => [
              new Date(t.date).toLocaleDateString('pt-BR'),
              t.type,
              t.category,
              t.description,
              t.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
              t.bankAccount
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [10, 24, 39] },
          columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
          didParseCell: function(data) {
              if (data.section === 'body' && data.column.index === 4) {
                  const row = data.row.raw as any[];
                  if (row[1] === 'Saída') {
                      data.cell.styles.textColor = [200, 0, 0];
                  } else {
                      data.cell.styles.textColor = [0, 128, 0];
                  }
              }
          }
      });

      doc.save(`Conferidos_${reportStartDate}_${reportEndDate}.pdf`);
  };

  // --- Filtering Logic (Visualização) ---
  const filteredTransactions = useDateFilter
    ? transactions.filter(t => t.date === filterDate)
    : transactions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-heading font-bold text-navy-900">Gestão Financeira</h1>
            <p className="text-gray-500 text-sm">Controle de caixa e bancos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setAccountFormData(initialAccountForm); setEditingAccount(null); setShowAccountModal(true); }}>
              <Landmark size={16} className="mr-2" /> Contas
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleOpenModal('Entrada')}>
            <PlusCircle size={16} className="mr-2" /> Entrada
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleOpenModal('Saída')}>
            <MinusCircle size={16} className="mr-2" /> Saída
          </Button>
        </div>
      </div>

      {/* Top Cards (Updated Logic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Saldo Consolidado (Reconciled Only) */}
          <div className="bg-navy-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                  <p className="text-xs uppercase tracking-wider text-gold-500 mb-1 flex items-center gap-1">
                      <CheckCircle2 size={12}/> Saldo Consolidado (Conferido)
                  </p>
                  <h2 className={`text-3xl font-heading font-bold ${consolidatedBalance < 0 ? 'text-red-400' : 'text-white'}`}>
                      R$ {consolidatedBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </h2>
                  <p className="text-[10px] text-gray-400 mt-1">Apenas transações com status OK</p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
                  <Landmark size={100} />
              </div>
          </div>

          {/* 2. Tesouraria (Cash Inflow Only) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-600 relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Tesouraria (Caixa)</p>
                  <h3 className="text-2xl font-bold text-green-700">
                      R$ {treasuryInflow.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <PlusCircle size={10}/> Total Entradas em Dinheiro
                  </p>
              </div>
              <div className="absolute right-4 top-4 text-green-100">
                  <Wallet size={32}/>
              </div>
          </div>

          {/* 3. Banco (Digital/Other Inflow Only) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Banco (Digital)</p>
                  <h3 className="text-2xl font-bold text-blue-700">
                      R$ {bankInflow.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <PlusCircle size={10}/> Pix, Transf., Cartão, Cheque
                  </p>
              </div>
              <div className="absolute right-4 top-4 text-blue-100">
                  <CreditCard size={32}/>
              </div>
          </div>
      </div>

      {/* Tools Section: Filter & Export */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
          
          {/* Left: Table Filter */}
          <div className="flex flex-col gap-1 w-full lg:w-auto">
              <label className="text-xs font-bold text-gray-500 uppercase">Filtrar Tabela por Data</label>
              <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => { setFilterDate(e.target.value); setUseDateFilter(true); }}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900"
                  />
                  {useDateFilter ? (
                      <button onClick={() => setUseDateFilter(false)} className="text-red-500 hover:text-red-700 text-sm font-medium underline">Limpar Filtro</button>
                  ) : (
                      <span className="text-xs text-gray-400 italic">Mostrando tudo</span>
                  )}
              </div>
          </div>

          {/* Right: Export Report */}
          <div className="flex flex-col gap-1 w-full lg:w-auto border-l lg:pl-6 border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <CheckCircle2 size={12}/> Exportar Itens Conferidos
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">De:</span>
                      <input 
                        type="date" 
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900 w-32"
                      />
                  </div>
                  <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Até:</span>
                      <input 
                        type="date" 
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900 w-32"
                      />
                  </div>
                  <Button onClick={generateConferidosReport} size="sm" variant="outline" className="border-navy-900 text-navy-900 hover:bg-navy-50">
                      <FileDown size={16} className="mr-2"/> Relatório PDF
                  </Button>
              </div>
          </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                          <th className="px-6 py-3">Conferência</th>
                          <th className="px-6 py-3">Data</th>
                          <th className="px-6 py-3">Descrição</th>
                          <th className="px-6 py-3">Categoria</th>
                          <th className="px-6 py-3">Conta / Forma</th>
                          <th className="px-6 py-3 text-right">Valor</th>
                          <th className="px-6 py-3 text-center">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredTransactions.map(t => (
                          <tr key={t.id} className="hover:bg-gray-50 group">
                              <td className="px-6 py-3">
                                  <button 
                                    onClick={() => toggleReconciliation(t)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${
                                        t.isReconciled 
                                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                    }`}
                                  >
                                      <CheckCircle2 size={14} className={t.isReconciled ? "fill-current" : ""} />
                                      {t.isReconciled ? 'Conferido' : 'Aberto'}
                                  </button>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                                  {new Date(t.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-3 font-medium text-gray-800">
                                  {t.description}
                                  {t.contributorName && <span className="block text-xs text-gray-400 font-normal">{t.contributorName}</span>}
                              </td>
                              <td className="px-6 py-3 text-gray-500">{t.category}</td>
                              <td className="px-6 py-3 text-gray-500">
                                  <div className="font-medium text-xs">{t.bankAccount}</div>
                                  <div className="text-[10px] text-gray-400 uppercase">{t.paymentMethod}</div>
                              </td>
                              <td className={`px-6 py-3 text-right font-bold ${t.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                  {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditTransaction(t)} className="text-gray-400 hover:text-navy-900"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                          <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum lançamento encontrado.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* --- ADD/EDIT TRANSACTION MODAL --- */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-lg p-6">
                  <h3 className="font-heading font-bold text-lg mb-4 text-navy-900">{editingId ? 'Editar' : `Nova ${modalType}`}</h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                          <input className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
                              <input type="number" step="0.01" className={inputClass} value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                              <input type="date" className={inputClass} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Conta Destino/Origem</label>
                              <select className={inputClass} value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})}>
                                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Forma de Pagamento</label>
                              <select className={inputClass} value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}>
                                  <option value="Dinheiro">Dinheiro</option>
                                  <option value="Pix">Pix</option>
                                  <option value="Transferência">Transferência</option>
                                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                                  <option value="Débito">Débito</option>
                                  <option value="Cheque">Cheque</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
                          <select className={inputClass} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                              {modalType === 'Entrada' ? (
                                  ['Dízimo', 'Oferta', 'Missões', 'Cantina', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)
                              ) : (
                                  ['Manutenção', 'Energia', 'Água', 'Pessoal', 'Material', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)
                              )}
                          </select>
                      </div>
                      {modalType === 'Entrada' && (
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">Membro / Contribuinte</label>
                              {formData.category === 'Dízimo' ? (
                                  <select 
                                      className={inputClass} 
                                      value={formData.contributorName} 
                                      onChange={e => setFormData({...formData, contributorName: e.target.value})}
                                  >
                                      <option value="">Selecione um Membro...</option>
                                      {members.map(m => (
                                          <option key={m.id} value={m.fullName}>{m.fullName}</option>
                                      ))}
                                  </select>
                              ) : (
                                  <input 
                                      className={inputClass} 
                                      value={formData.contributorName} 
                                      onChange={e => setFormData({...formData, contributorName: e.target.value})} 
                                      placeholder="Nome (Opcional)" 
                                  />
                              )}
                          </div>
                      )}
                      <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
                          <Button type="submit" disabled={submitting}>Salvar</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- ACCOUNTS MODAL --- */}
      {showAccountModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-[95%] md:w-full max-w-lg p-6">
                  <h3 className="font-heading font-bold text-lg mb-4 text-navy-900">Gerenciar Conta</h3>
                  <form onSubmit={handleSaveAccount} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Apelido da Conta</label>
                          <input className={inputClass} value={accountFormData.name} onChange={e => setAccountFormData({...accountFormData, name: e.target.value})} placeholder="Ex: Conta Principal" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                          <select className={inputClass} value={accountFormData.type} onChange={e => setAccountFormData({...accountFormData, type: e.target.value as any})}>
                              <option value="Banco">Banco</option>
                              <option value="Tesouraria">Tesouraria (Caixa Físico)</option>
                          </select>
                      </div>

                      {/* Banking Details (Only if Banco) */}
                      {accountFormData.type === 'Banco' && (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Nome do Banco</label>
                                  <input 
                                    className={inputClass} 
                                    value={accountFormData.bankName || ''} 
                                    onChange={e => setAccountFormData({...accountFormData, bankName: e.target.value})} 
                                    placeholder="Ex: Banco do Brasil" 
                                  />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Agência</label>
                                      <input 
                                        className={inputClass} 
                                        value={accountFormData.agency || ''} 
                                        onChange={e => setAccountFormData({...accountFormData, agency: e.target.value})} 
                                        placeholder="0000-X" 
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Conta</label>
                                      <input 
                                        className={inputClass} 
                                        value={accountFormData.accountNumber || ''} 
                                        onChange={e => setAccountFormData({...accountFormData, accountNumber: e.target.value})} 
                                        placeholder="00000-X" 
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Chave Pix</label>
                                      <div className="relative">
                                          <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                          <input 
                                            className={`${inputClass} pl-10`} 
                                            value={accountFormData.pixKey || ''} 
                                            onChange={e => setAccountFormData({...accountFormData, pixKey: e.target.value})} 
                                            placeholder="CPF/CNPJ/Email" 
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Nome Titular Pix</label>
                                      <input 
                                        className={inputClass} 
                                        value={accountFormData.pixHolder || ''} 
                                        onChange={e => setAccountFormData({...accountFormData, pixHolder: e.target.value})} 
                                        placeholder="Nome completo" 
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Saldo Inicial</label>
                          <input type="number" step="0.01" className={inputClass} value={accountFormData.initialBalance} onChange={e => setAccountFormData({...accountFormData, initialBalance: parseFloat(e.target.value)})} />
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2 mt-2">
                          <p className="text-xs font-bold text-gray-400 uppercase">Lista de Contas Atuais</p>
                          <ul className="text-sm space-y-1">
                              {accounts.map(a => (
                                  <li key={a.id} className="flex justify-between border-b border-gray-200 pb-1 cursor-pointer hover:text-blue-600" onClick={() => { setEditingAccount(a); setAccountFormData(a); }}>
                                      <span>{a.name}</span>
                                      <span className="text-gray-400 text-xs">{a.type}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" type="button" onClick={() => setShowAccountModal(false)}>Fechar</Button>
                          <Button type="submit" disabled={accountSubmitting}>Salvar</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};