import { create } from 'zustand';
import { authApi } from '@/api/endpoints/auth';
import { TokenPairResponse } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: TokenPairResponse | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  tokens: null,

  initialize: async () => {
    try {
      const tokens = await authApi.getStoredTokens();
      if (tokens) {
        // Verifica se o refresh token ainda é válido
        const expiresAt = new Date(tokens.refreshTokenExpiresAt);
        if (expiresAt > new Date()) {
          set({ isAuthenticated: true, tokens });
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
    set({ isAuthenticated: true, tokens });
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
      set({ isAuthenticated: false, tokens: null });
    }
  },
}));
