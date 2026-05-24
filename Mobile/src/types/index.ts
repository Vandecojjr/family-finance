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
