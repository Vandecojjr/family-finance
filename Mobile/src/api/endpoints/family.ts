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
};
