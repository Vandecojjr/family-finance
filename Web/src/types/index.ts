export interface Wallet {
    id: string;
    name: string;
    type: string;
    currentBalance: number;
    isShared: boolean;
    ownerId?: string;
    ownerName?: string;
}

export interface ApiResponse<T> {
    isSuccess: boolean;
    value: T;
    error?: {
        code: string;
        message: string;
    };
}
