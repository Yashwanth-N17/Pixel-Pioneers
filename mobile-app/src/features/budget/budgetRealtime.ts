import { io, Socket } from 'socket.io-client';
import { Buffer } from 'buffer';

import { api } from '../../services/api';
import { getToken } from '../../services/auth';
import { useBudgetStore } from './budgetStore';

type BudgetRealtime = {
  disconnect: () => void;
};

const decodeUserId = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded.userId as string | undefined;
  } catch {
    return undefined;
  }
};

const getSocketUrl = () => {
  const baseURL = String(api.defaults.baseURL || '');
  return baseURL.replace(/\/api\/?$/, '');
};

export async function connectBudgetRealtime(): Promise<BudgetRealtime | null> {
  const token = await getToken();
  const userId = token ? decodeUserId(token) : undefined;
  if (!userId) return null;

  const socket: Socket = io(getSocketUrl(), {
    transports: ['websocket'],
    auth: { userId },
  });

  socket.emit('join-user', { userId });

  socket.on('ai-analysis-complete', (payload) => {
    const store = useBudgetStore.getState();
    if (payload?.type === 'budget-plan') store.setAiPlan(payload.result);
    if (payload?.type === 'emergency-fund') store.setEmergencyFund(payload.result);
    if (payload?.type === 'education-plan') store.addEducationPlan(payload.result);
    if (payload?.type === 'gold-plan') store.setGoldSavingsData(payload.result);
    if (payload?.type === 'cashflow-forecast') store.setForecast(payload.result);
    if (payload?.type === 'seasonal-income') store.setSeasonalInsight(payload.result);
  });

  socket.on('forecast-warning', (payload) => {
    useBudgetStore.getState().setForecast(payload);
  });

  return {
    disconnect: () => socket.disconnect(),
  };
}
