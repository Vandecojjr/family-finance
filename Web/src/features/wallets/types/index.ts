export interface Wallet {
    id: string;
    name: string;
    type: string;
    currentBalance: number;
    isShared: boolean;
    ownerId?: string;
    ownerName?: string;
}
