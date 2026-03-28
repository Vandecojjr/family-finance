export interface Wallet {
    id: string;
    name: string;
    type: string;
    currentBalance: number;
    isShared: boolean;
    ownerId?: string;
    ownerName?: string;
}

export interface Card {
    id: string;
    name: string;
    limit: number;
    usedLimit: number;
    closingDay: number;
    dueDay: number;
    accountId: string;
}

export interface Account {
    id: string;
    name: string;
    isDebit: boolean;
    isCredit: boolean;
    isInvestment: boolean;
    isCash: boolean;
    balance: number;
    investmentBalance: number;
    preApprovedCreditLimit: number;
    usedPreApprovedCredit: number;
    collateralCreditLimit: number;
    walletId: string;
    cards?: Card[];
}

export enum TransactionType {
    Expense = 'Expense',
    Income = 'Income',
    Transfer = 'Transfer',
    Investment = 'Investment',
    Redemption = 'Redemption'
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    accountId: string;
    categoryId: string;
    memberId: string;
    familyId: string;
    cardId?: string;
    isCredit: boolean;
    transferId?: string;
}

export interface RecentTransaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    accountName: string;
    walletName: string;
    categoryName: string;
}
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
