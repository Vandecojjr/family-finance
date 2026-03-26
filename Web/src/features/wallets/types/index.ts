export interface Wallet {
    id: string;
    name: string;
    type: string;
    currentBalance: number;
    isShared: boolean;
    ownerId?: string;
    ownerName?: string;
}

export enum AccountType {
    Checking = 'Checking',
    Cash = 'Cash',
    Investment = 'Investment',
    Credit = 'Credit'
}

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    creditLimit?: number;
    closingDay?: number;
    dueDay?: number;
    availableLimit?: number;
    usedCredit?: number;
    walletId: string;
}

export enum TransactionType {
    Expense = 'Expense',
    Income = 'Income',
    Transfer = 'Transfer'
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
