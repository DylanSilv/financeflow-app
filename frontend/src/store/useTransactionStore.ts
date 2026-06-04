import { create } from 'zustand';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: string;
  category?: {
    name: string;
    color: string;
  };
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

// Datos falsos iniciales para que el dashboard no esté vacío
const mockTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Salario Mensual',
    amount: 4800,
    date: new Date().toISOString(),
    type: 'INCOME',
    paymentMethod: 'BANK_TRANSFER',
    category: { name: 'Trabajo', color: '#10b981' }
  },
  {
    id: '2',
    title: 'Compra Supermercado',
    amount: 150.50,
    date: new Date().toISOString(),
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: { name: 'Comida', color: '#ef4444' }
  },
  {
    id: '3',
    title: 'Suscripción Netflix',
    amount: 15.99,
    date: new Date().toISOString(),
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    category: { name: 'Ocio', color: '#a855f7' }
  }
];

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: mockTransactions,

  // Simula agregar un movimiento generando un ID aleatorio
  addTransaction: (data) => set((state) => ({
    transactions: [
      { ...data, id: Math.random().toString(36).substring(2, 9) }, 
      ...state.transactions
    ]
  })),

  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id)
  }))
}));