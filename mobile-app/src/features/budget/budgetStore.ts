import { create } from 'zustand';

import type {
  AiBudgetPlan,
  BudgetExpense,
  BudgetSnapshot,
  CashflowForecast,
  EducationPlan,
  EmergencyFundPlan,
  GoldSavingsPlan,
  IncomeSource,
  SeasonalInsight,
} from './types';

type BudgetState = {
  incomeSources: IncomeSource[];
  expenses: BudgetExpense[];
  aiPlan: AiBudgetPlan | null;
  forecast: CashflowForecast | null;
  seasonalInsight: SeasonalInsight | null;
  educationPlans: EducationPlan[];
  goldSavingsData: GoldSavingsPlan | null;
  emergencyFund: EmergencyFundPlan | null;
  setIncomeSources: (items: IncomeSource[]) => void;
  addIncomeSource: (item: Omit<IncomeSource, 'id'>) => void;
  setExpenses: (items: BudgetExpense[]) => void;
  addExpense: (item: Omit<BudgetExpense, 'id'>) => void;
  updateExpense: (id: string, item: Omit<BudgetExpense, 'id'>) => void;
  removeExpense: (id: string) => void;
  setAiPlan: (plan: AiBudgetPlan | null) => void;
  setForecast: (forecast: CashflowForecast | null) => void;
  setSeasonalInsight: (insight: SeasonalInsight | null) => void;
  setEmergencyFund: (plan: EmergencyFundPlan) => void;
  addEducationPlan: (plan: EducationPlan) => void;
  setGoldSavingsData: (plan: GoldSavingsPlan) => void;
  snapshot: () => BudgetSnapshot;
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  incomeSources: [
    { id: 'inc-1', sourceName: 'Crop sale', amount: 18000, frequency: 'seasonal', seasonalFlag: true, seasonCategory: 'harvest' },
    { id: 'inc-2', sourceName: 'Milk income', amount: 4500, frequency: 'monthly', seasonalFlag: false },
  ],
  expenses: [
    { id: 'exp-1', category: 'food', amount: 3500, description: 'Family food' },
    { id: 'exp-2', category: 'farming', amount: 2800, description: 'Seeds and inputs' },
  ],
  aiPlan: null,
  forecast: null,
  seasonalInsight: null,
  educationPlans: [],
  goldSavingsData: null,
  emergencyFund: null,
  setIncomeSources: (items) => set({ incomeSources: items }),
  addIncomeSource: (item) =>
    set((state) => ({
      incomeSources: [{ ...item, id: `inc-${Date.now()}` }, ...state.incomeSources],
    })),
  setExpenses: (items) => set({ expenses: items }),
  addExpense: (item) =>
    set((state) => ({
      expenses: [{ ...item, id: `exp-${Date.now()}` }, ...state.expenses],
    })),
  updateExpense: (id, item) =>
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.id === id ? { ...expense, ...item, id } : expense
      ),
    })),
  removeExpense: (id) =>
    set((state) => ({ expenses: state.expenses.filter((item) => item.id !== id) })),
  setAiPlan: (plan) => set({ aiPlan: plan }),
  setForecast: (forecast) => set({ forecast }),
  setSeasonalInsight: (insight) => set({ seasonalInsight: insight }),
  setEmergencyFund: (plan) => set({ emergencyFund: plan }),
  addEducationPlan: (plan) =>
    set((state) => ({ educationPlans: [plan, ...state.educationPlans] })),
  setGoldSavingsData: (plan) => set({ goldSavingsData: plan }),
  snapshot: () => {
    const state = get();
    const totalIncome = state.incomeSources.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    return {
      totalIncome,
      totalExpenses,
      recommendedSavings: state.aiPlan?.recommendedSavings ?? Math.max(0, totalIncome - totalExpenses),
      emergencyProgress: state.emergencyFund?.reserveTarget
        ? Math.min(1, (state.emergencyFund.currentSaved || 0) / state.emergencyFund.reserveTarget)
        : 0.18,
      educationProgress: state.educationPlans[0]?.estimatedFutureCost
        ? Math.min(1, (state.educationPlans[0].savedAmount || 0) / state.educationPlans[0].estimatedFutureCost)
        : 0.12,
      goldValue: state.goldSavingsData?.estimatedGrowth ?? 0,
    };
  },
}));
