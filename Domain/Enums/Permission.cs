namespace Domain.Enums;

public enum Permission
{
    // Family Management
    FamilyView = 1,
    FamilyManage = 2,
    
    // Member Management
    MemberView = 10,
    MemberCreate = 11,
    MemberUpdate = 12,
    MemberDelete = 13,
    
    // Wallet/Account Management
    WalletView = 20,
    WalletCreate = 21,
    WalletUpdate = 22,
    WalletDelete = 23,
    
    // Transaction Management
    TransactionView = 30,
    TransactionCreate = 31,
    TransactionUpdate = 32,
    TransactionDelete = 33,
}
