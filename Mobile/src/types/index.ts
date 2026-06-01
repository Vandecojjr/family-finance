// Tipos TypeScript espelhando os contratos do backend

export interface TokenPairResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface ApiResult<T> {
  isSuccess: boolean;
  value?: T;
  errors: ApiError[];
}

export interface ApiError {
  code: string;
  description: string;
  type: 'Failure' | 'Validation' | 'NotFound' | 'Conflict';
}

export interface Account {
  id: string;
  email: string;
  memberId: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface Member {
  id: string;
  name: string;
  cpf?: string;
  familyId: string;
}

export interface Wallet {
  id: string;
  name: string;
  cashBalance: number;
  familyId: string;
  accounts: BankAccount[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  type: number; // 1 = Checking, 5 = Savings
  debitBalance: number;
  creditLimit: number;
  remainingCreditLimit: number;
  usedCreditLimit: number;
  creditCards: CreditCard[];
}

export interface CreditCard {
  id: string;
  brand: string;
  lastFourDigits: string;
  totalLimit: number;
  remainingLimit: number;
  usedLimit: number;
}

export interface CreateWalletRequest {
  name: string;
  cashBalance: number;
}

export interface UpdateWalletRequest {
  name: string;
  cashBalance: number;
}

export interface CreateBankAccountRequest {
  bankName: string;
  type: number;
  debitBalance: number;
  creditLimit: number;
}

export interface UpdateBankAccountRequest {
  bankName: string;
  type: number;
  debitBalance: number;
  creditLimit: number;
}

export interface CreateCreditCardRequest {
  brand: string;
  lastFourDigits: string;
  totalLimit: number;
}


export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: number; // 1 = Income, 2 = Expense
  date: string;
  familyId: string;
  categoryId: string;
  categoryName: string;
  walletId: string | null;
  bankAccountId: string | null;
  creditCardId: string | null;
  walletName: string | null;
  bankAccountName: string | null;
  creditCardDisplayName: string | null;
  notes?: string;
}

export interface RegisterTransactionRequest {
  description: string;
  amount: number;
  type: number; // 1 = Income, 2 = Expense
  date: string;
  categoryId: string;
  walletId: string | null;
  bankAccountId: string | null;
  creditCardId: string | null;
  notes?: string;
}


export interface Category {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
  icon?: string;
  color?: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  type: number; // 1 = Fixed, 2 = Variable
  frequency: number; // 1 = Weekly, 2 = Monthly, 3 = Yearly
  dueDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  memberId: string;
  categoryId: string;
  categoryName: string;
  isPaid: boolean;
}

export interface CreateRecurringExpenseRequest {
  description: string;
  amount: number;
  type: number;
  frequency: number;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  memberId: string;
  categoryId: string;
}

export interface UpdateRecurringExpenseRequest {
  description: string;
  amount: number;
  type: number;
  frequency: number;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  categoryId: string;
}

export interface PayRecurringExpenseRequest {
  walletId: string;
  amount: number;
  bankAccountId?: string | null;
  creditCardId?: string | null;
  useCredit?: boolean | null;
}

export interface RecurringIncome {
  id: string;
  description: string;
  amount: number;
  type: number; // 1 = Fixed, 2 = Variable
  frequency: number; // 1 = Weekly, 2 = Monthly, 3 = Yearly
  dueDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  memberId: string;
  categoryId: string;
  categoryName: string;
}

export interface CreateRecurringIncomeRequest {
  description: string;
  amount: number;
  type: number;
  frequency: number;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  memberId: string;
  categoryId: string;
}

export interface UpdateRecurringIncomeRequest {
  description: string;
  amount: number;
  type: number;
  frequency: number;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  categoryId: string;
}

export interface PlannedIncome {
  id: string;
  description: string;
  amount: number;
  date: string;
  memberId: string;
  categoryId: string;
  categoryName: string;
}

export interface CreatePlannedIncomeRequest {
  description: string;
  amount: number;
  date: string;
  memberId: string;
  categoryId: string;
}

export interface UpdatePlannedIncomeRequest {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
}

export interface PlannedExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  memberId: string;
  categoryId: string;
  categoryName: string;
}

export interface CreatePlannedExpenseRequest {
  description: string;
  amount: number;
  date: string;
  memberId: string;
  categoryId: string;
}

export interface UpdatePlannedExpenseRequest {
  description: string;
  amount: number;
  date: string;
  categoryId: string;
}

export interface AccountsPayableDto {
  id: string;
  description: string;
  amount: number;
  frequency: number;
  categoryName: string;
  dueDay: number;
  isLate: boolean;
}

export interface DashboardGeneral {
  totalExpensed: number;
  totalIncomed: number;
  totalProjectedExpenditure: number;
  totalProjectedIncome: number;
  totalBalance: number;
  totalCreditLimit: number;
  totalCreditExpensed: number;
}

export interface DashboardResponse {
  general: DashboardGeneral;
}
