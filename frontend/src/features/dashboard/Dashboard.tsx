import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Plus } from 'lucide-react';
import { TransactionList } from '@/features/transactions/TransactionList';
import { AddTransactionModal } from '@/features/transactions/AddTransactionModal';

// Datos mock para el gráfico
const data = [
  { name: "1 May", balance: 4000, income: 2400, expense: 1400 },
  { name: "8 May", balance: 3000, income: 1398, expense: 2210 },
  { name: "15 May", balance: 2000, income: 9800, expense: 2290 },
  { name: "22 May", balance: 2780, income: 3908, expense: 2000 },
  { name: "29 May", balance: 1890, income: 4800, expense: 2181 },
  { name: "31 May", balance: 2390, income: 3800, expense: 2500 },
];

type MetricCardProps = {
  title: string;
  amount: string;
  trend: string;
  type: "positive" | "negative" | "neutral";
  icon: React.ElementType;
};

// Tarjeta reutilizable
const MetricCard = ({
  title,
  amount,
  trend,
  type,
  icon: Icon,
}: MetricCardProps) => (
  <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl flex flex-col gap-4">
    <div className="flex justify-between items-center text-zinc-400">
      <span className="text-sm font-medium">{title}</span>
      <Icon className="w-5 h-5" />
    </div>

    <div>
      <h3 className="text-3xl font-semibold tracking-tight text-white">
        ${amount}
      </h3>

      <div
        className={`flex items-center gap-1 mt-2 text-sm ${
          type === "positive"
            ? "text-emerald-500"
            : type === "negative"
            ? "text-red-500"
            : "text-zinc-500"
        }`}
      >
        {type === "positive" ? (
          <ArrowUpRight className="w-4 h-4" />
        ) : type === "negative" ? (
          <ArrowDownRight className="w-4 h-4" />
        ) : null}

        <span>{trend} vs mes anterior</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 relative">
      
      {/* Header con Título y Botón */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Resumen Financiero</h1>
          <p className="text-zinc-400 mt-1">Aquí tienes el estado de tus cuentas al día de hoy.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Movimiento
        </button>
      </header>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Balance Total" amount="12,450.00" trend="+2.5%" type="positive" icon={Wallet} />
        <MetricCard title="Ingresos (Mes)" amount="4,800.00" trend="+12%" type="positive" icon={ArrowUpRight} />
        <MetricCard title="Gastos (Mes)" amount="2,150.00" trend="-4.2%" type="negative" icon={ArrowDownRight} />
        <MetricCard title="Ahorros" amount="8,350.00" trend="En objetivo" type="neutral" icon={DollarSign} />
      </div>

      {/* Gráfico Principal */}
      <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-white mb-6">Evolución del Balance</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#e4e4e7' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Movimientos */}
      <TransactionList />

      {/* Renderizado del Modal Flotante */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
    </div>
  );
};

export default Dashboard;