import { apiClient } from '../client';
import { ApiResult, PlannedIncome, CreatePlannedIncomeRequest, UpdatePlannedIncomeRequest } from '@/types';

export const plannedIncomesApi = {
  getByMemberId: async (memberId: string): Promise<PlannedIncome[]> => {
    const { data } = await apiClient.get<ApiResult<PlannedIncome[]>>(`/api/plannedincomes/member/${memberId}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter ganhos previstos do membro.';
      throw new Error(msg);
    }
    return data.value;
  },

  create: async (payload: CreatePlannedIncomeRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/plannedincomes', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar ganho previsto.';
      throw new Error(msg);
    }
    return data.value;
  },

  update: async (id: string, payload: UpdatePlannedIncomeRequest): Promise<void> => {
    const { data } = await apiClient.put<ApiResult<void>>(`/api/plannedincomes/${id}`, payload);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar ganho previsto.';
      throw new Error(msg);
    }
  },

  delete: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResult<void>>(`/api/plannedincomes/${id}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao remover ganho previsto.';
      throw new Error(msg);
    }
  },
};
