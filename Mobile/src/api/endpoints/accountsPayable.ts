import { apiClient } from '../client';
import { ApiResult, AccountsPayableDto } from '@/types';

export const accountsPayableApi = {
  getByMemberId: async (memberId: string, onlyDate: number = 2): Promise<AccountsPayableDto[]> => {
    // onlyDate: 1 = Week, 2 = Month, 3 = Year. Default is Month (2).
    const { data } = await apiClient.get<ApiResult<AccountsPayableDto[]>>(`/api/accountspayable/member/${memberId}?onlyDate=${onlyDate}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter contas a pagar.';
      throw new Error(msg);
    }
    return data.value;
  }
};
