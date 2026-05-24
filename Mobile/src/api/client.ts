import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configura o IP dinamicamente para rodar no Celular Físico (obtém IP do Metro), Android (10.0.2.2) ou iOS/Web (localhost)
const getBaseUrl = () => {
  if (!__DEV__) return 'https://api.familyfinance.app';
  
  const hostUri = Constants.expoConfig?.hostUri; // Ex: "192.168.1.15:8081"
  const host = hostUri ? hostUri.split(':')[0] : null;
  
  if (host && !host.startsWith('127.0.0.1') && host !== 'localhost') {
    return `http://${host}:5068`;
  }
  
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5068';
  }
  return 'http://localhost:5068';
};

const BASE_URL = getBaseUrl();

console.log('[apiClient] Resolved BASE_URL:', BASE_URL);

export const TOKEN_KEYS = {
  ACCESS: 'ff_access_token',
  REFRESH: 'ff_refresh_token',
  ACCESS_EXPIRES: 'ff_access_expires',
  REFRESH_EXPIRES: 'ff_refresh_expires',
} as const;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de Request: injeta Bearer token ──────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItemAsync(TOKEN_KEYS.ACCESS);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Interceptor de Response: refresh automático em 401 ──────────────────────
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const drainQueue = (token: string) => {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve) => {
        pendingRequests.push(resolve);
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.getItemAsync(TOKEN_KEYS.REFRESH);
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await apiClient.post<{
        value: { accessToken: string; refreshToken: string; accessTokenExpiresAt: string; refreshTokenExpiresAt: string };
      }>('/api/auth/refresh', { refreshToken });

      const { accessToken, refreshToken: newRefresh, accessTokenExpiresAt, refreshTokenExpiresAt } = data.value!;

      await storage.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
      await storage.setItemAsync(TOKEN_KEYS.REFRESH, newRefresh);
      await storage.setItemAsync(TOKEN_KEYS.ACCESS_EXPIRES, accessTokenExpiresAt);
      await storage.setItemAsync(TOKEN_KEYS.REFRESH_EXPIRES, refreshTokenExpiresAt);

      drainQueue(accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      // Limpa tokens e força logout
      await Promise.all([
        storage.deleteItemAsync(TOKEN_KEYS.ACCESS),
        storage.deleteItemAsync(TOKEN_KEYS.REFRESH),
        storage.deleteItemAsync(TOKEN_KEYS.ACCESS_EXPIRES),
        storage.deleteItemAsync(TOKEN_KEYS.REFRESH_EXPIRES),
      ]);
      pendingRequests = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
