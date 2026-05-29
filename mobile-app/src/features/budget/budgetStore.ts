import { create } from 'zustand';
import { endpoints } from '../../services/api';

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
  syncBudgetWithBackend: () => Promise<void>;
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
  
  syncBudgetWithBackend: async () => {
    try {
      const state = get();
      const income = state.incomeSources.reduce((s, i) => s + i.amount, 0);
      const expense = state.expenses.reduce((s, i) => s + i.amount, 0);
      
      const [ai, emergency, edu, gold, cf, season] = await Promise.allSettled([
        endpoints.budgetPlan({ totalIncome: income, totalExpenses: expense }),
        endpoints.emergencyFund({ targetAmount: 50000, currentSaved: 10000 }),
        endpoints.educationPlan({ childAge: 5, targetYear: 2035, estimatedFutureCost: 200000 }),
        endpoints.goldPlan({ savingsAmount: 1000 }),
        endpoints.cashflowForecast({}),
        endpoints.seasonalIncome({})
      ]);

      if (ai.status === 'fulfilled' && ai.value?.data?.data) {
        set({ aiPlan: ai.value.data.data });
      }
      if (emergency.status === 'fulfilled' && emergency.value?.data?.data) {
        set({ emergencyFund: emergency.value.data.data });
      }
      if (edu.status === 'fulfilled' && edu.value?.data?.data) {
        set({ educationPlans: [edu.value.data.data] });
      }
      if (gold.status === 'fulfilled' && gold.value?.data?.data) {
        set({ goldSavingsData: gold.value.data.data });
      }
      if (cf.status === 'fulfilled' && cf.value?.data?.data) {
        set({ forecast: cf.value.data.data });
      }
      if (season.status === 'fulfilled' && season.value?.data?.data) {
        set({ seasonalInsight: season.value.data.data });
      }
    } catch (e) {
      console.warn('Failed to sync budget with backend', e);
    }
  },

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
        : 0,
      educationProgress: state.educationPlans[0]?.estimatedFutureCost
        ? Math.min(1, (state.educationPlans[0].savedAmount || 0) / state.educationPlans[0].estimatedFutureCost)
        : 0,
      goldValue: state.goldSavingsData?.estimatedGrowth ?? 0,
    };
  },
}));

/**
 * Safe hook for derived budget values.
 * Reads only primitive/stable slices from the store to avoid returning
 * a new object reference on every render (which causes useSyncExternalStore
 * to think the store changed and triggers an infinite loop).
 */
export function useBudgetSnapshot() {
  const totalIncome = useBudgetStore((s) =>
    s.incomeSources.reduce((sum, item) => sum + item.amount, 0)
  );
  const totalExpenses = useBudgetStore((s) =>
    s.expenses.reduce((sum, item) => sum + item.amount, 0)
  );
  const aiRecommendedSavings = useBudgetStore((s) => s.aiPlan?.recommendedSavings ?? null);
  const emergencyReserveTarget = useBudgetStore((s) => s.emergencyFund?.reserveTarget ?? null);
  const emergencyCurrentSaved = useBudgetStore((s) => s.emergencyFund?.currentSaved ?? null);
  const educationFutureCost = useBudgetStore((s) => s.educationPlans[0]?.estimatedFutureCost ?? null);
  const educationSaved = useBudgetStore((s) => s.educationPlans[0]?.savedAmount ?? null);
  const goldValue = useBudgetStore((s) => s.goldSavingsData?.estimatedGrowth ?? 0);

  const recommendedSavings = aiRecommendedSavings ?? Math.max(0, totalIncome - totalExpenses);
  const emergencyProgress = emergencyReserveTarget
    ? Math.min(1, (emergencyCurrentSaved || 0) / emergencyReserveTarget)
    : 0;
  const educationProgress = educationFutureCost
    ? Math.min(1, (educationSaved || 0) / educationFutureCost)
    : 0;

  return { totalIncome, totalExpenses, recommendedSavings, emergencyProgress, educationProgress, goldValue };
}
