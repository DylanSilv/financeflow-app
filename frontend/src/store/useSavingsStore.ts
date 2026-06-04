import { create } from 'zustand';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  deadline?: string; // Fecha límite opcional
}

interface SavingsState {
  goals: SavingsGoal[];
  addGoal: (data: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  addFunds: (id: string, amount: number) => void;
}

const mockGoals: SavingsGoal[] = [
  {
    id: '1',
    name: 'Fondo de Emergencia',
    targetAmount: 10000,
    currentAmount: 6500,
    color: 'bg-emerald-500',
  },
  {
    id: '2',
    name: 'Viaje a Japón 🇯🇵',
    targetAmount: 4500,
    currentAmount: 1200,
    color: 'bg-indigo-500',
    deadline: '2027-03-01',
  },
  {
    id: '3',
    name: 'MacBook Pro M4',
    targetAmount: 2500,
    currentAmount: 2200,
    color: 'bg-purple-500',
    deadline: '2026-11-15',
  }
];

export const useSavingsStore = create<SavingsState>((set) => ({
  goals: mockGoals,

  addGoal: (data) => set((state) => ({
    goals: [
      ...state.goals, 
      { 
        ...data, 
        id: Math.random().toString(36).substring(2, 9),
        currentAmount: 0 
      }
    ]
  })),

  // Función para simular un depósito a una meta
  addFunds: (id, amount) => set((state) => ({
    goals: state.goals.map(goal => {
      if (goal.id === id) {
        const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
        return { ...goal, currentAmount: newAmount };
      }
      return goal;
    })
  }))
}));