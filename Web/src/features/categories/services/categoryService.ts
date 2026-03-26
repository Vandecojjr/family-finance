import api from '../../../services/api';
import { ApiResponse } from '../../../types';
import { Category } from '../types';

export const CategoryService = {
    getCategories: async (): Promise<ApiResponse<Category[]>> => {
        const response = await api.get<ApiResponse<Category[]>>('categories');
        return response.data;
    },

    getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
        const response = await api.get<ApiResponse<Category>>(`categories/${id}`);
        return response.data;
    },

    createCategory: async (data: Partial<Category>): Promise<ApiResponse<string>> => {
        const response = await api.post<ApiResponse<string>>('categories', data);
        return response.data;
    },

    updateCategory: async (id: string, data: Partial<Category>): Promise<ApiResponse<void>> => {
        const response = await api.put<ApiResponse<void>>(`categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
        const response = await api.delete<ApiResponse<void>>(`categories/${id}`);
        return response.data;
    }
};
