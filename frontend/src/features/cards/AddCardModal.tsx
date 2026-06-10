import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard as CardIcon, Check } from 'lucide-react';
import { api } from '@/lib/axios';

interface Account { id: string; name: string; type: string; }

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
}

const BANKS = [
  { id: 'itau',         name: 'Itaú',         gradient: 'from-orange-600 to-orange-400',  text: 'text-white' },
  { id: 'santander',    name: 'Santander',    gradient: 'from-red-700 to-rose-600',       text: 'text-white' },
  { id: 'alimentacion', name: 'Alimentación', gradient: 'from-green-700 to-emerald-500',  text: 'text-white' },
  { id: 'creditel',     name: 'Creditel',     gradient: 'from-blue-700 to-cyan-500',      text: 'text-white' },
  { id: 'scotiabank',   name: 'Scotiabank',   gradient: 'from-red-900 to-red-700',        text: 'text-white' },
  { id: 'prex',         name: 'Prex',         gradient: 'from-violet-700 to-violet-500',  text: 'text-white' },
  { id: 'mercadopago',  name: 'Mercado Pago', gradient: 'from-sky-500 to-cyan-400',       text: 'text-white' },
  { id: 'otro',         name: 'Otro',         gradient: 'from-zinc-700 to-zinc-500',      text: 'text-white' },
] as const;

export const AddCardModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[number] | null>(null);
  const [name,         setName]         = useState('');
  const [type,         setType]         = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [brand,        setBrand]        = useState<'VISA' | 'MASTERCARD' | 'AMEX'>('VISA');
  const [limit,        setLimit]        = useState('');
  const [lastFour,     setLastFour]     = useState('');
  const [accountId,    setAccountId]    = useState('');
  const [accounts,     setAccounts]     = useState<Account[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get<Account[]>('/accounts').then(r => setAccounts(r.data)).catch(() => {});
    }
  }, [isOpen]);

  const handleBankSelect = (bank: typeof BANKS[number]) => {
    setSelectedBank(bank);
    if (!name || BANKS.some(b => b.name === name)) {
      setName(bank.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBank) { setError('Seleccioná el banco emisor de la tarjeta.'); return; }
    if (!name.trim())  { setError('El nombre de la tarjeta es obligatorio.'); return; }
    if (lastFour.length !== 4) { setError('Ingresá exactamente los últimos 4 dígitos.'); return; }
    if (type === 'CREDIT' && (!limit || parseFloat(limit) <= 0)) {
      setError('El límite de crédito debe ser mayor a $0.'); return;
    }

    setLoading(true);
    try {
      await api.post('/cards', {
        name,
        type,
        brand,
        lastFourDigits: lastFour.slice(-4),
        color:          selectedBank.gradient,
        limit:          type === 'CREDIT' ? parseFloat(limit) : 0,
        accountId:      accountId || undefined,
      });

      setSelectedBank(null); setName('');
      setLimit(''); setLastFour('');
      onClose();
      onSuccess?.();
    } catch {
      setError('No se pudo registrar la tarjeta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <CardIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Vincular Tarjeta</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">

                {/* Selector de banco */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Banco / Emisor</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BANKS.map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => handleBankSelect(bank)}
                        className={`relative rounded-xl overflow-hidden h-14 bg-gradient-to-br ${bank.gradient} transition-all ${
                          selectedBank?.id === bank.id
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f] scale-105'
                            : 'opacity-70 hover:opacity-100 hover:scale-102'
                        }`}
                      >
                        <span className={`text-xs font-bold ${bank.text} drop-shadow`}>
                          {bank.id === 'mercadopago' ? 'MP' : bank.name}
                        </span>
                        {selectedBank?.id === bank.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mini preview de la tarjeta */}
                {selectedBank && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative p-4 rounded-xl bg-gradient-to-br ${selectedBank.gradient} overflow-hidden h-24 flex flex-col justify-between`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -mr-6 -mt-6" />
                    <div className="flex justify-between items-start">
                      <span className="text-white/90 text-sm font-semibold">{name || selectedBank.name}</span>
                      <span className="text-white/60 text-xs font-medium">{brand}</span>
                    </div>
                    <div className="text-white/70 text-xs font-mono tracking-widest">
                      •••• •••• •••• {lastFour || '0000'}
                    </div>
                  </motion.div>
                )}

                {/* Nombre personalizado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="card-name" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre de la tarjeta</label>
                    <input
                      id="card-name"
                      type="text" required value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej. Itaú Visa"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="card-last-four" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Últimos 4 dígitos</label>
                    <input
                      id="card-last-four"
                      type="text" required maxLength={4} value={lastFour}
                      onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))}
                      placeholder="4242"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="card-type" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Tipo</label>
                    <select
                      id="card-type"
                      value={type} onChange={e => setType(e.target.value as 'CREDIT' | 'DEBIT')}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="CREDIT">Crédito</option>
                      <option value="DEBIT">Débito</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="card-brand" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Franquicia</label>
                    <select
                      id="card-brand"
                      value={brand} onChange={e => setBrand(e.target.value as 'VISA' | 'MASTERCARD' | 'AMEX')}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="AMEX">American Express</option>
                    </select>
                  </div>
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <label htmlFor="card-account" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                      Vincular a cuenta <span className="text-zinc-600 normal-case">(opcional)</span>
                    </label>
                    <select
                      id="card-account"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Sin vincular</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    {accountId && (
                      <p className="text-xs text-indigo-400">
                        El saldo se calculará automáticamente desde los movimientos de esa cuenta.
                      </p>
                    )}
                  </div>
                )}

                {type === 'CREDIT' && (
                  <div className="space-y-2">
                    <label htmlFor="card-limit" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Límite de crédito</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600">$</span>
                      <input
                        id="card-limit"
                        type="number" required value={limit}
                        onChange={e => setLimit(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit" disabled={loading || !selectedBank}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-4 py-4 text-sm transition-all disabled:opacity-40"
                >
                  {loading ? 'Registrando...' : 'Confirmar Registro'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
