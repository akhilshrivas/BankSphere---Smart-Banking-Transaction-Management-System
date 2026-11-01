import axios from 'axios';
import {
  AuthResponse,
  Account,
  Transaction,
  Beneficiary,
  CustomerDashboard,
  AdminDashboard,
  SystemReconciliationReport
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('banksphere_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('banksphere_refresh');
      const accessToken = localStorage.getItem('banksphere_token');

      if (refreshToken && accessToken) {
        try {
          const res = await axios.post<AuthResponse>('/api/auth/refresh', {
            accessToken,
            refreshToken,
          });

          if (res.data.success && res.data.accessToken) {
            localStorage.setItem('banksphere_token', res.data.accessToken);
            if (res.data.refreshToken) {
              localStorage.setItem('banksphere_refresh', res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('banksphere_token');
          localStorage.removeItem('banksphere_refresh');
          localStorage.removeItem('banksphere_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post<AuthResponse>('/auth/login', data),
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken, accessToken: '' }),
};

export const customerApi = {
  getMe: () => api.get<CustomerDashboard>('/customers/me'),
  updateProfile: (data: any) => api.put('/customers/me', data),
};

export const accountApi = {
  getAccounts: () => api.get<Account[]>('/accounts'),
  getAccountById: (id: string) => api.get<Account>(`/accounts/${id}`),
  getAccountBalance: (id: string) => api.get(`/accounts/${id}/balance`),
  createAccount: (data: { accountTypeId?: string; currency?: string; initialDeposit?: number }) =>
    api.post<Account>('/accounts', data),
  getAccountTypes: () => api.get('/accounts/types'),
};

export const transactionApi = {
  deposit: (data: { accountId: string; amount: number; description?: string }) =>
    api.post<Transaction>('/transactions/deposit', data),
  withdraw: (data: { accountId: string; amount: number; description?: string }) =>
    api.post<Transaction>('/transactions/withdraw', data),
  transfer: (
    data: { sourceAccountId: string; destinationAccountNumber: string; amount: number; description?: string },
    idempotencyKey?: string
  ) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    return api.post<Transaction>('/transactions/transfer', data, { headers });
  },
  getTransactions: (params?: any) => api.get<Transaction[]>('/transactions', { params }),
  getTransactionById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  downloadStatement: (accountId: string, startDate?: string, endDate?: string) =>
    api.get(`/transactions/statement`, {
      params: { accountId, startDate, endDate },
      responseType: 'blob',
    }),
};

export const beneficiaryApi = {
  getBeneficiaries: () => api.get<Beneficiary[]>('/beneficiaries'),
  addBeneficiary: (data: { name: string; accountNumber: string; bankName?: string; routingNumber?: string; nickname?: string }) =>
    api.post<Beneficiary>('/beneficiaries', data),
  deleteBeneficiary: (id: string) => api.delete(`/beneficiaries/${id}`),
};

export const adminApi = {
  getDashboard: () => api.get<AdminDashboard>('/admin/dashboard'),
  getCustomers: () => api.get<any[]>('/admin/customers'),
  getAccounts: () => api.get<Account[]>('/admin/accounts'),
  getTransactions: (skip = 0, take = 50) => api.get<Transaction[]>('/admin/transactions', { params: { skip, take } }),
  updateAccountStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/admin/accounts/${id}/status`, { status, reason }),
  getFraudAlerts: () => api.get<any[]>('/admin/fraud-alerts'),
  reviewFraudAlert: (id: string, status: string, resolutionNotes: string) =>
    api.patch(`/admin/fraud-alerts/${id}/review`, { status, resolutionNotes }),
  getReconciliation: () => api.get<SystemReconciliationReport>('/admin/reconciliation'),
};

export const analyticsApi = {
  getOverview: () => api.get<any>('/analytics/overview'),
  getMonthly: () => api.get<any[]>('/analytics/monthly-transactions'),
  getSpending: () => api.get<any[]>('/analytics/spending'),
};

export default api;
