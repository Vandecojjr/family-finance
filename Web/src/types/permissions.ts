export enum Permission {
    // Family Management
    FamilyView = 'FamilyView',
    FamilyManage = 'FamilyManage',

    // Member Management
    MemberView = 'MemberView',
    MemberCreate = 'MemberCreate',
    MemberUpdate = 'MemberUpdate',
    MemberDelete = 'MemberDelete',

    // Wallet/Account Management
    WalletView = 'WalletView',
    WalletCreate = 'WalletCreate',
    WalletUpdate = 'WalletUpdate',
    WalletDelete = 'WalletDelete',

    // Transaction Management
    TransactionView = 'TransactionView',
    TransactionCreate = 'TransactionCreate',
    TransactionUpdate = 'TransactionUpdate',
    TransactionDelete = 'TransactionDelete',
}
