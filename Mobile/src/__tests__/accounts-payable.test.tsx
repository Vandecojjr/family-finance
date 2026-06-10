import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AccountsPayableScreen from '../../app/(tabs)/accounts-payable';
import { accountsPayableApi } from '@/api/endpoints/accountsPayable';
import { walletsApi } from '@/api/endpoints/wallets';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { useAuthStore } from '@/stores/authStore';

// Mock the APIs
jest.mock('@/api/endpoints/accountsPayable', () => ({
  accountsPayableApi: {
    getByMemberId: jest.fn(),
  },
}));

jest.mock('@/api/endpoints/wallets', () => ({
  walletsApi: {
    list: jest.fn(),
  },
}));

jest.mock('@/api/endpoints/recurringExpenses', () => ({
  recurringExpensesApi: {
    pay: jest.fn(),
  },
}));

// Mock useAuthStore
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock @tanstack/react-query
const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

import { useQuery, useMutation } from '@tanstack/react-query';

describe('AccountsPayableScreen E2E flow mock test', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth store mock
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      tokens: { accessToken: 'fake-jwt-token' },
      isAuthenticated: true,
    });

    // Mock useQuery implementation
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'accountsPayable') {
        return {
          data: [
            {
              id: 'expense-123',
              description: 'Internet Fibra',
              amount: 150.00,
              categoryName: 'Serviços',
              frequency: 2, // Mensal
              dueDay: 10,
              isLate: false,
            },
          ],
          isLoading: false,
        };
      }
      if (queryKey[0] === 'wallets') {
        return {
          data: [
            {
              id: 'wallet-456',
              name: 'Carteira Principal',
              cashBalance: 1000.00,
              accounts: [
                {
                  id: 'acc-789',
                  bankName: 'Nubank',
                  debitBalance: 2000.00,
                  creditCards: [],
                },
              ],
            },
          ],
          isLoading: false,
        };
      }
      return { data: undefined, isLoading: false };
    });

    // Mock useMutation implementation
    (useMutation as jest.Mock).mockImplementation(({ mutationFn, onSuccess, onError }) => {
      return {
        mutate: async (variables: any) => {
          try {
            const res = await mutationFn(variables);
            if (onSuccess) onSuccess(res, variables, null);
          } catch (err) {
            if (onError) onError(err, variables, null);
          }
        },
        isPending: false,
      };
    });

    // Mock API implementations
    (recurringExpensesApi.pay as jest.Mock).mockResolvedValue('transaction-abc');
  });

  it('should go through the entire Registrar Pagamento flow successfully', async () => {
    // 1. Render screen
    const { getByText, getAllByText, getByPlaceholderText } = await render(<AccountsPayableScreen />);

    // 2. Locate the pending account and tap it to open the Detail Modal
    const cardItem = getByText('Internet Fibra');
    expect(cardItem).toBeTruthy();
    await fireEvent.press(cardItem);

    // 3. Verify Detail Modal is displayed
    expect(getByText('Detalhes da Conta')).toBeTruthy();
    expect(getAllByText('Internet Fibra').length).toBeGreaterThan(1);
    
    // 4. Tap the "Pagar" button inside Detail Modal
    const pagarBtn = getByText('Pagar');
    await fireEvent.press(pagarBtn);

    // 5. Verify Pay Modal is opened ("Registrar Pagamento")
    expect(getByText('Registrar Pagamento')).toBeTruthy();

    // 6. Verify input shows the amount "150"
    const amountInput = getByPlaceholderText('0.00');
    expect(amountInput.props.value).toBe('150');

    // 7. Tap "Selecionar fonte de pagamento" to select a wallet or bank account
    const selectDestinoBtn = getByText('Selecionar fonte de pagamento');
    await fireEvent.press(selectDestinoBtn);

    // 8. Verify the Select Destination modal is opened
    expect(getByText('Selecione a Fonte de Pagamento')).toBeTruthy();

    // 9. Tap "Nubank - Conta" to select it
    const nubankAccountBtn = getByText(/Nubank - Conta/);
    await fireEvent.press(nubankAccountBtn);

    // 10. Verify that it returned to the Pay modal and the selector text updated
    expect(getByText('Confirmar Pagamento')).toBeTruthy();

    // 11. Tap "Confirmar Pagamento"
    const confirmarBtn = getByText('Confirmar Pagamento');
    await fireEvent.press(confirmarBtn);

    // 12. Verify that recurringExpensesApi.pay was called with correct variables
    expect(recurringExpensesApi.pay).toHaveBeenCalledWith('expense-123', {
      walletId: 'wallet-456',
      amount: 150,
      bankAccountId: 'acc-789',
      creditCardId: null,
      useCredit: false,
    });

    // 13. Verify that the cache queries were invalidated
    expect(mockInvalidateQueries).toHaveBeenCalled();

    // 14. Verify success Alert was triggered
    expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Pagamento registrado com sucesso!');
  });

  it('should show an error alert if the mutation API call fails', async () => {
    // Mock API failure
    const apiError = new Error('Falha na conexão com a API.');
    (recurringExpensesApi.pay as jest.Mock).mockRejectedValueOnce(apiError);

    // Render screen and advance to the Pay modal
    const { getByText, getByPlaceholderText } = await render(<AccountsPayableScreen />);
    
    // Open details
    await fireEvent.press(getByText('Internet Fibra'));
    
    // Open pay form
    await fireEvent.press(getByText('Pagar'));

    // Select Nubank account
    await fireEvent.press(getByText('Selecionar fonte de pagamento'));
    await fireEvent.press(getByText(/Nubank - Conta/));

    // Click confirm
    await fireEvent.press(getByText('Confirmar Pagamento'));

    // Verify error Alert is shown
    expect(recurringExpensesApi.pay).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Falha na conexão com a API.');
  });
});
