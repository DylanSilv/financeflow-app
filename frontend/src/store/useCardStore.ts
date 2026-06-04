import { create } from 'zustand';

export interface Card {
  id: string;
  name: string; // Ej: "Visa Signature"
  type: 'CREDIT' | 'DEBIT';
  brand: 'VISA' | 'MASTERCARD' | 'AMEX';
  limit: number;
  balanceUsed: number;
  lastFourDigits: string;
  color: string; // Clases de Tailwind para el gradiente
}

interface CardState {
  cards: Card[];
  addCard: (data: Omit<Card, 'id'>) => void;
  deleteCard: (id: string) => void;
}

const mockCards: Card[] = [
  {
    id: '1',
    name: 'Visa Signature',
    type: 'CREDIT',
    brand: 'VISA',
    limit: 5000,
    balanceUsed: 1250.50,
    lastFourDigits: '4242',
    color: 'from-blue-900 to-blue-600',
  },
  {
    id: '2',
    name: 'Mastercard Black',
    type: 'CREDIT',
    brand: 'MASTERCARD',
    limit: 10000,
    balanceUsed: 8400.00,
    lastFourDigits: '8810',
    color: 'from-zinc-900 to-zinc-700', // Estilo metal/black card
  },
  {
    id: '3',
    name: 'Cuenta Sueldo',
    type: 'DEBIT',
    brand: 'VISA',
    limit: 0,
    balanceUsed: 3200.00, // En débito, esto representará el saldo disponible
    lastFourDigits: '1122',
    color: 'from-emerald-800 to-emerald-500',
  }
];

export const useCardStore = create<CardState>((set) => ({
  cards: mockCards,

  addCard: (data) => set((state) => ({
    cards: [...state.cards, { ...data, id: Math.random().toString(36).substring(2, 9) }]
  })),

  deleteCard: (id) => set((state) => ({
    cards: state.cards.filter(c => c.id !== id)
  }))
}));