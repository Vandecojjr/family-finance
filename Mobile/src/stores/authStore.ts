import { create } from 'zustand';
import { authApi } from '@/api/endpoints/auth';
import { TokenPairResponse } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: TokenPairResponse | null;
  roles: string[];

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const getRoles = (token: string): string[] => {
  const payload = parseJwt(token);
  if (!payload) return [];
  const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || [];
  return Array.isArray(roles) ? roles : [roles];
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  tokens: null,
  roles: [],

  initialize: async () => {
    try {
      const tokens = await authApi.getStoredTokens();
      if (tokens) {
        // Verifica se o refresh token ainda é válido
        const expiresAt = new Date(tokens.refreshTokenExpiresAt);
        if (expiresAt > new Date()) {
          set({ isAuthenticated: true, tokens, roles: getRoles(tokens.accessToken) });
        } else {
          await authApi.clearTokens();
        }
      }
    } catch {
      // Ignora erros de leitura do SecureStore
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    console.log('[authStore] Initiating login for:', email);
    const tokens = await authApi.login({ email, password });
    console.log('[authStore] Tokens received successfully:', { hasAccessToken: !!tokens?.accessToken });
    await authApi.saveTokens(tokens);
    console.log('[authStore] Tokens saved to secure store');
    set({ isAuthenticated: true, tokens, roles: getRoles(tokens.accessToken) });
  },

  logout: async () => {
    const { tokens } = get();
    try {
      if (tokens?.refreshToken) {
        await authApi.revoke(tokens.refreshToken);
      }
    } catch {
      // Continua o logout mesmo se a revogação falhar
    } finally {
      await authApi.clearTokens();
      set({ isAuthenticated: false, tokens: null, roles: [] });
    }
  },
}));
