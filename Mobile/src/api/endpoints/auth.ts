import { apiClient, TOKEN_KEYS } from '../client';
import { storage } from '../../utils/storage';
import { TokenPairResponse, ApiResult } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = {
  login: async (payload: LoginRequest): Promise<TokenPairResponse> => {
    console.log('[authApi] Sending POST to /api/auth/login with payload:', { email: payload.email });
    try {
      const { data } = await apiClient.post<ApiResult<TokenPairResponse>>('/api/auth/login', payload);
      console.log('[authApi] API Response data:', data);
      if (!data.isSuccess || !data.value) {
        const msg = data.errors?.[0]?.description ?? 'Erro ao fazer login.';
        throw new Error(msg);
      }
      return data.value;
    } catch (error: any) {
      console.error('[authApi] Network/Server Error:', error.message, error.response?.data);
      throw error;
    }
  },

  refresh: async (refreshToken: string): Promise<TokenPairResponse> => {
    const { data } = await apiClient.post<ApiResult<TokenPairResponse>>('/api/auth/refresh', { refreshToken });
    if (!data.isSuccess || !data.value) {
      throw new Error('Falha ao renovar sessão.');
    }
    return data.value;
  },

  revoke: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/auth/revoke', { refreshToken });
  },

  saveTokens: async (tokens: TokenPairResponse): Promise<void> => {
    await Promise.all([
      storage.setItemAsync(TOKEN_KEYS.ACCESS, tokens.accessToken),
      storage.setItemAsync(TOKEN_KEYS.REFRESH, tokens.refreshToken),
      storage.setItemAsync(TOKEN_KEYS.ACCESS_EXPIRES, tokens.accessTokenExpiresAt),
      storage.setItemAsync(TOKEN_KEYS.REFRESH_EXPIRES, tokens.refreshTokenExpiresAt),
    ]);
  },

  clearTokens: async (): Promise<void> => {
    await Promise.all([
      storage.deleteItemAsync(TOKEN_KEYS.ACCESS),
      storage.deleteItemAsync(TOKEN_KEYS.REFRESH),
      storage.deleteItemAsync(TOKEN_KEYS.ACCESS_EXPIRES),
      storage.deleteItemAsync(TOKEN_KEYS.REFRESH_EXPIRES),
    ]);
  },

  getStoredTokens: async (): Promise<TokenPairResponse | null> => {
    const [accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt] = await Promise.all([
      storage.getItemAsync(TOKEN_KEYS.ACCESS),
      storage.getItemAsync(TOKEN_KEYS.REFRESH),
      storage.getItemAsync(TOKEN_KEYS.ACCESS_EXPIRES),
      storage.getItemAsync(TOKEN_KEYS.REFRESH_EXPIRES),
    ]);
    if (!accessToken || !refreshToken) return null;
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt ?? '',
      refreshTokenExpiresAt: refreshTokenExpiresAt ?? '',
    };
  },
};
