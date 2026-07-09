import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard as CardIcon, Check } from 'lucide-react';
import { api } from '@/lib/axios';
import type { Card } from '@/hooks/useCardData';

interface Account { id: string; name: string; type: string; }

interface Props {
  card:       Card | null;
  onClose:    () => void;
  onSave:     (id: string, data: object) => Promise<void>;
}

const BANKS = [
  { id: 'itau',         name: 'Itaú',         gradient: 'from-orange-600 to-orange-400' },
  { id: 'santander',    name: 'Santander',    gradient: 'from-red-700 to-rose-600' },
  { id: 'alimentacion', name: 'Alimentación', gradient: 'from-yellow-500 to-amber-400' },
  { id: 'creditel',     name: 'Creditel',     gradient: 'from-blue-700 to-cyan-500' },
  { id: 'scotiabank',   name: 'Scotiabank',   gradient: 'from-red-900 to-red-700' },
  { id: 'prex',         name: 'Prex',         gradient: 'from-violet-700 to-violet-500' },
  { id: 'mercadopago',  name: 'Mercado Pago', gradient: 'from-sky-500 to-cyan-400' },
  { id: 'otro',         name: 'Otro',         gradient: 'from-zinc-700 to-zinc-500' },
] as const;

function findBank(color: string) {
  return BANKS.find(b => b.gradient === color) ?? BANKS[BANKS.length - 1];
}

export const EditCardModal = ({ card, onClose, onSave }: Props) => {
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[number]>(BANKS[BANKS.length - 1]);
  const [name,         setName]         = useState('');
  const [brand,        setBrand]        = useState<'VISA' | 'MASTERCARD' | 'AMEX'>('VISA');
  const [lastFour,     setLastFour]     = useState('');
  const [accountId,    setAccountId]    = useState('');
  const [limit,        setLimit]        = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDay,       setDueDay]       = useState('');
  const [accounts,     setAccounts]     = useState<Account[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const isOpen = card !== null;

  useEffect(() => {
    if (!card) return;
    setSelectedBank(findBank(card.color));
    setName(card.name);
    setBrand(card.brand as 'VISA' | 'MASTERCARD' | 'AMEX');
    setLastFour(card.lastFourDigits);
    setAccountId(card.accountId ?? '');
    setLimit(card.limit > 0 ? String(card.limit) : '');
    setStatementDay(card.statementDay ? String(card.statementDay) : '');
    setDueDay(card.dueDay ? String(card.dueDay) : '');
    setError(null);
    api.get<Account[]>('/accounts').then(r => setAccounts(r.data)).catch(() => {});
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setError(null);

    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (lastFour.length !== 4) { setError('Ingresá exactamente los últimos 4 dígitos.'); return; }
    if (card.type === 'CREDIT' && limit && parseFloat(limit) <= 0) {
      setError('El límite de crédito debe ser mayor a $0.'); return;
    }

    setLoading(true);
    try {
      await onSave(card.id, {
        name,
        brand,
        lastFourDigits: lastFour,
        color:          selectedBank.gradient,
        ...(card.type === 'CREDIT' && {
          limit:        limit ? parseFloat(limit) : 0,
          statementDay: statementDay ? parseInt(statementDay, 10) : null,
          dueDay:       dueDay       ? parseInt(dueDay,       10) : null,
        }),
        accountId: accountId || null,
      });
      onClose();
    } catch {
      setError('No se pudo guardar los cambios.');
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
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <CardIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Editar Tarjeta</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">{card?.type === 'CREDIT' ? 'Crédito' : 'Débito'}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

                {/* Selector de banco/color */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Banco / Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BANKS.map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`relative rounded-xl overflow-hidden h-14 bg-gradient-to-br ${bank.gradient} transition-all ${
                          selectedBank.id === bank.id
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f] scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="text-xs font-bold text-white drop-shadow">
                          {bank.id === 'mercadopago' ? 'MP' : bank.name}
                        </span>
                        {selectedBank.id === bank.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <motion.div
                  key={selectedBank.id}
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

                {/* Nombre + últimos 4 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-card-name" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre</label>
                    <input
                      id="edit-card-name"
                      type="text" value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-card-last-four" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Últimos 4 dígitos</label>
                    <input
                      id="edit-card-last-four"
                      type="text" maxLength={4} value={lastFour}
                      onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Franquicia */}
                <div className="space-y-2">
                  <label htmlFor="edit-card-brand" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Franquicia</label>
                  <select
                    id="edit-card-brand"
                    value={brand} onChange={e => setBrand(e.target.value as 'VISA' | 'MASTERCARD' | 'AMEX')}
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="VISA">Visa</option>
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </div>

                {/* Cuenta vinculada */}
                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <label htmlFor="edit-card-account" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                      Cuenta vinculada <span className="text-zinc-600 normal-case">(opcional)</span>
                    </label>
                    <select
                      id="edit-card-account"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Sin vincular</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Campos solo para crédito */}
                {card?.type === 'CREDIT' && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="edit-card-limit" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Límite de crédito</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-zinc-600">$</span>
                        <input
                          id="edit-card-limit"
                          type="number" value={limit}
                          onChange={e => setLimit(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="edit-card-statement" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                          Día de cierre <span className="normal-case text-zinc-600">(opcional)</span>
                        </label>
                        <input
                          id="edit-card-statement"
                          type="number" min="1" max="31" value={statementDay}
                          onChange={e => setStatementDay(e.target.value)}
                          placeholder="Ej. 3"
                          className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-card-due" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                          Día de vencimiento <span className="normal-case text-zinc-600">(opcional)</span>
                        </label>
                        <input
                          id="edit-card-due"
                          type="number" min="1" max="31" value={dueDay}
                          onChange={e => setDueDay(e.target.value)}
                          placeholder="Ej. 13"
                          className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-3 text-sm transition-all disabled:opacity-40"
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
