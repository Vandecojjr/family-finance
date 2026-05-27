import { apiClient } from '../client';
import { ApiResult, Transaction, RegisterTransactionRequest } from '@/types';

export const transactionsApi = {
  list: async (): Promise<Transaction[]> => {
    const { data } = await apiClient.get<ApiResult<Transaction[]>>('/api/transactions');
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter transações.';
      throw new Error(msg);
    }
    return data.value;
  },

  register: async (payload: RegisterTransactionRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/transactions', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao registrar transação.';
      throw new Error(msg);
    }
    return data.value;
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/transactions/${id}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover transação.';
      throw new Error(msg);
    }
  }
};
