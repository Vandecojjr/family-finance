import { apiClient } from '../client';
import { ApiResult, RecurringIncome, CreateRecurringIncomeRequest, UpdateRecurringIncomeRequest } from '@/types';

export const recurringIncomesApi = {
  getByMemberId: async (memberId: string): Promise<RecurringIncome[]> => {
    const { data } = await apiClient.get<ApiResult<RecurringIncome[]>>(`/api/recurringincomes/member/${memberId}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter ganhos recorrentes do membro.';
      throw new Error(msg);
    }
    return data.value;
  },

  create: async (payload: CreateRecurringIncomeRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/recurringincomes', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar ganho recorrente.';
      throw new Error(msg);
    }
    return data.value;
  },

  update: async (id: string, payload: UpdateRecurringIncomeRequest): Promise<void> => {
    const { data } = await apiClient.put<ApiResult<void>>(`/api/recurringincomes/${id}`, payload);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar ganho recorrente.';
      throw new Error(msg);
    }
  },

  getTotalFixedByMemberId: async (memberId: string): Promise<number> => {
    const { data } = await apiClient.get<ApiResult<number>>(`/api/recurringincomes/member/${memberId}/total-fixed`);
    if (!data.isSuccess || data.value === undefined) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter total de ganhos fixos.';
      throw new Error(msg);
    }
    return data.value;
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/recurringincomes/${id}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover ganho recorrente.';
      throw new Error(msg);
    }
  },
};
