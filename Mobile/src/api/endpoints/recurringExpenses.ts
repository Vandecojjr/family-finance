import { apiClient } from '../client';
import { ApiResult, RecurringExpense, CreateRecurringExpenseRequest, UpdateRecurringExpenseRequest } from '@/types';

export const recurringExpensesApi = {
  getByMemberId: async (memberId: string): Promise<RecurringExpense[]> => {
    const { data } = await apiClient.get<ApiResult<RecurringExpense[]>>(`/api/recurringexpenses/member/${memberId}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter gastos recorrentes do membro.';
      throw new Error(msg);
    }
    return data.value;
  },

  create: async (payload: CreateRecurringExpenseRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/recurringexpenses', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar gasto recorrente.';
      throw new Error(msg);
    }
    return data.value;
  },

  update: async (id: string, payload: UpdateRecurringExpenseRequest): Promise<void> => {
    const { data } = await apiClient.put<ApiResult<void>>(`/api/recurringexpenses/${id}`, payload);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar gasto recorrente.';
      throw new Error(msg);
    }
  },


  getTotalFixedByMemberId: async (memberId: string): Promise<number> => {
    const { data } = await apiClient.get<ApiResult<number>>(`/api/recurringexpenses/member/${memberId}/total-fixed`);
    if (!data.isSuccess || data.value === undefined) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter total de gastos fixos.';
      throw new Error(msg);
    }
    return data.value;
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/recurringexpenses/${id}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover gasto recorrente.';
      throw new Error(msg);
    }
  },
};
