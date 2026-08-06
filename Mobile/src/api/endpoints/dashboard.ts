import { apiClient } from '../client';
import { ApiResult, DashboardResponse } from '@/types';

export const dashboardApi = {
  getInitialDashboard: async (): Promise<DashboardResponse> => {
    const { data } = await apiClient.get<ApiResult<DashboardResponse>>('/api/dashboard');
    if (!data.isSuccess || !data.value) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao obter dados do dashboard.';
      throw new Error(msg);
    }
    return data.value;
  },
  
  getCalendarIndicators: async (month: string): Promise<any[]> => {
    // month format: "YYYY-MM"
    const { data } = await apiClient.get<ApiResult<any[]>>(`/api/dashboard/calendar-indicators?month=${month}`);
    if (!data.isSuccess) {
      const msg = data.errors?.[0]?.description ?? 'Erro ao buscar indicadores do calendário.';
      throw new Error(msg);
    }
    return data.value || [];
  },
};
