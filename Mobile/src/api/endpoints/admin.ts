import { apiClient } from '../client';
import { ApiResult } from '@/types';

export interface CreateFamilyRequest {
  familyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export const adminApi = {
  createFamily: async (payload: CreateFamilyRequest): Promise<string> => {
    const { data } = await apiClient.post<ApiResult<string>>('/api/admin/families', payload);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao criar família.';
      throw new Error(msg);
    }
    return data.value; // Retorna o ID da nova família
  },
};
