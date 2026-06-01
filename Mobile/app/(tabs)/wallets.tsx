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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { walletsApi } from '@/api/endpoints/wallets';
import { Wallet, BankAccount, CreditCard } from '@/types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function WalletsScreen() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Queries
  const { data: wallets = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['wallets', isAuthenticated],
    queryFn: () => walletsApi.list(),
    enabled: isAuthenticated,
  });

  // Refetch data every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetch();
      }
    }, [refetch, isAuthenticated])
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
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState<{
    walletId: string;
    accountId: string;
    brand: string;
    lastFourDigits: string;
    totalLimit: string;
  }>({
    walletId: '',
    accountId: '',
    brand: '',
    lastFourDigits: '',
    totalLimit: '',
  });

  // --- Mutations ---

  // Wallet Mutations
  const walletSaveMutation = useMutation({
    mutationFn: async () => {
      const parsedBalance = parseFloat(walletForm.cashBalance.replace(',', '.'));
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
          cashBalance: parsedBalance,
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
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir carteira', err.message);
    },
  });

  // BankAccount Mutations
  const accountSaveMutation = useMutation({
    mutationFn: async () => {
      const parsedDebit = parseFloat(accountForm.debitBalance.replace(',', '.'));
      const parsedCredit = parseFloat(accountForm.creditLimit.replace(',', '.'));

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
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir conta', err.message);
    },
  });

  // CreditCard Mutations
  const cardSaveMutation = useMutation({
    mutationFn: async () => {
      const parsedLimit = parseFloat(cardForm.totalLimit.replace(',', '.'));

      if (!cardForm.brand.trim()) throw new Error('Bandeira do cartão é obrigatória.');
      if (cardForm.lastFourDigits.length !== 4 || isNaN(parseInt(cardForm.lastFourDigits, 10))) {
        throw new Error('Últimos 4 dígitos devem conter exatamente 4 números.');
      }
      if (isNaN(parsedLimit) || parsedLimit < 0) throw new Error('Limite total deve ser maior ou igual a zero.');

      await walletsApi.createCreditCard(cardForm.walletId, cardForm.accountId, {
        brand: cardForm.brand,
        lastFourDigits: cardForm.lastFourDigits,
        totalLimit: parsedLimit,
      });
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
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir cartão de crédito', err.message);
    },
  });

  // --- Handlers ---
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
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover a carteira "${w.name}"? Isso também excluirá todas as suas contas e cartões associados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => walletDeleteMutation.mutate(w.id) },
      ]
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
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover a conta "${acc.bankName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => accountDeleteMutation.mutate({ walletId, accountId: acc.id }),
        },
      ]
    );
  };

  const handleOpenCardModal = (walletId: string, accountId: string) => {
    setCardForm({
      walletId,
      accountId,
      brand: '',
      lastFourDigits: '',
      totalLimit: '0',
    });
    setCardModalOpen(true);
  };

  const handleConfirmDeleteCard = (walletId: string, accountId: string, card: CreditCard) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja remover o cartão final ${card.lastFourDigits} (${card.brand})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => cardDeleteMutation.mutate({ walletId, accountId, cardId: card.id }),
        },
      ]
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
        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenWalletModal()}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
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
            <Text style={styles.patrimonioValue}>{fmt(metrics.netWorth)}</Text>
            
            <View style={styles.patrimonioSummaryRow}>
              <View style={styles.patrimonioSummaryItem}>
                <Text style={styles.patrimonioSummaryLabel}>Dinheiro Vivo</Text>
                <Text style={styles.patrimonioSummaryValue}>{fmt(metrics.totalCash)}</Text>
              </View>
              <View style={styles.patrimonioSummaryDivider} />
              <View style={styles.patrimonioSummaryItem}>
                <Text style={styles.patrimonioSummaryLabel}>Contas</Text>
                <Text style={styles.patrimonioSummaryValue}>{fmt(metrics.totalDebit)}</Text>
              </View>
              <View style={styles.patrimonioSummaryDivider} />
              <View style={styles.patrimonioSummaryItem}>
                <Text style={styles.patrimonioSummaryLabel}>Créditos</Text>
                <Text style={styles.patrimonioSummaryValue}>{fmt(metrics.totalCredit)}</Text>
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
                        <Ionicons 
                          name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
                          size={14} 
                          color={colors.text.secondary} 
                        />
                      </View>
                      <Text style={styles.walletCash}>
                        Dinheiro físico: <Text style={styles.walletCashValue}>{fmt(w.cashBalance)}</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.walletActions}>
                    <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleOpenWalletModal(w)}>
                      <Ionicons name="pencil-sharp" size={13} color={colors.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleConfirmDeleteWallet(w)}>
                      <Ionicons name="trash-sharp" size={13} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Accounts & Cards section */}
                {!isCollapsed && (
                  <View style={styles.accountsSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionHeaderTitle}>Contas e Cartões</Text>
                      <TouchableOpacity
                        style={styles.addAccountLink}
                        onPress={() => handleOpenAccountModal(w.id)}
                      >
                        <Ionicons name="add-circle" size={16} color={colors.brand.teal} />
                        <Text style={styles.addAccountLinkText}>Nova Conta</Text>
                      </TouchableOpacity>
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
                                    Saldo: <Text style={styles.boldText}>{fmt(acc.debitBalance)}</Text>
                                  </Text>
                                  {acc.creditLimit > 0 && (
                                    <Text style={styles.accountLimitText}>
                                      Crédito: <Text style={styles.boldText}>{fmt(acc.remainingCreditLimit ?? acc.creditLimit)}</Text>
                                      <Text style={{ fontSize: 10, color: colors.text.muted }}> (Utilizado: {fmt(acc.usedCreditLimit ?? 0)} de {fmt(acc.creditLimit)})</Text>
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
 
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
                                    <LinearGradient
                                      key={card.id}
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
                                        <TouchableOpacity
                                          style={styles.cardDeleteBtnGlass}
                                          onPress={() => handleConfirmDeleteCard(w.id, acc.id, card)}
                                        >
                                          <Ionicons name="trash-sharp" size={11} color="rgba(255, 255, 255, 0.95)" />
                                        </TouchableOpacity>
                                      </View>
 
                                      <View style={styles.miniCardBody}>
                                        <View style={styles.miniCardChip}>
                                          <View style={styles.miniCardChipLine} />
                                        </View>
                                        <Ionicons name="wifi-sharp" size={14} color="rgba(255,255,255,0.4)" style={styles.cardWifiIcon} />
                                      </View>

                                      <View style={styles.miniCardFooter}>
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.miniCardNumbers}>
                                            ••••  ••••  ••••  {card.lastFourDigits}
                                          </Text>
                                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginRight: spacing.sm, alignItems: 'flex-end' }}>
                                            <View>
                                              <Text style={styles.miniCardLabel}>Disponível</Text>
                                              <Text style={styles.miniCardValue}>{fmt(card.remainingLimit)}</Text>
                                            </View>
                                            <View>
                                              <Text style={styles.miniCardLabel}>Utilizado</Text>
                                              <Text style={[styles.miniCardValue, { fontSize: 10, color: 'rgba(255, 255, 255, 0.85)' }]}>{fmt(card.usedLimit ?? 0)}</Text>
                                            </View>
                                            <View>
                                              <Text style={styles.miniCardLabel}>Limite</Text>
                                              <Text style={[styles.miniCardValue, { fontSize: 10, color: 'rgba(255, 255, 255, 0.7)' }]}>{fmt(card.totalLimit)}</Text>
                                            </View>
                                          </View>
                                        </View>
                                        <Text style={styles.premiumCardBadge}>PLATINUM</Text>
                                      </View>
                                    </LinearGradient>
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
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
                value={walletForm.cashBalance}
                onChangeText={(text) => setWalletForm({ ...walletForm, cashBalance: text })}
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
                  placeholder="0.00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={accountForm.debitBalance}
                  onChangeText={(text) => setAccountForm({ ...accountForm, debitBalance: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>Limite de Crédito</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={accountForm.creditLimit}
                  onChangeText={(text) => setAccountForm({ ...accountForm, creditLimit: text })}
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
                  keyboardType="numeric"
                  maxLength={4}
                  value={cardForm.lastFourDigits}
                  onChangeText={(text) => setCardForm({ ...cardForm, lastFourDigits: text })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>Limite Total</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={cardForm.totalLimit}
                  onChangeText={(text) => setCardForm({ ...cardForm, totalLimit: text })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.brand.accent }]}
              onPress={() => cardSaveMutation.mutate()}
              disabled={cardSaveMutation.isPending}
            >
              {cardSaveMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Criar Cartão</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
});
