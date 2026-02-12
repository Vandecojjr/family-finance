import api from './api';
import { ApiResponse, Wallet } from '../types';

export const WalletService = {
    getMyWallets: async (): Promise<ApiResponse<Wallet[]>> => {
        const response = await api.get<ApiResponse<Wallet[]>>('/wallets');
        return response.data;
    },

    createWallet: async (data: { name: string; type: string }): Promise<ApiResponse<string>> => {
        const response = await api.post<ApiResponse<string>>('/wallets', data);
        return response.data;
    }
};
