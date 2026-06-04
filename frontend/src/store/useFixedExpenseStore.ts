import { create } from 'zustand';

export type ExpenseStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  dueDate: number; // Día del mes (1-31)
  status: ExpenseStatus;
  autoPay: boolean;
  categoryColor: string;
}

interface FixedExpenseState {
  expenses: FixedExpense[];
  markAsPaid: (id: string) => void;
  toggleAutoPay: (id: string) => void;
  addExpense: (data: Omit<FixedExpense, 'id' | 'status'>) => void;
}

const mockExpenses: FixedExpense[] = [
  {
    id: '1',
    name: 'Alquiler',
    amount: 1200.00,
    dueDate: 5,
    status: 'PENDING',
    autoPay: false,
    categoryColor: 'from-blue-600 to-blue-400',
  },
  {
    id: '2',
    name: 'Internet Fibra',
    amount: 45.00,
    dueDate: 15,
    status: 'PAID',
    autoPay: true,
    categoryColor: 'from-emerald-600 to-emerald-400',
  },
  {
    id: '3',
    name: 'Netflix',
    amount: 15.99,
    dueDate: 28,
    status: 'OVERDUE',
    autoPay: false,
    categoryColor: 'from-red-600 to-red-400',
  },
  {
    id: '4',
    name: 'Gimnasio',
    amount: 30.00,
    dueDate: 10,
    status: 'PENDING',
    autoPay: true,
    categoryColor: 'from-purple-600 to-purple-400',
  }
];

export const useFixedExpenseStore = create<FixedExpenseState>((set) => ({
  expenses: mockExpenses,

  markAsPaid: (id) => set((state) => ({
    expenses: state.expenses.map(exp => 
      exp.id === id ? { ...exp, status: 'PAID' } : exp
    )
  })),

  toggleAutoPay: (id) => set((state) => ({
    expenses: state.expenses.map(exp => 
      exp.id === id ? { ...exp, autoPay: !exp.autoPay } : exp
    )  
  })),

  // Ahora addExpense está correctamente dentro del objeto
  addExpense: (data) => set((state) => ({
    expenses: [
      ...state.expenses, 
      { 
        ...data, 
        id: Math.random().toString(36).substring(2, 9),
        status: 'PENDING' // Por defecto entra como pendiente
      }
    ]
  }))
}));