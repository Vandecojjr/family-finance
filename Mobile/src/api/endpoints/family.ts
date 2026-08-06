import { apiClient } from '../client';
import { ApiResult } from '@/types';

export interface FamilyMemberResponse {
  id: string;
  name: string;
}

export interface FamilyResponse {
  id: string;
  name: string;
  isActive: boolean;
  timezone?: string;
  members: FamilyMemberResponse[];
}

export const familyApi = {
  getMyFamily: async (): Promise<FamilyResponse> => {
    try {
      const { data } = await apiClient.get<ApiResult<FamilyResponse>>('/api/families/my');
      if (!data.isSuccess || !data.value) {
        const msg = data.errors?.[0]?.description ?? 'Erro ao obter dados da família.';
        throw new Error(msg);
      }
      return data.value;
    } catch (error: any) {
      console.error('[familyApi] Error fetching my family:', error.message);
      throw error;
    }
  },

  addMember: async (familyId: string, name: string, email: string, password: string, roleName: string): Promise<string> => {
    try {
      const { data } = await apiClient.post<ApiResult<string>>(`/api/families/${familyId}/members`, { name, email, password, roleName });
      if (!data.isSuccess || !data.value) {
        const msg = data.errors?.[0]?.description ?? 'Erro ao adicionar membro à família.';
        throw new Error(msg);
      }
      return data.value;
    } catch (error: any) {
      console.error('[familyApi] Error adding family member:', error.message);
      throw error;
    }
  },

  updateTimezone: async (familyId: string, timezone: string): Promise<boolean> => {
    try {
      const { data } = await apiClient.put<ApiResult<boolean>>(`/api/families/${familyId}/timezone`, { timezone });
      if (!data.isSuccess) {
        const msg = data.errors?.[0]?.description ?? 'Erro ao atualizar o fuso horário.';
        throw new Error(msg);
      }
      return true;
    } catch (error: any) {
      console.error('[familyApi] Error updating family timezone:', error.message);
      throw error;
    }
  },
};
