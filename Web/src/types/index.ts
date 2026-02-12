

export interface ApiResponse<T> {
    isSuccess: boolean;
    value: T;
    error?: {
        code: string;
        message: string;
    };
}
