export type BudgetFrequency = 'daily' | 'weekly' | 'monthly' | 'seasonal';
export type ExpenseCategory =
  | 'food'
  | 'farming'
  | 'healthcare'
  | 'education'
  | 'loan_repayment'
  | 'transport'
  | 'utilities'
  | 'miscellaneous';

export type IncomeSource = {
  id: string;
  sourceName: string;
  amount: number;
  frequency: BudgetFrequency;
  seasonalFlag: boolean;
  seasonCategory?: string | null;
};

export type BudgetExpense = {
  id: string;
  budgetId?: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  createdAt?: string;
};

export type BudgetSnapshot = {
  totalIncome: number;
  totalExpenses: number;
  recommendedSavings: number;
  emergencyProgress: number;
  educationProgress: number;
  goldValue: number;
};

export type AiBudgetPlan = {
  recommendedSavings: number;
  budgetBreakdown: Record<string, number>;
  warnings: string[];
  recommendations: string[];
  suggestedCategoryLimits?: Record<string, number>;
};

export type CashflowForecast = {
  predictedBalance: number;
  bestCase: number;
  worstCase: number;
  warnings: string[];
};

export type SeasonalInsight = {
  highIncomeMonths: string[];
  lowIncomeMonths: string[];
  riskPeriods: string[];
  recommendations: string[];
};

export type EmergencyFundPlan = {
  reserveTarget: number;
  monthlySavingsTarget: number;
  monthlyTarget?: number;
  currentSaved?: number;
  recommendations?: string[];
  warnings?: string[];
};

export type EducationPlan = {
  monthlySavingsNeeded: number;
  estimatedFutureCost: number;
  strategy: string[];
  savedAmount?: number;
};

export type GoldSavingsPlan = {
  goldEquivalent: number;
  estimatedGrowth: number;
  recommendations: string[];
};
