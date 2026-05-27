import { apiClient } from '../client';
import {
  ApiResult,
  Wallet,
  CreateWalletRequest,
  UpdateWalletRequest,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  CreateCreditCardRequest
} from '@/types';

export const walletsApi = {
  list: async (): Promise<Wallet[]> => {
    const { data } = await apiClient.get<ApiResult<Wallet[]>>('/api/wallets');
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter carteiras.';
      throw new Error(msg);
    }
    return data.value;
  },

  getById: async (id: string): Promise<Wallet> => {
    const { data } = await apiClient.get<ApiResult<Wallet>>(`/api/wallets/${id}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter carteira.';
      throw new Error(msg);
    }
    return data.value;
  },

  create: async (payload: CreateWalletRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/wallets', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar carteira.';
      throw new Error(msg);
    }
    return data.value;
  },

  update: async (id: string, payload: UpdateWalletRequest): Promise<void> => {
    const { data } = await apiClient.put<ApiResult<void>>(`/api/wallets/${id}`, payload);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar carteira.';
      throw new Error(msg);
    }
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/wallets/${id}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover carteira.';
      throw new Error(msg);
    }
  },

  // Bank Accounts
  createBankAccount: async (walletId: string, payload: CreateBankAccountRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>(`/api/wallets/${walletId}/accounts`, payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar conta bancária.';
      throw new Error(msg);
    }
    return data.value;
  },

  updateBankAccount: async (walletId: string, accountId: string, payload: UpdateBankAccountRequest): Promise<void> => {
    const { data } = await apiClient.put<ApiResult<void>>(`/api/wallets/${walletId}/accounts/${accountId}`, payload);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar conta bancária.';
      throw new Error(msg);
    }
  },

  deleteBankAccount: async (walletId: string, accountId: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/wallets/${walletId}/accounts/${accountId}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover conta bancária.';
      throw new Error(msg);
    }
  },

  // Credit Cards
  createCreditCard: async (walletId: string, accountId: string, payload: CreateCreditCardRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>(`/api/wallets/${walletId}/accounts/${accountId}/cards`, payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar cartão de crédito.';
      throw new Error(msg);
    }
    return data.value;
  },

  deleteCreditCard: async (walletId: string, accountId: string, cardId: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/wallets/${walletId}/accounts/${accountId}/cards/${cardId}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover cartão de crédito.';
      throw new Error(msg);
    }
  }
};
