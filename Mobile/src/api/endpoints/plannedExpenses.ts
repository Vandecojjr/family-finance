import { apiClient } from '../client';
import { ApiResult, PlannedExpense, CreatePlannedExpenseRequest, UpdatePlannedExpenseRequest } from '@/types';

export const plannedExpensesApi = {
  getByMemberId: async (memberId: string): Promise<PlannedExpense[]> => {
    const { data } = await apiClient.get<ApiResult<PlannedExpense[]>>(`/api/plannedexpenses/member/${memberId}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter gastos previstos do membro.';
      throw new Error(msg);
    }
    return data.value;
  },

  create: async (payload: CreatePlannedExpenseRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/plannedexpenses', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar gasto previsto.';
      throw new Error(msg);
    }
    return data.value;
  },

  update: async (id: string, payload: UpdatePlannedExpenseRequest): Promise<void> => {
    const { data } = await apiClient.put<ApiResult<void>>(`/api/plannedexpenses/${id}`, payload);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar gasto previsto.';
      throw new Error(msg);
    }
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/plannedexpenses/${id}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover gasto previsto.';
      throw new Error(msg);
    }
  },
};
