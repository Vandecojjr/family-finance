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
    
    // Recurring Expense Management
    RecurringExpenseView = 40,
    RecurringExpenseCreate = 41,
    RecurringExpenseUpdate = 42,
    RecurringExpenseDelete = 43,
    
    // Category Management
    CategoryView = 50,
    CategoryCreate = 51,
    
    // Recurring Income Management
    RecurringIncomeView = 60,
    RecurringIncomeCreate = 61,
    RecurringIncomeUpdate = 62,
    RecurringIncomeDelete = 63
}
