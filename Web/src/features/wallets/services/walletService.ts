import api from '../../../services/api';
import { ApiResponse } from '../../../types';
import { Wallet, Account, Transaction } from '../types';

export const WalletService = {
    getMyWallets: async (): Promise<ApiResponse<Wallet[]>> => {
        const response = await api.get<ApiResponse<Wallet[]>>('personal/wallets');
        return response.data;
    },

    createWallet: async (data: { name: string; type: string; initialBalance: number }): Promise<ApiResponse<string>> => {
        const response = await api.post<ApiResponse<string>>('personal/wallets', data);
        return response.data;
    },

    getAccounts: async (walletId: string): Promise<ApiResponse<Account[]>> => {
        const response = await api.get<ApiResponse<Account[]>>(`personal/wallets/${walletId}/accounts`);
        return response.data;
    },

    createAccount: async (walletId: string, data: Partial<Account>): Promise<ApiResponse<string>> => {
        const response = await api.post<ApiResponse<string>>(`personal/wallets/${walletId}/accounts`, data);
        return response.data;
    },

    updateAccount: async (walletId: string, accountId: string, data: { name: string }): Promise<ApiResponse<void>> => {
        const response = await api.put<ApiResponse<void>>(`personal/wallets/${walletId}/accounts/${accountId}`, data);
        return response.data;
    },

    deleteAccount: async (walletId: string, accountId: string): Promise<ApiResponse<void>> => {
        const response = await api.delete<ApiResponse<void>>(`personal/wallets/${walletId}/accounts/${accountId}`);
        return response.data;
    },

    getTransactions: async (walletId: string, accountId: string): Promise<ApiResponse<Transaction[]>> => {
        const response = await api.get<ApiResponse<Transaction[]>>(`personal/wallets/${walletId}/accounts/${accountId}/transactions`);
        return response.data;
    },

    createTransaction: async (walletId: string, accountId: string, data: Partial<Transaction>): Promise<ApiResponse<string>> => {
        const response = await api.post<ApiResponse<string>>(`personal/wallets/${walletId}/accounts/${accountId}/transactions`, data);
        return response.data;
    },

    getRecentTransactions: async (limit: number = 50): Promise<ApiResponse<import('../types').RecentTransaction[]>> => {
        const response = await api.get<ApiResponse<import('../types').RecentTransaction[]>>(`personal/wallets/transactions/recent?limit=${limit}`);
        return response.data;
    }
};
