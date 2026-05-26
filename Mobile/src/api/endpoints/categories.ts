import { apiClient } from '../client';
import { ApiResult } from '@/types';

export interface CategoryResponse {
  id: string;
  name: string;
  type: 'Income' | 'Expense'; // 'Income' (Ganho), 'Expense' (Gasto)
  familyId: string;
  parentId: string | null;
  subCategories: CategoryResponse[];
}

export interface CreateCategoryRequest {
  name: string;
  type: 'Income' | 'Expense';
  parentId: string | null;
}

export const categoriesApi = {
  list: async (): Promise<CategoryResponse[]> => {
    try {
      const { data } = await apiClient.get<ApiResult<CategoryResponse[]>>('/api/categories');
      if (!data.isSuccess || !data.value) {
        const msg = data.errors?.[0]?.description ?? 'Erro ao obter categorias.';
        throw new Error(msg);
      }
      return data.value;
    } catch (error: any) {
      console.error('[categoriesApi] Error listing categories:', error.message);
      throw error;
    }
  },

  create: async (payload: CreateCategoryRequest): Promise<string> => {
    try {
      const { data } = await apiClient.post<ApiResult<string>>('/api/categories', payload);
      if (!data.isSuccess || !data.value) {
        const msg = data.errors?.[0]?.description ?? 'Erro ao criar categoria.';
        throw new Error(msg);
      }
      return data.value;
    } catch (error: any) {
      console.error('[categoriesApi] Error creating category:', error.message);
      throw error;
    }
  },
};
