import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import DatePicker from '../../src/components/DatePicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { walletsApi } from '@/api/endpoints/wallets';
import { categoriesApi } from '@/api/endpoints/categories';
import { Wallet, BankAccount, CreditCard } from '@/types';
import { usePreferenceStore } from '@/stores/preferenceStore';
import { decodeJwt } from '@/utils/jwt';
import { DeleteWarningModal } from '@/components/DeleteWarningModal';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCurrencyInput = (value: string) => {
  const numStr = value.replace(/\D/g, '');
  if (!numStr) return '';
  const num = parseInt(numStr, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrencyValue = (val: string) => {
  if (!val) return 0;
  const numStr = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(numStr) || 0;
};
export default function WalletsScreen() {
  const queryClient = useQueryClient();
  const { isAuthenticated, tokens } = useAuthStore();
  const { showBalances, toggleBalances } = usePreferenceStore();

  const currentMemberId = tokens?.accessToken
    ? decodeJwt(tokens.accessToken)?.memberId ?? null
    : null;

  // Queries
  const { data: wallets = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['wallets', isAuthenticated],
    queryFn: () => walletsApi.list(),
    enabled: isAuthenticated,
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['categories', isAuthenticated],
    queryFn: () => categoriesApi.list(),
    enabled: isAuthenticated,
  });

  // Refetch data every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetch();
        refetchCategories();
      }
    }, [refetch, refetchCategories, isAuthenticated])
  );

  // Calculate Metrics
  const metrics = React.useMemo(() => {
    let totalCash = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    wallets.forEach((w) => {
      totalCash += w.cashBalance;
      w.accounts.forEach((acc) => {
        totalDebit += acc.debitBalance;
        totalCredit += acc.creditLimit;
        acc.creditCards.forEach((card) => {
          totalCredit += card.totalLimit;
        });
      });
    });

    return {
      totalCash,
      totalDebit,
      totalCredit,
      netWorth: totalCash + totalDebit,
    };
  }, [wallets]);

  // Wallet Collapse/Expand State
  const [collapsedWallets, setCollapsedWallets] = useState<Record<string, boolean>>({});

  const toggleWalletCollapse = (walletId: string) => {
    setCollapsedWallets((prev) => ({
      ...prev,
      [walletId]: !prev[walletId],
    }));
  };

  // BankAccount Collapse/Expand State (for credit cards list)
  const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({});

  const toggleAccountCollapse = (accountId: string) => {
    setCollapsedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  // Wallet Modal State
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletForm, setWalletForm] = useState<{ id?: string; name: string; cashBalance: string }>({
    name: '',
    cashBalance: '',
  });

  // BankAccount Modal State
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<{
    walletId: string;
    id?: string;
    bankName: string;
    type: number;
    debitBalance: string;
    creditLimit: string;
  }>({
    walletId: '',
    bankName: '',
    type: 1, // Checking
    debitBalance: '',
    creditLimit: '',
  });

  // CreditCard Modal State
  const [cardModalOpen, setCardModalOpen] = useState(false); // State for Credit Card Form
  const [showDatePickerForInvoice, setShowDatePickerForInvoice] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<{
    walletId: string;
    accountId: string;
    brand: string;
    lastFourDigits: string;
    availableLimit: string;
    dueDay: string;
    categoryId: string;
    invoices: Array<{ id: string; dueDate: string; amount: string }>;
  }>({
    walletId: '',
    accountId: '',
    brand: '',
    lastFourDigits: '',
    totalLimit: '',
    availableLimit: '',
    dueDay: '10',
    categoryId: '',
    invoices: [],
  });

  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  // Expanded Card State
  const [expandedCard, setExpandedCard] = useState<CreditCard | null>(null);
  const [expandedInvoiceTab, setExpandedInvoiceTab] = useState<'open' | 'paid'>('open');

  // Delete Warning Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const openDeleteModal = (title: string, description: string, onConfirm: () => void) => {
    setDeleteModalConfig({ title, description, onConfirm });
    setDeleteModalVisible(true);
  };

  // --- Mutations ---

  // Wallet Mutations
  const walletSaveMutation = useMutation({
    mutationFn: async () => {
      const parsedBalance = parseCurrencyValue(walletForm.cashBalance);
      if (!walletForm.name.trim()) throw new Error('Nome da carteira é obrigatório.');
      if (isNaN(parsedBalance) || parsedBalance < 0) throw new Error('Saldo em dinheiro deve ser maior ou igual a zero.');

      if (walletForm.id) {
        await walletsApi.update(walletForm.id, {
          name: walletForm.name,
          cashBalance: parsedBalance,
        });
      } else {
        await walletsApi.create({
          name: walletForm.name,
          InitialCashBalance: parsedBalance,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setWalletModalOpen(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro ao salvar carteira', err.message);
    },
  });

  const walletDeleteMutation = useMutation({
    mutationFn: (id: string) => walletsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setDeleteModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir carteira', err.message);
      setDeleteModalVisible(false);
    },
  });

  // BankAccount Mutations
  const accountSaveMutation = useMutation({
    mutationFn: async () => {
      const parsedDebit = parseCurrencyValue(accountForm.debitBalance);
      const parsedCredit = parseCurrencyValue(accountForm.creditLimit);

      if (!accountForm.bankName.trim()) throw new Error('Nome do banco é obrigatório.');
      if (isNaN(parsedDebit)) throw new Error('Saldo de débito é inválido.');
      if (isNaN(parsedCredit) || parsedCredit < 0) throw new Error('Limite de crédito deve ser maior ou igual a zero.');

      const payload = {
        bankName: accountForm.bankName,
        type: accountForm.type,
        debitBalance: parsedDebit,
        creditLimit: parsedCredit,
      };

      if (accountForm.id) {
        await walletsApi.updateBankAccount(accountForm.walletId, accountForm.id, payload);
      } else {
        await walletsApi.createBankAccount(accountForm.walletId, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setAccountModalOpen(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro ao salvar conta bancária', err.message);
    },
  });

  const accountDeleteMutation = useMutation({
    mutationFn: ({ walletId, accountId }: { walletId: string; accountId: string }) =>
      walletsApi.deleteBankAccount(walletId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setDeleteModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir conta', err.message);
      setDeleteModalVisible(false);
    },
  });

  // CreditCard Mutations
  const cardSaveMutation = useMutation({
    mutationFn: async (payload: {
      walletId: string,
      accountId: string,
      data: {
        brand: string;
        lastFourDigits: string;
        totalLimit: number;
        availableLimit: number;
        dueDay: number;
        categoryId: string;
        invoices?: any[];
      }
    }) => {
      await walletsApi.createCreditCard(payload.walletId, payload.accountId, payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setCardModalOpen(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro ao criar cartão de crédito', err.message);
    },
  });

  const cardDeleteMutation = useMutation({
    mutationFn: ({ walletId, accountId, cardId }: { walletId: string; accountId: string; cardId: string }) =>
      walletsApi.deleteCreditCard(walletId, accountId, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setDeleteModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir cartão de crédito', err.message);
      setDeleteModalVisible(false);
    },
  });

  // --- Handlers ---
  const handleCardSave = () => {
    const parsedLimit = parseCurrencyValue(cardForm.totalLimit);
    const parsedAvailableLimit = parseCurrencyValue(cardForm.availableLimit);
    const parsedDueDay = parseInt(cardForm.dueDay, 10);

    if (!cardForm.brand?.trim()) return Alert.alert('Validação', 'A bandeira do cartão é obrigatória.');
    if (!cardForm.lastFourDigits || cardForm.lastFourDigits.length !== 4 || isNaN(parseInt(cardForm.lastFourDigits, 10))) {
      return Alert.alert('Validação', 'Os últimos 4 dígitos devem conter exatamente 4 números.');
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) return Alert.alert('Validação', 'O limite total deve ser maior que zero.');
    if (isNaN(parsedAvailableLimit) || parsedAvailableLimit < 0) return Alert.alert('Validação', 'O limite disponível deve ser maior ou igual a zero.');
    if (parsedAvailableLimit > parsedLimit) return Alert.alert('Validação', 'O limite disponível não pode ser maior que o limite total.');
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) return Alert.alert('Validação', 'O dia de vencimento deve ser entre 1 e 31.');
    if (!cardForm.categoryId) return Alert.alert('Validação', 'A categoria para as faturas é obrigatória.');

    const usedLimit = parsedLimit - parsedAvailableLimit;
    let invoicesPayload: any[] | undefined = undefined;

    if (usedLimit > 0) {
      if (!cardForm.invoices || cardForm.invoices.length === 0) {
        return Alert.alert('Validação', 'Como existe limite comprometido, adicione as faturas correspondentes.');
      }
      
      try {
        invoicesPayload = cardForm.invoices.map(inv => {
          const amount = parseCurrencyValue(inv.amount);
          if (isNaN(amount) || amount <= 0) throw new Error('Existem faturas com valores inválidos.');
          if (!inv.dueDate) throw new Error('A data de vencimento da fatura é obrigatória.');
          return { dueDate: new Date(inv.dueDate + 'T00:00:00').toISOString(), amount };
        });
      } catch (err: any) {
        return Alert.alert('Validação', err.message);
      }

      const totalInvoices = invoicesPayload.reduce((acc, inv) => acc + inv.amount, 0);
      if (Math.abs(totalInvoices - usedLimit) > 0.01) {
        return Alert.alert('Validação', `A soma das faturas não corresponde ao limite comprometido.`);
      }
    }

    cardSaveMutation.mutate({
      walletId: cardForm.walletId,
      accountId: cardForm.accountId,
      data: {
        brand: cardForm.brand,
        lastFourDigits: cardForm.lastFourDigits,
        totalLimit: parsedLimit,
        availableLimit: parsedAvailableLimit,
        dueDay: parsedDueDay,
        categoryId: cardForm.categoryId,
        invoices: invoicesPayload,
      }
    });
  };
  const handleOpenWalletModal = (w?: Wallet) => {
    if (w) {
      setWalletForm({
        id: w.id,
        name: w.name,
        cashBalance: w.cashBalance.toString(),
      });
    } else {
      setWalletForm({
        name: '',
        cashBalance: '0',
      });
    }
    setWalletModalOpen(true);
  };

  const handleConfirmDeleteWallet = (w: Wallet) => {
    openDeleteModal(
      'Confirmar Exclusão',
      `Deseja realmente remover a carteira "${w.name}"? Isso também excluirá todas as suas contas e cartões associados.`,
      () => walletDeleteMutation.mutate(w.id)
    );
  };

  const handleOpenAccountModal = (walletId: string, acc?: BankAccount) => {
    if (acc) {
      setAccountForm({
        walletId,
        id: acc.id,
        bankName: acc.bankName,
        type: acc.type,
        debitBalance: acc.debitBalance.toString(),
        creditLimit: acc.creditLimit.toString(),
      });
    } else {
      setAccountForm({
        walletId,
        bankName: '',
        type: 1, // Checking
        debitBalance: '0',
        creditLimit: '0',
      });
    }
    setAccountModalOpen(true);
  };

  const handleConfirmDeleteAccount = (walletId: string, acc: BankAccount) => {
    openDeleteModal(
      'Confirmar Exclusão',
      `Deseja realmente remover a conta "${acc.bankName}"?`,
      () => accountDeleteMutation.mutate({ walletId, accountId: acc.id })
    );
  };

  const handleOpenCardModal = (walletId: string, accountId: string) => {
    setCardForm({
      walletId,
      accountId,
      brand: '',
      lastFourDigits: '',
      totalLimit: '0',
      availableLimit: '0',
      dueDay: '10',
      categoryId: '',
      invoices: [],
    });
    setCardModalOpen(true);
  };

  const handleConfirmDeleteCard = (walletId: string, accountId: string, card: CreditCard) => {
    openDeleteModal(
      'Confirmar Exclusão',
      `Deseja remover o cartão final ${card.lastFourDigits} (${card.brand})?`,
      () => cardDeleteMutation.mutate({ walletId, accountId, cardId: card.id })
    );
  };

  // Helper to determine credit card colors based on brand name
  const getCardGradient = (brand: string): [string, string] => {
    const b = brand.toLowerCase();
    if (b.includes('nubank') || b.includes('roxo') || b.includes('nu')) return ['#8a05be', '#4c006a'];
    if (b.includes('inter') || b.includes('laranja')) return ['#ff9000', '#b85f00'];
    if (b.includes('black') || b.includes('mastercard')) return ['#2d2d30', '#0a0a0b'];
    if (b.includes('gold') || b.includes('visa') || b.includes('ouro')) return ['#d4af37', '#8c6b00'];
    if (b.includes('bb') || b.includes('brasil')) return ['#ffd400', '#003399'];
    if (b.includes('bradesco')) return ['#cc092f', '#770014'];
    if (b.includes('santander')) return ['#ec0000', '#880000'];
    return ['#1e1e35', '#131325']; // Default dark premium gradient
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Finanças</Text>
          <Text style={styles.subtitle}>Gerencie suas carteiras e contas</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleBalances} style={styles.toggleBalancesBtn}>
            <Ionicons 
              name={showBalances ? 'eye-outline' : 'eye-off-outline'} 
              size={22} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenWalletModal()}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Carregando carteiras...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>Erro ao carregar carteiras da família.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : wallets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyText}>Nenhuma carteira cadastrada.</Text>
          <Text style={styles.emptySubText}>Crie sua primeira carteira para começar a organizar as finanças da sua família.</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => handleOpenWalletModal()}>
            <Text style={styles.createBtnText}>Criar Carteira</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Patrimonio Líquido Header */}
          <View style={styles.patrimonioHeaderContainer}>
            <Text style={styles.patrimonioLabel}>Patrimônio Líquido Geral</Text>
            <Text style={styles.patrimonioValue}>
              {showBalances ? fmt(metrics.netWorth) : 'R$ ••••••'}
            </Text>
            
            <View style={styles.patrimonioSummaryRow}>
              <View style={styles.patrimonioSummaryItem}>
                <Text style={styles.patrimonioSummaryLabel}>Dinheiro Vivo</Text>
                <Text style={styles.patrimonioSummaryValue}>
                  {showBalances ? fmt(metrics.totalCash) : 'R$ ••••••'}
                </Text>
              </View>
              <View style={styles.patrimonioSummaryDivider} />
              <View style={styles.patrimonioSummaryItem}>
                <Text style={styles.patrimonioSummaryLabel}>Contas</Text>
                <Text style={styles.patrimonioSummaryValue}>
                  {showBalances ? fmt(metrics.totalDebit) : 'R$ ••••••'}
                </Text>
              </View>
              <View style={styles.patrimonioSummaryDivider} />
              <View style={styles.patrimonioSummaryItem}>
                <Text style={styles.patrimonioSummaryLabel}>Créditos</Text>
                <Text style={styles.patrimonioSummaryValue}>
                  {showBalances ? fmt(metrics.totalCredit) : 'R$ ••••••'}
                </Text>
              </View>
            </View>
          </View>



          {/* List of Wallets */}
          {wallets.map((w) => {
            const isCollapsed = collapsedWallets[w.id];
            return (
              <View key={w.id} style={styles.walletGroup}>
                {/* Wallet Header Card */}
                <View style={styles.walletHeader}>
                  <TouchableOpacity 
                    style={styles.walletHeaderLeft}
                    onPress={() => toggleWalletCollapse(w.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient 
                      colors={['rgba(124, 106, 255, 0.2)', 'rgba(94, 79, 255, 0.08)']} 
                      style={styles.walletIconContainer}
                    >
                      <Ionicons name="wallet-sharp" size={18} color={colors.brand.primary} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.walletName}>{w.name}</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10, color: colors.text.secondary }}>{w.memberName}</Text>
                        </View>
                        <Ionicons 
                          name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
                          size={14} 
                          color={colors.text.secondary} 
                        />
                      </View>
                      <Text style={styles.walletCash}>
                        Dinheiro físico: <Text style={styles.walletCashValue}>
                          {showBalances ? fmt(w.cashBalance) : 'R$ ••••••'}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.walletActions}>
                    {currentMemberId === w.memberId && (
                      <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleOpenWalletModal(w)}>
                        <Ionicons name="pencil-sharp" size={13} color={colors.text.secondary} />
                      </TouchableOpacity>
                    )}
                    {currentMemberId === w.memberId && (
                      <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleConfirmDeleteWallet(w)}>
                        <Ionicons name="trash-sharp" size={13} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Accounts & Cards section */}
                {!isCollapsed && (
                  <View style={styles.accountsSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionHeaderTitle}>Contas e Cartões</Text>
                      {currentMemberId === w.memberId && (
                        <TouchableOpacity
                          style={styles.addAccountLink}
                          onPress={() => handleOpenAccountModal(w.id)}
                        >
                          <Ionicons name="add-circle" size={16} color={colors.brand.teal} />
                          <Text style={styles.addAccountLinkText}>Nova Conta</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {w.accounts.length === 0 ? (
                      <View style={styles.emptyAccountsBox}>
                        <Ionicons name="card-outline" size={24} color={colors.text.muted} />
                        <Text style={styles.noAccountsText}>Nenhuma conta cadastrada</Text>
                      </View>
                    ) : (
                      w.accounts.map((acc) => {
                        const hasCards = acc.creditCards && acc.creditCards.length > 0;
                        const isAccountCollapsed = collapsedAccounts[acc.id];
                        return (
                          <View key={acc.id} style={styles.accountRowContainer}>
                            {/* Account details card - redesigned to be clean, modern, and space-saving */}
                            <View style={styles.accountCard}>
                              <TouchableOpacity 
                                style={styles.accountMainInfo}
                                onPress={hasCards ? () => toggleAccountCollapse(acc.id) : undefined}
                                activeOpacity={hasCards ? 0.7 : 1}
                              >
                                <View 
                                  style={[
                                    styles.bankAvatar, 
                                    { backgroundColor: acc.type === 5 ? 'rgba(0, 212, 170, 0.08)' : 'rgba(124, 106, 255, 0.08)' }
                                  ]}
                                >
                                  <Ionicons
                                    name={acc.type === 5 ? 'save-outline' : 'business-outline'}
                                    size={14}
                                    color={acc.type === 5 ? colors.brand.teal : colors.brand.primary}
                                  />
                                </View>
                                <View style={styles.accountDetails}>
                                  <View style={styles.bankNameRow}>
                                    <Text style={styles.bankNameText}>{acc.bankName}</Text>
                                    <View
                                      style={[
                                        styles.typeBadge,
                                        {
                                          backgroundColor:
                                            acc.type === 5
                                              ? 'rgba(0, 212, 170, 0.1)'
                                              : 'rgba(124, 106, 255, 0.1)',
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.typeBadgeText,
                                          { color: acc.type === 5 ? colors.brand.teal : colors.brand.primary },
                                        ]}
                                      >
                                        {acc.type === 5 ? 'Poupança' : 'Corrente'}
                                      </Text>
                                    </View>
                                    {hasCards && (
                                      <Ionicons 
                                        name={isAccountCollapsed ? 'chevron-down' : 'chevron-up'} 
                                        size={14} 
                                        color={colors.text.secondary} 
                                        style={{ marginLeft: 2 }}
                                      />
                                    )}
                                  </View>
                                  <Text style={styles.accountBalanceText}>
                                    Saldo: <Text style={styles.boldText}>
                                      {showBalances ? fmt(acc.debitBalance) : 'R$ ••••••'}
                                    </Text>
                                  </Text>
                                  {acc.creditLimit > 0 && (
                                    <Text style={styles.accountLimitText}>
                                      Crédito: <Text style={styles.boldText}>
                                        {showBalances ? fmt(acc.remainingCreditLimit ?? acc.creditLimit) : 'R$ ••••••'}
                                      </Text>
                                      <Text style={{ fontSize: 10, color: colors.text.muted }}>
                                        {' '}
                                        (Utilizado:{' '}
                                        {showBalances ? fmt(acc.usedCreditLimit ?? 0) : 'R$ ••••••'} de{' '}
                                        {showBalances ? fmt(acc.creditLimit) : 'R$ ••••••'})
                                      </Text>
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                              {currentMemberId === w.memberId && (
                                <View style={styles.accountActionsGroup}>
                                  <TouchableOpacity
                                    style={[styles.accountActionCircle, { borderColor: 'rgba(0, 212, 170, 0.25)', backgroundColor: 'rgba(0, 212, 170, 0.05)' }]}
                                    onPress={() => handleOpenCardModal(w.id, acc.id)}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons name="card-outline" size={12} color={colors.brand.teal} />
                                  </TouchableOpacity>
  
                                  <TouchableOpacity
                                    style={styles.accountActionCircle}
                                    onPress={() => handleOpenAccountModal(w.id, acc)}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons name="pencil-sharp" size={12} color={colors.text.secondary} />
                                  </TouchableOpacity>
  
                                  <TouchableOpacity
                                    style={styles.accountActionCircle}
                                    onPress={() => handleConfirmDeleteAccount(w.id, acc)}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons name="trash-sharp" size={12} color={colors.danger} />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
 
                            {/* Credit Cards list - horizontal carousel */}
                            {hasCards && !isAccountCollapsed && (
                              <View style={styles.cardsCarouselContainer}>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  contentContainerStyle={styles.cardsScrollContent}
                                >
                                  {acc.creditCards.map((card) => (
                                    <TouchableOpacity 
                                      key={card.id}
                                      activeOpacity={0.9} 
                                      onPress={() => setExpandedCard(card)}
                                    >
                                      <LinearGradient
                                        colors={getCardGradient(card.brand)}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.creditCardMini}
                                      >
                                        <View style={styles.cardGlossyShine} />
                                        
                                        <View style={styles.miniCardHeader}>
                                          <View style={styles.miniCardBrandRow}>
                                            <Ionicons name="card" size={14} color="rgba(255, 255, 255, 0.7)" />
                                            <Text style={styles.miniCardBrandText}>{card.brand.toUpperCase()}</Text>
                                          </View>
                                          {currentMemberId === w.memberId && (
                                            <TouchableOpacity
                                              style={styles.cardDeleteBtnGlass}
                                              onPress={() => handleConfirmDeleteCard(w.id, acc.id, card)}
                                            >
                                              <Ionicons name="trash-sharp" size={11} color="rgba(255, 255, 255, 0.95)" />
                                            </TouchableOpacity>
                                          )}
                                        </View>
  
                                        <View style={styles.miniCardBody}>
                                          <View style={styles.miniCardChip}>
                                            <View style={styles.miniCardChipLine} />
                                          </View>
                                          <Ionicons name="wifi-sharp" size={14} color="rgba(255,255,255,0.4)" style={styles.cardWifiIcon} />
                                        </View>
                                        <View style={styles.miniCardFooter}>
                                          <View style={{ flex: 1, gap: 6 }}>
                                            <Text style={styles.miniCardNumbers}>
                                              ••••  ••••  ••••  {card.lastFourDigits}
                                            </Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <View style={{ flex: 1, paddingRight: 4 }}>
                                                <Text style={styles.miniCardLabel}>Disponível</Text>
                                                <Text style={styles.miniCardValue} numberOfLines={1} adjustsFontSizeToFit>
                                                  {showBalances ? fmt(card.remainingLimit) : 'R$ •••'}
                                                </Text>
                                              </View>
                                              <View style={{ flex: 1, paddingRight: 4 }}>
                                                <Text style={styles.miniCardLabel}>Utilizado</Text>
                                                <Text style={[styles.miniCardValue, { fontSize: 10, color: 'rgba(255, 255, 255, 0.85)' }]} numberOfLines={1} adjustsFontSizeToFit>
                                                  {showBalances ? fmt(card.usedLimit ?? 0) : 'R$ •••'}
                                                </Text>
                                              </View>
                                              <View style={{ flex: 1 }}>
                                                <Text style={styles.miniCardLabel}>Limite</Text>
                                                <Text style={[styles.miniCardValue, { fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' }]} numberOfLines={1} adjustsFontSizeToFit>
                                                  {showBalances ? fmt(card.totalLimit) : 'R$ •••'}
                                                </Text>
                                              </View>
                                            </View>
                                          </View>
                                        </View>
                                      </LinearGradient>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* --- Wallet CRUD Modal --- */}
      <Modal visible={walletModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {walletForm.id ? 'Editar Carteira' : 'Nova Carteira'}
              </Text>
              <TouchableOpacity onPress={() => setWalletModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da Carteira</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Contas da Família, Dinheiro Reserva"
                placeholderTextColor={colors.text.muted}
                value={walletForm.name}
                onChangeText={(text) => setWalletForm({ ...walletForm, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Saldo Físico (Dinheiro em Mãos)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
                value={walletForm.cashBalance}
                onChangeText={(text) => setWalletForm({ ...walletForm, cashBalance: formatCurrencyInput(text) })}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => walletSaveMutation.mutate()}
              disabled={walletSaveMutation.isPending}
            >
              {walletSaveMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Salvar Carteira</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- BankAccount CRUD Modal --- */}
      <Modal visible={accountModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {accountForm.id ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
              </Text>
              <TouchableOpacity onPress={() => setAccountModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Banco</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Nubank, Itaú, BB"
                placeholderTextColor={colors.text.muted}
                value={accountForm.bankName}
                onChangeText={(text) => setAccountForm({ ...accountForm, bankName: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Conta</Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabBtn, accountForm.type === 1 && styles.tabBtnActive]}
                  onPress={() => setAccountForm({ ...accountForm, type: 1 })}
                >
                  <Text style={[styles.tabBtnText, accountForm.type === 1 && styles.tabBtnTextActive]}>
                    Corrente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, accountForm.type === 5 && styles.tabBtnActive]}
                  onPress={() => setAccountForm({ ...accountForm, type: 5 })}
                >
                  <Text style={[styles.tabBtnText, accountForm.type === 5 && styles.tabBtnTextActive]}>
                    Poupança
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Saldo em Débito</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  value={accountForm.debitBalance}
                  onChangeText={(text) => setAccountForm({ ...accountForm, debitBalance: formatCurrencyInput(text) })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>Limite de Crédito</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  value={accountForm.creditLimit}
                  onChangeText={(text) => setAccountForm({ ...accountForm, creditLimit: formatCurrencyInput(text) })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.brand.teal }]}
              onPress={() => accountSaveMutation.mutate()}
              disabled={accountSaveMutation.isPending}
            >
              {accountSaveMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Salvar Conta</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- CreditCard Create Modal --- */}
      <Modal visible={cardModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Cartão de Crédito</Text>
              <TouchableOpacity onPress={() => setCardModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl, paddingHorizontal: 2 }}>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bandeira / Nome do Cartão</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Visa Gold, Mastercard Black"
                placeholderTextColor={colors.text.muted}
                value={cardForm.brand}
                onChangeText={(text) => setCardForm({ ...cardForm, brand: text })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Últimos 4 Dígitos</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  maxLength={4}
                  value={cardForm.lastFourDigits}
                  onChangeText={(text) => setCardForm({ ...cardForm, lastFourDigits: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>Limite Total</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  value={cardForm.totalLimit}
                  onChangeText={(text) => setCardForm({ ...cardForm, totalLimit: formatCurrencyInput(text) })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>Limite Disponível</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  value={cardForm.availableLimit}
                  onChangeText={(text) => setCardForm({ ...cardForm, availableLimit: formatCurrencyInput(text) })}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Dia de Vencimento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={cardForm.dueDay}
                  onChangeText={(text) => setCardForm({ ...cardForm, dueDay: text.replace(/\D/g, '') })}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Categoria para as Faturas</Text>
                <TouchableOpacity 
                  style={styles.input} 
                  onPress={() => setIsCategoryPickerOpen(true)}
                >
                  <Text style={{ color: cardForm.categoryId ? colors.text.primary : colors.text.muted }}>
                    {(() => {
                      if (!cardForm.categoryId) return "Selecione uma categoria...";
                      for (const p of categories) {
                        if (p.id === cardForm.categoryId) return p.name;
                        if (p.subCategories) {
                          const sub = p.subCategories.find(s => s.id === cardForm.categoryId);
                          if (sub) return sub.name;
                        }
                      }
                      return "Categoria Selecionada";
                    })()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {(() => {
              const parsedLimit = parseCurrencyValue(cardForm.totalLimit) || 0;
              const parsedAvailable = parseCurrencyValue(cardForm.availableLimit) || 0;
              const usedLimit = parsedLimit - parsedAvailable;

              if (usedLimit > 0) {
                const totalInvoices = cardForm.invoices.reduce((acc, inv) => acc + (parseCurrencyValue(inv.amount) || 0), 0);
                const remainingToDistribute = usedLimit - totalInvoices;
                const isExact = Math.abs(remainingToDistribute) < 0.01;

                return (
                  <View style={{ marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: spacing.xs }}>
                      Faturas Pendentes (Limite Comprometido)
                    </Text>
                    <Text style={{ color: colors.text.muted, fontSize: 12, marginBottom: spacing.md }}>
                      Você possui {fmt(usedLimit)} de limite comprometido. Adicione as faturas em aberto.
                    </Text>

                    {cardForm.invoices.map((inv, index) => (
                      <View key={inv.id} style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' }}>
                        <View style={{ flex: 2 }}>
                          <TouchableOpacity 
                            style={[styles.input, { paddingVertical: 12, justifyContent: 'center' }]} 
                            onPress={() => setShowDatePickerForInvoice(inv.id)}
                          >
                            <Text style={{ color: inv.dueDate ? colors.text.primary : colors.text.muted }}>
                              {inv.dueDate 
                                ? inv.dueDate.split('-').reverse().join('/') 
                                : 'Vencimento'}
                            </Text>
                          </TouchableOpacity>

                          <DatePicker
                            visible={showDatePickerForInvoice === inv.id}
                            value={inv.dueDate}
                            onClose={() => setShowDatePickerForInvoice(null)}
                            onSelect={(date: string) => {
                              const newInvoices = [...cardForm.invoices];
                              newInvoices[index].dueDate = date;
                              setCardForm({ ...cardForm, invoices: newInvoices });
                              setShowDatePickerForInvoice(null);
                            }}
                            title="Vencimento da Fatura"
                            accentColor={colors.brand.primary}
                          />
                        </View>
                        <View style={{ flex: 2 }}>
                          <TextInput
                            style={[styles.input, { paddingVertical: 8 }]}
                            placeholder="Valor"
                            placeholderTextColor={colors.text.muted}
                            keyboardType="decimal-pad"
                            value={inv.amount}
                            onChangeText={(text) => {
                              const newInvoices = [...cardForm.invoices];
                              newInvoices[index].amount = formatCurrencyInput(text);
                              setCardForm({ ...cardForm, invoices: newInvoices });
                            }}
                          />
                        </View>
                        <TouchableOpacity 
                          onPress={() => {
                            const newInvoices = cardForm.invoices.filter((_, i) => i !== index);
                            setCardForm({ ...cardForm, invoices: newInvoices });
                          }}
                          style={{ padding: spacing.sm, justifyContent: 'center' }}
                        >
                          <Ionicons name="trash-outline" size={20} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                      <TouchableOpacity 
                        style={styles.addInvoiceButton}
                        onPress={() => {
                          const parsedDay = parseInt(cardForm.dueDay, 10);
                          const validDay = !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31 ? parsedDay : 10;
                          
                          let suggestedDate = '';
                          if (cardForm.invoices.length === 0) {
                            // First invoice: current or next month
                            const now = new Date();
                            let year = now.getFullYear();
                            let month = now.getMonth(); // 0-11
                            
                            if (now.getDate() > validDay) {
                              month++;
                              if (month > 11) {
                                month = 0;
                                year++;
                              }
                            }
                            suggestedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
                          } else {
                            // Next invoice: +1 month from the last invoice
                            const lastInvoiceDate = cardForm.invoices[cardForm.invoices.length - 1].dueDate;
                            if (lastInvoiceDate) {
                              const [lastYear, lastMonth, lastDay] = lastInvoiceDate.split('-').map(Number);
                              let nextMonth = lastMonth + 1; // 1-12
                              let nextYear = lastYear;
                              if (nextMonth > 12) {
                                nextMonth = 1;
                                nextYear++;
                              }
                              suggestedDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
                            } else {
                              const now = new Date();
                              suggestedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
                            }
                          }

                          setCardForm({
                            ...cardForm,
                            invoices: [
                              ...cardForm.invoices,
                              { id: Math.random().toString(), dueDate: suggestedDate, amount: '' }
                            ]
                          });
                        }}
                      >
                        <Text style={{ color: colors.brand.primary, fontSize: 13, fontWeight: '600' }}>+ Adicionar Fatura</Text>
                      </TouchableOpacity>
                      <Text style={{ color: isExact ? colors.success : colors.danger, fontSize: 12, fontWeight: '500' }}>
                        {isExact ? 'Valores conferem!' : `Falta alocar: ${fmt(remainingToDistribute)}`}
                      </Text>
                    </View>
                  </View>
                );
              }
              return null;
            })()}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.brand.accent }]}
              onPress={handleCardSave}
              disabled={cardSaveMutation.isPending}
            >
              {cardSaveMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Criar Cartão</Text>
              )}
            </TouchableOpacity>
            </ScrollView>
            <CategoryPicker
              visible={isCategoryPickerOpen}
              onClose={() => setIsCategoryPickerOpen(false)}
              onSelect={(catId) => setCardForm({ ...cardForm, categoryId: catId })}
              selectedId={cardForm.categoryId}
              type="Expense"
              categories={categories}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- Expanded Card Overlay Modal --- */}
      <Modal visible={!!expandedCard} transparent animationType="fade">
        {expandedCard && (
          <TouchableOpacity 
            style={styles.expandedCardOverlay} 
            activeOpacity={1} 
            onPress={() => setExpandedCard(null)}
          >
            <LinearGradient
              colors={getCardGradient(expandedCard.brand)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.expandedCreditCard}
            >
              <View style={[styles.cardGlossyShine, { width: 150, height: 400, transform: [{ rotate: '-45deg' }, { translateY: -100 }] }]} />
              
              <View style={styles.miniCardHeader}>
                <View style={styles.miniCardBrandRow}>
                  <Ionicons name="card" size={24} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={[styles.miniCardBrandText, { fontSize: 16 }]}>{expandedCard.brand.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.miniCardBody}>
                <View style={[styles.miniCardChip, { width: 45, height: 32 }]} />
                <Ionicons name="wifi-sharp" size={28} color="rgba(255,255,255,0.4)" style={styles.cardWifiIcon} />
              </View>

              <View style={styles.miniCardFooter}>
                <View style={{ flex: 1, gap: 10 }}>
                  <Text style={[styles.miniCardNumbers, { fontSize: 18 }]}>
                    ••••  ••••  ••••  {expandedCard.lastFourDigits}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={[styles.miniCardLabel, { fontSize: 9 }]}>Disponível</Text>
                      <Text style={[styles.miniCardValue, { fontSize: 14 }]} numberOfLines={1} adjustsFontSizeToFit>
                        {showBalances ? fmt(expandedCard.remainingLimit) : 'R$ •••'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={[styles.miniCardLabel, { fontSize: 9 }]}>Utilizado</Text>
                      <Text style={[styles.miniCardValue, { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)' }]} numberOfLines={1} adjustsFontSizeToFit>
                        {showBalances ? fmt(expandedCard.usedLimit ?? 0) : 'R$ •••'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.miniCardLabel, { fontSize: 9 }]}>Limite</Text>
                      <Text style={[styles.miniCardValue, { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }]} numberOfLines={1} adjustsFontSizeToFit>
                        {showBalances ? fmt(expandedCard.totalLimit) : 'R$ •••'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
            
            {/* Faturas list */}
            {expandedCard.invoices && expandedCard.invoices.length > 0 && (
              <View style={styles.expandedInvoicesContainer} onStartShouldSetResponder={() => true}>
                <View style={styles.expandedInvoicesHeaderRow}>
                  <Text style={styles.expandedInvoicesTitle}>Faturas</Text>
                  <View style={styles.expandedInvoiceTabs}>
                    <TouchableOpacity
                      style={[styles.expandedInvoiceTabBtn, expandedInvoiceTab === 'open' && styles.expandedInvoiceTabBtnActive]}
                      onPress={() => setExpandedInvoiceTab('open')}
                    >
                      <Text style={[styles.expandedInvoiceTabText, expandedInvoiceTab === 'open' && styles.expandedInvoiceTabTextActive]}>Abertas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.expandedInvoiceTabBtn, expandedInvoiceTab === 'paid' && styles.expandedInvoiceTabBtnActive]}
                      onPress={() => setExpandedInvoiceTab('paid')}
                    >
                      <Text style={[styles.expandedInvoiceTabText, expandedInvoiceTab === 'paid' && styles.expandedInvoiceTabTextActive]}>Pagas</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <ScrollView style={styles.expandedInvoicesList} showsVerticalScrollIndicator={false}>
                  {expandedCard.invoices.filter(i => (expandedInvoiceTab === 'paid' ? i.isPaid : !i.isPaid)).length === 0 ? (
                    <Text style={{ textAlign: 'center', color: colors.text.muted, marginVertical: spacing.md }}>Nenhuma fatura encontrada.</Text>
                  ) : (
                    expandedCard.invoices
                      .filter(i => (expandedInvoiceTab === 'paid' ? i.isPaid : !i.isPaid))
                      .map((inv, idx) => {
                        const dt = new Date(inv.dueDate);
                        const formattedDate = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
                        return (
                          <View key={inv.id || idx.toString()} style={styles.expandedInvoiceItem}>
                            <View style={styles.expandedInvoiceIconWrap}>
                              <Ionicons name="document-text-outline" size={20} color={colors.brand.primary} />
                            </View>
                            <View style={styles.expandedInvoiceInfo}>
                              <Text style={styles.expandedInvoiceDate}>Vencimento: {formattedDate}</Text>
                              <Text style={styles.expandedInvoiceAmount}>{fmt(inv.amount)}</Text>
                            </View>
                            <View style={[styles.expandedInvoiceStatus, { backgroundColor: inv.isPaid ? `${colors.success}20` : `${colors.warning}20` }]}>
                              <Text style={[styles.expandedInvoiceStatusText, { color: inv.isPaid ? colors.success : colors.warning }]}>
                                {inv.isPaid ? 'Paga' : 'Aberta'}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                  )}
                </ScrollView>
              </View>
            )}
          </TouchableOpacity>
        )}
      </Modal>

      <DeleteWarningModal
        visible={deleteModalVisible}
        title={deleteModalConfig?.title || 'Confirmar Exclusão'}
        description={deleteModalConfig?.description || ''}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={() => deleteModalConfig?.onConfirm()}
        isLoading={
          walletDeleteMutation.isPending || 
          accountDeleteMutation.isPending || 
          cardDeleteMutation.isPending
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text.primary, fontWeight: '800' },
  subtitle: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typography.body, color: colors.text.secondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { ...typography.h3, color: colors.text.primary, marginTop: spacing.md },
  emptySubText: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', paddingHorizontal: spacing.md },
  createBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  createBtnText: { ...typography.button, color: colors.white },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  
  // Patrimonio Líquido Header
  patrimonioHeaderContainer: {
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  patrimonioLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  patrimonioValue: {
    ...typography.h1,
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  patrimonioSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    ...shadow.sm,
  },
  patrimonioSummaryItem: {
    flex: 1,
  },
  patrimonioSummaryLabel: {
    fontSize: 9,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patrimonioSummaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  patrimonioSummaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  
  // Wallet group
  walletGroup: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  walletHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  walletIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletName: { ...typography.h4, color: colors.text.primary, fontWeight: '700' },
  walletCash: { ...typography.caption, color: colors.text.secondary, marginTop: 1 },
  walletCashValue: { color: colors.success, fontWeight: '700' },
  walletActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Accounts Section
  accountsSection: { padding: spacing.md, gap: spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderTitle: { ...typography.caption, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  addAccountLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addAccountLinkText: { ...typography.caption, color: colors.brand.teal, fontWeight: '800' },
  emptyAccountsBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: spacing.xl, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: colors.border, 
    borderRadius: radius.md,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  noAccountsText: { ...typography.bodySmall, color: colors.text.muted, fontStyle: 'italic' },
  
  accountRowContainer: { marginBottom: spacing.md },
  accountCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
  },
  accountMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  bankAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
    gap: 1,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bankNameText: { ...typography.body, color: colors.text.primary, fontWeight: '700' },
  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  typeBadgeText: { 
    fontSize: 9, 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  accountBalanceText: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  accountLimitText: { fontSize: 12, color: colors.text.secondary },
  boldText: { color: colors.text.secondary, fontWeight: '700' },
  
  // Actions
  accountActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: spacing.sm,
  },
  accountActionCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Credit Cards Horizontal Carousel
  cardsCarouselContainer: {
    marginTop: spacing.sm,
    paddingLeft: spacing.xs,
  },
  cardsScrollContent: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  creditCardMini: {
    width: 250,
    height: 140,
    borderRadius: radius.md,
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    marginRight: spacing.xs,
    ...shadow.sm,
  },
  cardGlossyShine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ rotate: '-45deg' }, { translateY: -60 }],
    height: 300,
    width: 100,
    left: '30%',
  },
  miniCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniCardBrandText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  cardDeleteBtnGlass: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  miniCardChip: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#ffd700',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#d4af37',
  },
  miniCardChipLine: {
    position: 'absolute',
    left: 13,
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardWifiIcon: {
    transform: [{ rotate: '90deg' }],
  },
  miniCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  miniCardNumbers: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: spacing.xs,
  },
  miniCardLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniCardValue: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  premiumCardBadge: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '700' },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  formGroup: { marginBottom: spacing.md },
  formRow: { flexDirection: 'row', marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    ...typography.body,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.brand.primary,
  },
  tabBtnText: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  tabBtnTextActive: { color: colors.white },
  submitBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadow.sm,
  },
  submitBtnText: { ...typography.button, color: colors.white },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  toggleBalancesBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.bg.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  
  // Expanded Card Overlay
  expandedCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  expandedCreditCard: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1.586,
    borderRadius: radius.xl,
    padding: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'space-between',
    ...shadow.lg,
  },
  expandedInvoicesContainer: {
    width: '100%',
    maxWidth: 380,
    marginTop: spacing.xl,
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    maxHeight: 300,
  },
  expandedInvoicesTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  expandedInvoicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  expandedInvoiceTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg.primary,
    borderRadius: radius.full,
    padding: 2,
  },
  expandedInvoiceTabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  expandedInvoiceTabBtnActive: {
    backgroundColor: colors.brand.primary,
  },
  expandedInvoiceTabText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  expandedInvoiceTabTextActive: {
    color: colors.white,
  },
  expandedInvoicesList: {
    flexGrow: 0,
  },
  expandedInvoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expandedInvoiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: `${colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  expandedInvoiceInfo: {
    flex: 1,
  },
  expandedInvoiceDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  expandedInvoiceAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  expandedInvoiceStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  expandedInvoiceStatusText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
