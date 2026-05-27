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
  balance: number;
  type: string;
  memberId: string;
  currency: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  categoryId: string;
  walletId: string;
  date: string;
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
