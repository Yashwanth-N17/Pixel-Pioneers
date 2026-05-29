import { api } from '../../services/api';

const unwrap = <T>(promise: Promise<{ data: { data: T } }>) =>
  promise.then((response) => response.data.data);

export const budgetApi = {
  createBudget: (body: any) => unwrap(api.post('/budget/create', body)),
  getBudgets: (userId: string) => unwrap(api.get(`/budget/${userId}`)),
  updateBudget: (id: string, body: any) => unwrap(api.put(`/budget/${id}`, body)),
  createIncomeSource: (body: any) => unwrap(api.post('/income-source', body)),
  getIncomeSources: (userId: string) => unwrap(api.get(`/income-source/${userId}`)),
  updateIncomeSource: (id: string, body: any) => unwrap(api.put(`/income-source/${id}`, body)),
  deleteIncomeSource: (id: string) => unwrap(api.delete(`/income-source/${id}`)),
  createExpense: (body: any) => unwrap(api.post('/expenses', body)),
  getExpenses: (userId: string) => unwrap(api.get(`/expenses/${userId}`)),
  updateExpense: (id: string, body: any) => unwrap(api.put(`/expenses/${id}`, body)),
  deleteExpense: (id: string) => unwrap(api.delete(`/expenses/${id}`)),
  budgetPlan: (body: any) => unwrap(api.post('/ai/budget-plan', body)),
  emergencyFund: (body: any) => unwrap(api.post('/ai/emergency-fund', body)),
  educationPlan: (body: any) => unwrap(api.post('/ai/education-plan', body)),
  getGoldPrice: () => unwrap(api.get('/gold-price')),
  goldPlan: (body: any) => unwrap(api.post('/ai/gold-plan', body)),
  cashflowForecast: (body: any) => unwrap(api.post('/ai/cashflow-forecast', body)),
  seasonalIncome: (body: any) => unwrap(api.post('/ai/seasonal-income', body)),
};
