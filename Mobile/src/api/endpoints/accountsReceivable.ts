import { apiClient } from '../client';
import { ApiResult, AccountsReceivableDto } from '@/types';

export const accountsReceivableApi = {
  getByMemberId: async (memberId: string, onlyDate: number = 2): Promise<AccountsReceivableDto[]> => {
    const { data } = await apiClient.get<ApiResult<AccountsReceivableDto[]>>(`/api/accountsreceivable/member/${memberId}?onlyDate=${onlyDate}`);
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter contas a receber.';
      throw new Error(msg);
    }
    return data.value;
  },
};
