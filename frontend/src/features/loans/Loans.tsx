import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, TrendingDown, Wallet } from 'lucide-react';
import { useLoanData, Loan } from '@/hooks/useLoanData';
import { api } from '@/lib/axios';

interface Account { id: string; name: string; }

function LoanCard({ loan, accounts, onPay }: {
  loan:     Loan;
  accounts: Account[];
  onPay:    (id: string, accountId?: string) => Promise<void>;
}) {
  const [paying,    setPaying]    = useState(false);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [loading,   setLoading]   = useState(false);

  const isCompleted = loan.status === 'PAID' || loan.paidInstallments >= loan.totalInstallments;
  const remaining   = loan.totalInstallments - loan.paidInstallments;

  const handlePay = async () => {
    setLoading(true);
    try { await onPay(loan.id, accountId || undefined); setPaying(false); }
    catch { /* mantener abierto */ }
    finally { setLoading(false); }
  };

  const barColor = isCompleted ? '#10b981'
    : loan.progress > 75 ? '#f59e0b'
    : '#6366f1';

  return (
    <div className={`bg-[#111111] border rounded-2xl p-5 flex flex-col gap-4 transition-all ${
      isCompleted ? 'border-zinc-800/50 opacity-70' : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-semibold text-white">{loan.name}</h3>
            {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </div>
          <span className="text-xs text-zinc-500">
            {loan.loanType === 'PERSONAL' ? 'Préstamo personal' : 'Compra en cuotas'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 mb-0.5">Cuota</p>
          <p className="text-lg font-bold text-white">
            ${loan.installmentAmount.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Progreso */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-500">{loan.paidInstallments} de {loan.totalInstallments} cuotas pagadas</span>
          <span className="font-semibold" style={{ color: barColor }}>{loan.progress}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${loan.progress}%`, backgroundColor: barColor }} />
        </div>
      </div>

      {/* Detalle */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-zinc-500 mb-1">Restante</p>
          <p className="text-sm font-semibold text-white">
            ${loan.remainingAmount.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-zinc-500 mb-1">Cuotas restantes</p>
          <p className="text-sm font-semibold text-white">{remaining}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-zinc-500 mb-1">Total original</p>
          <p className="text-sm font-semibold text-white">
            ${loan.originalAmount.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Acción pagar cuota */}
      {!isCompleted && (
        paying ? (
          <div className="flex gap-2">
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">Sin registrar en cuenta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button onClick={handlePay} disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? '...' : 'Confirmar'}
            </button>
            <button onClick={() => setPaying(false)}
              className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-sm transition-colors">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setPaying(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 transition-all">
            <Wallet className="w-4 h-4" />
            Pagar cuota {loan.paidInstallments + 1}/{loan.totalInstallments}
          </button>
        )
      )}
    </div>
  );
}

export const Loans = () => {
  const { loans, loading } = useLoanData();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { payInstallment } = useLoanData();

  useEffect(() => {
    api.get<Account[]>('/accounts').then(r => setAccounts(r.data)).catch(() => {});
  }, []);

  const active   = loans.filter(l => l.status === 'ACTIVE');
  const paid     = loans.filter(l => l.status !== 'ACTIVE');

  const personal = active.filter(l => l.loanType === 'PERSONAL');
  const purchase = active.filter(l => l.loanType === 'PURCHASE');

  const totalRemaining = active.reduce((s, l) => s + l.remainingAmount, 0);
  const totalMonthly   = active.reduce((s, l) => s + l.installmentAmount, 0);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Préstamos y Cuotas</h1>
        <p className="text-zinc-400 mt-1">Seguí el progreso de tus compromisos financieros.</p>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Compromisos activos</p>
            <p className="text-2xl font-bold text-white">{active.length}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Deuda total restante</p>
            <p className="text-2xl font-bold text-white">
              ${totalRemaining.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="bg-[#111111] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Cuotas este mes</p>
            <p className="text-2xl font-bold text-white">
              ${totalMonthly.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-12">Cargando préstamos...</div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Préstamos personales activos */}
          {personal.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                Préstamos personales
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {personal.map(l => <LoanCard key={l.id} loan={l} accounts={accounts} onPay={payInstallment} />)}
              </div>
            </div>
          )}

          {/* Compras en cuotas activas */}
          {purchase.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                Compras en cuotas
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {purchase.map(l => <LoanCard key={l.id} loan={l} accounts={accounts} onPay={payInstallment} />)}
              </div>
            </div>
          )}

          {/* Pagados */}
          {paid.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                Finalizados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paid.map(l => <LoanCard key={l.id} loan={l} accounts={accounts} onPay={payInstallment} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Loans;
