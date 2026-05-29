import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { getToken } from './auth';

// ─────────────────────────────────────────
// Base URLs
// ─────────────────────────────────────────
// REPLACE '192.168.1.X' WITH YOUR COMPUTER'S ACTUAL IPv4 ADDRESS!
// localhost will NOT work on a physical device.
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const envVoiceUrl = process.env.EXPO_PUBLIC_VOICE_URL;

const expoHost =
  Constants.expoConfig?.hostUri?.split(':')[0] ||
  (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost?.split(':')[0] ||
  null;

const fallbackApi = expoHost ? `http://${expoHost}:3000/api` : 'http://10.60.220.113:3000/api';
const fallbackVoice = expoHost ? `http://${expoHost}:8000/api` : 'http://10.60.220.113:8000/api';

const BASE = envApiUrl ?? fallbackApi;
const VOICE = envVoiceUrl ?? fallbackVoice;

console.log('[API][BOOT] Resolved API baseURL:', BASE);
console.log('[API][BOOT] Resolved Voice baseURL:', VOICE);

// ─────────────────────────────────────────
// Axios instances
// ─────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

/** Separate voice micro-service (whisper / tts) */
export const voiceApi: AxiosInstance = axios.create({
  baseURL: VOICE,
  timeout: 20000,
});

const redact = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const cloned = { ...data };
  if ('password' in cloned) cloned.password = '[REDACTED]';
  if ('token' in cloned) cloned.token = '[REDACTED]';
  return cloned;
};

// ─────────────────────────────────────────
// Auth interceptor — attach JWT to every request
// ─────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('[API][REQ]', config.method?.toUpperCase(), `${config.baseURL}${config.url}`, {
    params: config.params,
    data: redact(config.data),
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(
      '[API][RES]',
      response.status,
      `${response.config.baseURL}${response.config.url}`,
      redact(response.data)
    );
    return response;
  },
  (error) => {
    console.log(
      '[API][ERR]',
      error?.response?.status ?? 'NO_RESPONSE',
      error?.config ? `${error.config.baseURL}${error.config.url}` : 'unknown-url',
      redact(error?.response?.data ?? error?.message)
    );
    return Promise.reject(error);
  }
);

voiceApi.interceptors.request.use((config) => {
  console.log('[VOICE][REQ]', config.method?.toUpperCase(), `${config.baseURL}${config.url}`);
  return config;
});

voiceApi.interceptors.response.use(
  (response) => {
    console.log('[VOICE][RES]', response.status, `${response.config.baseURL}${response.config.url}`);
    return response;
  },
  (error) => {
    console.log(
      '[VOICE][ERR]',
      error?.response?.status ?? 'NO_RESPONSE',
      error?.config ? `${error.config.baseURL}${error.config.url}` : 'unknown-url',
      error?.response?.data ?? error?.message
    );
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// Response unwrapper — returns `data` from
// the standard { success, message, data } envelope
// ─────────────────────────────────────────
function unwrap<T = any>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

// ─────────────────────────────────────────
// API Endpoints — matches backend spec exactly
// ─────────────────────────────────────────
export const endpoints = {

  // ── Auth ────────────────────────────────
  register: (body: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    language?: string;
    village?: string;
    district?: string;
  }) => api.post('/auth/register', body),

  login: (phone: string, password: string, village?: string, district?: string) =>
    api.post('/auth/login', { phone, password, village, district }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  getMyProfile: () => api.get('/profile/me'),

  // ── User ────────────────────────────────
  getProfile: () => api.get('/users/profile'),

  updateProfile: (body: Record<string, any>) =>
    api.put('/profile/me', body),

  createFarmerProfile: (data: any) => api.post('/profile/farmer', data),
  createShopProfile: (data: any) => api.post('/profile/shop', data),
  createTailorProfile: (data: any) => api.post('/profile/tailor', data),
  createGenericProfile: (data: any) => api.post('/profile/generic', data),

  // ── Transactions ────────────────────────
  getTransactions: (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/transactions', { params }),

  addTransaction: (body: {
    amount: number;
    type: string;      // income | expense | saving
    category: string;
    note?: string;
    date?: string;
  }) => api.post('/transactions', body),

  getTransaction: (id: string) =>
    api.get(`/transactions/${id}`),

  updateTransaction: (id: string, body: Record<string, any>) =>
    api.put(`/transactions/${id}`, body),

  deleteTransaction: (id: string) =>
    api.delete(`/transactions/${id}`),

  // ── Ledger (profession-specific) ────────
  /**
   * Fetch all ledger entries for a given occupation.
   * Returns { entries: Transaction[], grouped: Record<category, Transaction[]> }
   */
  getLedgerEntries: (occupation: 'FARMER' | 'SHOP_OWNER' | 'TAILOR' | 'DAILY_WAGE') =>
    api.get('/transactions/ledger', { params: { occupation } }),

  /**
   * Add a ledger entry. Same as addTransaction but accepts `ledgerMeta`.
   */
  addLedgerEntry: (body: {
    amount: number;
    type: 'income' | 'expense' | 'saving';
    category: string;
    note?: string;
    date?: string;
    ledgerMeta?: Record<string, any>;
  }) => api.post('/transactions', body),

  /**
   * Delete a ledger entry by transaction id.
   */
  deleteLedgerEntry: (id: string) =>
    api.delete(`/transactions/${id}`),

  // ── Dashboard ───────────────────────────
  getDashboard: () => api.get('/dashboard'),

  // ── SHG Digital Banking ─────────────────
  createShgGroup: (body: {
    name: string;
    approvalThreshold?: number;
  }) => api.post('/shg/groups', body),

  joinShgGroup: (body: {
    groupId?: string;
    inviteCode?: string;
  }) => api.post('/shg/groups/join', body),

  getMyShgGroups: () => api.get('/shg/groups/my'),

  getShgDashboard: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/dashboard`),

  getShgMembers: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/members`),

  getShgTransactions: (groupId: string, params?: {
    type?: 'deposit' | 'withdrawal' | 'loan_repayment';
    status?: 'pending' | 'approved' | 'rejected' | 'executed';
  }) => api.get(`/shg/groups/${groupId}/transactions`, { params }),

  createShgTransaction: (groupId: string, body: {
    type: 'deposit' | 'withdrawal' | 'loan_repayment';
    amount: number;
    description?: string;
    metadata?: Record<string, any>;
  }) => api.post(`/shg/groups/${groupId}/transactions`, body),

  getShgApprovals: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/approvals`),

  approveShgTransaction: (transactionId: string, remarks?: string) =>
    api.post(`/shg/transactions/${transactionId}/approve`, { remarks }),

  rejectShgTransaction: (transactionId: string, remarks?: string) =>
    api.post(`/shg/transactions/${transactionId}/reject`, { remarks }),

  getShgProposals: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/proposals`),

  createShgProposal: (groupId: string, body: {
    title: string;
    description?: string;
    deadline?: string;
  }) => api.post(`/shg/groups/${groupId}/proposals`, body),

  voteShgProposal: (proposalId: string, vote: 'yes' | 'no') =>
    api.post(`/shg/proposals/${proposalId}/vote`, { vote }),

  getShgNotifications: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/notifications`),

  markShgNotificationRead: (notificationId: string) =>
  (response) => {
    console.log(
      '[API][RES]',
      response.status,
      `${response.config.baseURL}${response.config.url}`,
      redact(response.data)
    );
    return response;
  },
  (error) => {
    console.log(
      '[API][ERR]',
      error?.response?.status ?? 'NO_RESPONSE',
      error?.config ? `${error.config.baseURL}${error.config.url}` : 'unknown-url',
      redact(error?.response?.data ?? error?.message)
    );
    return Promise.reject(error);
  }
);

voiceApi.interceptors.request.use((config) => {
  console.log('[VOICE][REQ]', config.method?.toUpperCase(), `${config.baseURL}${config.url}`);
  return config;
});

voiceApi.interceptors.response.use(
  (response) => {
    console.log('[VOICE][RES]', response.status, `${response.config.baseURL}${response.config.url}`);
    return response;
  },
  (error) => {
    console.log(
      '[VOICE][ERR]',
      error?.response?.status ?? 'NO_RESPONSE',
      error?.config ? `${error.config.baseURL}${error.config.url}` : 'unknown-url',
      error?.response?.data ?? error?.message
    );
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// Response unwrapper — returns `data` from
// the standard { success, message, data } envelope
// ─────────────────────────────────────────
function unwrap<T = any>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

// ─────────────────────────────────────────
// API Endpoints — matches backend spec exactly
// ─────────────────────────────────────────
export const endpoints = {

  // ── Auth ────────────────────────────────
  register: (body: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    language?: string;
    village?: string;
    district?: string;
  }) => api.post('/auth/register', body),

  login: (phone: string, password: string, village?: string, district?: string) =>
    api.post('/auth/login', { phone, password, village, district }),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  getMyProfile: () => api.get('/profile/me'),

  // ── User ────────────────────────────────
  getProfile: () => api.get('/users/profile'),

  updateProfile: (body: Record<string, any>) =>
    api.put('/profile/me', body),

  createFarmerProfile: (data: any) => api.post('/profile/farmer', data),
  createShopProfile: (data: any) => api.post('/profile/shop', data),
  createTailorProfile: (data: any) => api.post('/profile/tailor', data),
  createGenericProfile: (data: any) => api.post('/profile/generic', data),

  // ── Transactions ────────────────────────
  getTransactions: (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/transactions', { params }),

  addTransaction: (body: {
    amount: number;
    type: string;      // income | expense | saving
    category: string;
    note?: string;
    date?: string;
  }) => api.post('/transactions', body),

  getTransaction: (id: string) =>
    api.get(`/transactions/${id}`),

  updateTransaction: (id: string, body: Record<string, any>) =>
    api.put(`/transactions/${id}`, body),

  deleteTransaction: (id: string) =>
    api.delete(`/transactions/${id}`),

  // ── Ledger (profession-specific) ────────
  /**
   * Fetch all ledger entries for a given occupation.
   * Returns { entries: Transaction[], grouped: Record<category, Transaction[]> }
   */
  getLedgerEntries: (occupation: 'FARMER' | 'SHOP_OWNER' | 'TAILOR' | 'DAILY_WAGE') =>
    api.get('/transactions/ledger', { params: { occupation } }),

  /**
   * Add a ledger entry. Same as addTransaction but accepts `ledgerMeta`.
   */
  addLedgerEntry: (body: {
    amount: number;
    type: 'income' | 'expense' | 'saving';
    category: string;
    note?: string;
    date?: string;
    ledgerMeta?: Record<string, any>;
  }) => api.post('/transactions', body),

  /**
   * Delete a ledger entry by transaction id.
   */
  deleteLedgerEntry: (id: string) =>
    api.delete(`/transactions/${id}`),

  // ── Dashboard ───────────────────────────
  getDashboard: () => api.get('/dashboard'),

  // ── SHG Digital Banking ─────────────────
  createShgGroup: (body: {
    name: string;
    approvalThreshold?: number;
  }) => api.post('/shg/groups', body),

  joinShgGroup: (body: {
    groupId?: string;
    inviteCode?: string;
  }) => api.post('/shg/groups/join', body),

  getMyShgGroups: () => api.get('/shg/groups/my'),

  getShgDashboard: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/dashboard`),

  getShgMembers: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/members`),

  getShgTransactions: (groupId: string, params?: {
    type?: 'deposit' | 'withdrawal' | 'loan_repayment';
    status?: 'pending' | 'approved' | 'rejected' | 'executed';
  }) => api.get(`/shg/groups/${groupId}/transactions`, { params }),

  createShgTransaction: (groupId: string, body: {
    type: 'deposit' | 'withdrawal' | 'loan_repayment';
    amount: number;
    description?: string;
    metadata?: Record<string, any>;
  }) => api.post(`/shg/groups/${groupId}/transactions`, body),

  getShgApprovals: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/approvals`),

  approveShgTransaction: (transactionId: string, remarks?: string) =>
    api.post(`/shg/transactions/${transactionId}/approve`, { remarks }),

  rejectShgTransaction: (transactionId: string, remarks?: string) =>
    api.post(`/shg/transactions/${transactionId}/reject`, { remarks }),

  getShgProposals: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/proposals`),

  createShgProposal: (groupId: string, body: {
    title: string;
    description?: string;
    deadline?: string;
  }) => api.post(`/shg/groups/${groupId}/proposals`, body),

  voteShgProposal: (proposalId: string, vote: 'yes' | 'no') =>
    api.post(`/shg/proposals/${proposalId}/vote`, { vote }),

  getShgNotifications: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/notifications`),

  markShgNotificationRead: (notificationId: string) =>
    api.patch(`/shg/notifications/${notificationId}/read`),

  getShgAuditLogs: (groupId: string) =>
    api.get(`/shg/groups/${groupId}/audit-logs`),

  // ── AI ──────────────────────────────────
  financialGuidance: (query: string, language: string) =>
    api.post('/ai/financial-guidance', { query, language }),

  scamDetection: (message: string) =>
    api.post('/ai/scam-detection', { message }),

  getLoanHistory: () => api.get('/ai/loan-analysis/history'),

  loanAnalysis: (body: {
    requestedLoanAmount: number;
    expectedInterestRate: number;
    tenureMonths: number;
    loanPurpose: string;
    collateralValue?: number | null;
  }) => api.post('/ai/loan-analysis', body),

  budgetPlan: (body?: Record<string, any>) =>
    api.post('/ai/budget-plan', body),

  emergencyFund: (body?: Record<string, any>) =>
    api.post('/ai/emergency-fund', body),

  educationPlan: (body?: Record<string, any>) =>
    api.post('/ai/education-plan', body),

  goldPlan: (body?: Record<string, any>) =>
    api.post('/ai/gold-plan', body),

  cashflowForecast: (body?: Record<string, any>) =>
    api.post('/ai/cashflow-forecast', body),

  seasonalIncome: (body?: Record<string, any>) =>
    api.post('/ai/seasonal-income', body),

  // ── Chat / Voice Assistant ──────────────
  sendChatMessage: (body: {
    message: string;
    language?: 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'mr';
    context?: Record<string, any>;
  }) => api.post('/chat/message', body),

  sendVoiceMessage: (form: FormData) =>
    api.post('/chat/voice', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),

  getChatHistory: (limit = 50) =>
    api.get('/chat/history', { params: { limit } }),

  // ── RTC ─────────────────────────────────
  uploadRtc: (form: FormData) =>
    api.post('/rtc/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,   // OCR can be slow
    }),

  getRtcRecords: () => api.get('/rtc'),

// ── Payments (Mock Flow) ─────────────────────────────────────────────
/**
 * Process a mock payment checkout. Supports normal personal payments and SHG transactions.
 * It auto-syncs to the personal ledger, and adds SHG transactions if shgGroupId is provided.
 */
processMockCheckout: (body: {
  amount: number;
  description?: string;
  category?: string;
  shgGroupId?: string;
  shgTransactionType?: 'deposit' | 'loan_repayment';
  repaymentDeadline?: string;
}) => api.post('/payments/mock-checkout', body),

/**
 * Get payment history (with optional filters).
 */
getPaymentHistory: (params?: {
  status?: 'created' | 'paid' | 'failed';
  startDate?: string;
  endDate?: string;
}) => api.get('/payments/history', { params }),

/**
 * Get payment analytics — totals, categories, monthly breakdown.
 */
getPaymentAnalytics: () => api.get('/payments/analytics'),

/**
 * Get a single payment by ID.
 */
getPaymentById: (id: string) => api.get(`/payments/${id}`),
};

// ─────────────────────────────────────────
// Voice WebSocket Connection Helper
// ─────────────────────────────────────────

export function getWebSocketBaseUrl(httpUrl: string): string {
  if (httpUrl.startsWith('https://')) {
    return httpUrl.replace('https://', 'wss://').replace(/\/api\/?$/, '');
  }
  return httpUrl.replace('http://', 'ws://').replace(/\/api\/?$/, '');
}

export function createVoiceSocket({
  backendUrl = getWebSocketBaseUrl(BASE),
  onConnected,
  onReady,
  onChunkReceived,
  onProcessing,
  onResponse,
  onCancelled,
  onError
}: {
  backendUrl?: string;
  onConnected?: (msg: any) => void;
  onReady?: (msg: any) => void;
  onChunkReceived?: (msg: any) => void;
  onProcessing?: (msg: any) => void;
  onResponse?: (payload: any) => void;
  onCancelled?: (msg: any) => void;
  onError?: (error: string) => void;
}) {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const socket = new WebSocket(`${backendUrl}/ws/voice?sessionId=${sessionId}`);

  socket.binaryType = "arraybuffer";

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    switch (message.type) {
      case "connected":
        onConnected?.(message);
        break;
      case "voice.ready":
        onReady?.(message);
        break;
      case "voice.chunk_received":
        onChunkReceived?.(message);
        break;
      case "voice.processing":
        onProcessing?.(message);
        break;
      case "voice.response":
        onResponse?.(message.payload);
        break;
      case "voice.cancelled":
        onCancelled?.(message);
        break;
      case "error":
        onError?.(message.error || "An unknown error occurred.");
        break;
      default:
        break;
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    onError?.("WebSocket connection failed.");
  };

  return {
    sessionId,

    start(metadata: { filename?: string; mimeType?: string } = {}) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "voice.start",
          sessionId,
          filename: metadata.filename || "voice.webm",
          mimeType: metadata.mimeType || "audio/webm"
        }));
      }
    },

    sendChunk(chunk: ArrayBuffer) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(chunk);
      }
    },

    end() {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "voice.end" }));
      }
    },

    cancel() {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "voice.cancel" }));
      }
    },

    ping() {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    },

    close() {
      socket.close();
    }
  };
}
