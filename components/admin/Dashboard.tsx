import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, DollarSign, CalendarCheck, Database, Wifi, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Member, Transaction, ChurchEvent } from '../../types';
import { seedDatabase, getCollection } from '../../services/firestore';
import { Button } from '../ui/Button';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

export const AdminDashboard: React.FC = () => {
  const [seeding, setSeeding] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { status: connectionStatus, message: statusMessage, retry: checkConnection } = useConnectionStatus();

  // Real Data State
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    balance: 0,
    income: 0,
    expenses: 0
  });
  const [nextEvent, setNextEvent] = useState<ChurchEvent | null>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<any[]>([]);

  const COLORS = ['#003366', '#C5A059', '#004080', '#A6823C', '#666666', '#ef4444'];

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Collections Parallelly
      const [membersData, financeData, eventsData] = await Promise.all([
        getCollection<Member>('members'),
        getCollection<Transaction>('financial'),
        getCollection<ChurchEvent>('events')
      ]);

      // --- Process Members Stats ---
      const total = membersData.length;
      const active = membersData.filter(m => m.status === 'Ativo').length;

      // --- Process Financial Stats ---
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryMap: Record<string, number> = {};
      
      // Helper for monthly grouping
      const monthlyMap: Record<string, { income: number, expense: number }> = {};
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      // Initialize last 6 months keys
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${monthNames[d.getMonth()]}`;
        monthlyMap[key] = { income: 0, expense: 0 };
      }

      financeData.forEach(t => {
        const val = Number(t.amount);
        const tDate = new Date(t.date);
        const monthKey = monthNames[tDate.getMonth()];

        if (t.type === 'Entrada') {
          totalIncome += val;
          // Pie Chart Logic
          categoryMap[t.category] = (categoryMap[t.category] || 0) + val;
        } else {
          totalExpense += val;
        }

        // Bar Chart Logic (Only if key exists in our last 6 months map)
        if (monthlyMap[monthKey]) {
          if (t.type === 'Entrada') monthlyMap[monthKey].income += val;
          else monthlyMap[monthKey].expense += val;
        }
      });

      // Format Chart Data
      const formattedMonthlyData = Object.keys(monthlyMap).map(key => ({
        name: key,
        receitas: monthlyMap[key].income,
        despesas: monthlyMap[key].expense
      }));

      const formattedCategoryData = Object.keys(categoryMap).map(key => ({
        name: key,
        value: categoryMap[key]
      }));

      // --- Process Next Event ---
      const futureEvents = eventsData
        .filter(e => new Date(e.start) >= new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      setNextEvent(futureEvents.length > 0 ? futureEvents[0] : null);

      // --- Update State ---
      setStats({
        totalMembers: total,
        activeMembers: active,
        income: totalIncome,
        expenses: totalExpense,
        balance: totalIncome - totalExpense
      });
      setMonthlyChartData(formattedMonthlyData);
      setCategoryChartData(formattedCategoryData);

    } catch (error) {
      console.error("Erro ao processar dashboard", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSeed = async () => {
    if(connectionStatus === 'error') {
      alert("Não é possível enviar dados: Sem conexão ou permissão negada.");
      return;
    }
    if(confirm("Isso adicionará dados de exemplo ao seu Firebase. Continuar?")) {
        setSeeding(true);
        await seedDatabase();
        await fetchRealData(); // Refresh after seed
        setSeeding(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      {connectionStatus === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
           <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
           <div>
              <h4 className="font-bold text-red-800">Erro de Conexão ou Permissão</h4>
              <p className="text-sm text-red-700 mt-1">{statusMessage}</p>
              <button 
                onClick={checkConnection} 
                className="mt-2 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Tentar Novamente
              </button>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-navy-900">Visão Geral</h1>
          <p className="text-gray-500 text-sm">Bem-vindo ao painel da secretaria.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-2 md:mt-0">
             {/* Status Badge */}
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                connectionStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-200' :
                connectionStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
             }`}>
                {connectionStatus === 'checking' && <Wifi className="animate-pulse" size={14}/>}
                {connectionStatus === 'connected' && <CheckCircle2 size={14}/>}
                {connectionStatus === 'error' && <XCircle size={14}/>}
                <span>
                  {connectionStatus === 'checking' ? 'Verificando...' : 
                   connectionStatus === 'connected' ? 'Online' : 
                   'Offline'}
                </span>
             </div>
             
             <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding || connectionStatus === 'error'}>
                {seeding ? <Database className="animate-pulse mr-2" size={14}/> : <Database size={14} className="mr-2"/>}
                {seeding ? "Enviando..." : "Popular Dados"}
             </Button>
            
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium capitalize">
              {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
        </div>
      </div>

      {loadingData ? (
        <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-navy-900" size={48} />
        </div>
      ) : (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-navy-900 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total de Membros</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.totalMembers}</h3>
                    <p className="text-xs text-green-600 mt-1">{stats.activeMembers} Ativos</p>
                    </div>
                    <div className="p-3 bg-navy-50 rounded-lg text-navy-900">
                    <Users size={24} />
                    </div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gold-500 animate-fade-in-up delay-100">
                <div className="flex justify-between items-center">
                    <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Saldo em Caixa</p>
                    <h3 className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                        {formatCurrency(stats.balance)}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Entradas - Saídas (Geral)</p>
                    </div>
                    <div className="p-3 bg-gold-50 rounded-lg text-gold-600">
                    <DollarSign size={24} />
                    </div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-400 animate-fade-in-up delay-200">
                <div className="flex justify-between items-center">
                    <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Próximo Evento</p>
                    {nextEvent ? (
                        <>
                            <h3 className="text-lg font-bold text-gray-800 truncate max-w-[150px]" title={nextEvent.title}>{nextEvent.title}</h3>
                            <p className="text-xs text-blue-600 mt-1">
                                {new Date(nextEvent.start).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} • {new Date(nextEvent.start).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-gray-400">Sem agendamentos</h3>
                            <p className="text-xs text-gray-400 mt-1">Verifique a Agenda</p>
                        </>
                    )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
                    <CalendarCheck size={24} />
                    </div>
                </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-heading font-bold text-lg text-gray-800 mb-4">Fluxo de Caixa (6 Meses)</h3>
                <div className="h-64 w-full min-w-0">
                    {monthlyChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                            <Tooltip 
                                formatter={(value) => formatCurrency(Number(value))}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="receitas" fill="#003366" name="Entradas" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="despesas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados financeiros recentes</div>
                    )}
                </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-heading font-bold text-lg text-gray-800 mb-4">Entradas por Categoria</h3>
                <div className="h-64 w-full flex items-center justify-center min-w-0">
                    {categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                            {categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend verticalAlign="middle" align="right" layout="vertical" />
                        </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sem dados de entradas</div>
                    )}
                </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};