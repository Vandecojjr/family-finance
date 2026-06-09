import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AccountsReceivableScreen from '../../app/(tabs)/accounts-receivable';
import { accountsReceivableApi } from '@/api/endpoints/accountsReceivable';
import { walletsApi } from '@/api/endpoints/wallets';
import { recurringIncomesApi } from '@/api/endpoints/recurringIncomes';
import { useAuthStore } from '@/stores/authStore';

// Mock the APIs
jest.mock('@/api/endpoints/accountsReceivable', () => ({
  accountsReceivableApi: {
    getByMemberId: jest.fn(),
  },
}));

jest.mock('@/api/endpoints/wallets', () => ({
  walletsApi: {
    list: jest.fn(),
  },
}));

jest.mock('@/api/endpoints/recurringIncomes', () => ({
  recurringIncomesApi: {
    receive: jest.fn(),
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

describe('AccountsReceivableScreen E2E flow mock test', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth store mock
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      tokens: { accessToken: 'fake-jwt-token' },
      isAuthenticated: true,
    });

    // Mock useQuery implementation
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'accountsReceivable') {
        return {
          data: [
            {
              id: 'income-123',
              description: 'Salário Mensal',
              amount: 5000.00,
              categoryName: 'Trabalho',
              frequency: 2, // Mensal
              dueDay: 5,
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
    (recurringIncomesApi.receive as jest.Mock).mockResolvedValue('transaction-abc');
  });

  it('should go through the entire Registrar Recebimento flow successfully', async () => {
    // 1. Render screen
    const { getByText, getAllByText, getByPlaceholderText, queryByText } = await render(<AccountsReceivableScreen />);

    // 2. Locate the pending account and tap it to open the Detail Modal
    const cardItem = getByText('Salário Mensal');
    expect(cardItem).toBeTruthy();
    await fireEvent.press(cardItem);

    // 3. Verify Detail Modal is displayed
    expect(getByText('Detalhes da Receita')).toBeTruthy();
    expect(getAllByText('Salário Mensal').length).toBeGreaterThan(1);
    
    // 4. Tap the "Receber" button inside Detail Modal
    const receberBtn = getByText('Receber');
    await fireEvent.press(receberBtn);

    // 5. Verify Receive Modal is opened ("Registrar Recebimento")
    expect(getByText('Registrar Recebimento')).toBeTruthy();

    // 6. Verify input shows the amount "5000"
    const amountInput = getByPlaceholderText('0.00');
    expect(amountInput.props.value).toBe('5000');

    // 7. Tap "Selecionar destino" to select a wallet or bank account
    const selectDestinoBtn = getByText('Selecionar destino');
    await fireEvent.press(selectDestinoBtn);

    // 8. Verify the Select Destination modal is opened
    expect(getByText('Selecione o Destino')).toBeTruthy();

    // 9. Tap "Nubank - Conta (R$ 2.000,00)" to select it
    const nubankAccountBtn = getByText('Nubank - Conta (R$ 2.000,00)');
    await fireEvent.press(nubankAccountBtn);

    // 10. Verify that it returned to the Receive modal and the selector text updated
    expect(getByText('Confirmar Recebimento')).toBeTruthy();

    // 11. Tap "Confirmar Recebimento"
    const confirmarBtn = getByText('Confirmar Recebimento');
    await fireEvent.press(confirmarBtn);

    // 12. Verify that recurringIncomesApi.receive was called with correct variables
    expect(recurringIncomesApi.receive).toHaveBeenCalledWith('income-123', {
      walletId: 'wallet-456',
      amount: 5000,
      bankAccountId: 'acc-789',
    });

    // 13. Verify that the cache queries were invalidated
    expect(mockInvalidateQueries).toHaveBeenCalled();

    // 14. Verify success Alert was triggered
    expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Recebimento registrado com sucesso!');
  });

  it('should show an error alert if the mutation API call fails', async () => {
    // Mock API failure
    const apiError = new Error('Falha na conexão com a API.');
    (recurringIncomesApi.receive as jest.Mock).mockRejectedValueOnce(apiError);

    // Render screen and advance to the Receive modal
    const { getByText, getByPlaceholderText } = await render(<AccountsReceivableScreen />);
    
    // Open details
    await fireEvent.press(getByText('Salário Mensal'));
    
    // Open receive form
    await fireEvent.press(getByText('Receber'));

    // Select Nubank account
    await fireEvent.press(getByText('Selecionar destino'));
    await fireEvent.press(getByText('Nubank - Conta (R$ 2.000,00)'));

    // Click confirm
    await fireEvent.press(getByText('Confirmar Recebimento'));

    // Verify error Alert is shown
    expect(recurringIncomesApi.receive).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Falha na conexão com a API.');
  });
});
