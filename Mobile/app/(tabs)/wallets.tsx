import React, { useState } from 'react';
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
import { walletsApi } from '@/api/endpoints/wallets';
import { Wallet, BankAccount, CreditCard } from '@/types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function WalletsScreen() {
  const queryClient = useQueryClient();

  // Queries
  const { data: wallets = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.list(),
  });

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Carteiras</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenWalletModal()}>
          <Ionicons name="add" size={22} color={colors.white} />
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
          {/* Summary/Patrimonio Card */}
          <LinearGradient colors={colors.gradient.primary} style={styles.totalCard}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Patrimônio Líquido Geral</Text>
                <Text style={styles.totalValue}>{fmt(metrics.netWorth)}</Text>
              </View>
              <Ionicons name="shield-checkmark" size={36} color="rgba(255,255,255,0.3)" />
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Dinheiro Vivo</Text>
                <Text style={styles.metricVal}>{fmt(metrics.totalCash)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Saldos em Conta</Text>
                <Text style={styles.metricVal}>{fmt(metrics.totalDebit)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Crédito Total</Text>
                <Text style={styles.metricVal}>{fmt(metrics.totalCredit)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* List of Wallets */}
          {wallets.map((w) => (
            <View key={w.id} style={styles.walletGroup}>
              {/* Wallet Header Card */}
              <View style={styles.walletHeader}>
                <View style={styles.walletHeaderLeft}>
                  <View style={styles.walletIconContainer}>
                    <Ionicons name="wallet" size={20} color={colors.brand.primary} />
                  </View>
                  <View>
                    <Text style={styles.walletName}>{w.name}</Text>
                    <Text style={styles.walletCash}>
                      Dinheiro Vivo: <Text style={styles.walletCashValue}>{fmt(w.cashBalance)}</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.walletActions}>
                  <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleOpenWalletModal(w)}>
                    <Ionicons name="pencil-outline" size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleConfirmDeleteWallet(w)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Accounts & Cards section */}
              <View style={styles.accountsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Contas e Cartões</Text>
                  <TouchableOpacity
                    style={styles.addAccountLink}
                    onPress={() => handleOpenAccountModal(w.id)}
                  >
                    <Ionicons name="add" size={14} color={colors.brand.teal} />
                    <Text style={styles.addAccountLinkText}>Nova Conta</Text>
                  </TouchableOpacity>
                </View>

                {w.accounts.length === 0 ? (
                  <Text style={styles.noAccountsText}>Nenhuma conta bancária vinculada a esta carteira.</Text>
                ) : (
                  w.accounts.map((acc) => (
                    <View key={acc.id} style={styles.accountRowContainer}>
                      {/* Account details card */}
                      <View style={styles.accountCard}>
                        <View style={styles.accountMainInfo}>
                          <View style={styles.bankAvatar}>
                            <Ionicons
                              name={acc.type === 5 ? 'save' : 'business'}
                              size={16}
                              color={colors.text.primary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.bankNameRow}>
                              <Text style={styles.bankNameText}>{acc.bankName}</Text>
                              <View
                                style={[
                                  styles.typeBadge,
                                  {
                                    backgroundColor:
                                      acc.type === 5
                                        ? `${colors.brand.teal}22`
                                        : `${colors.brand.primary}22`,
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
                            </View>
                            <View style={styles.balancesRow}>
                              <Text style={styles.balanceDebit}>
                                Saldo: <Text style={styles.boldText}>{fmt(acc.debitBalance)}</Text>
                              </Text>
                              {acc.creditLimit > 0 && (
                                <Text style={styles.balanceCredit}>
                                  Limite: <Text style={styles.boldText}>{fmt(acc.creditLimit)}</Text>
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>

                        <View style={styles.accountActions}>
                          <TouchableOpacity
                            style={[styles.accountActionBtn, { borderColor: `${colors.brand.teal}44` }]}
                            onPress={() => handleOpenCardModal(w.id, acc.id)}
                          >
                            <Ionicons name="card" size={14} color={colors.brand.teal} />
                            <Text style={styles.accountActionBtnText}>+ Cartão</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.accountActionBtnIcon}
                            onPress={() => handleOpenAccountModal(w.id, acc)}
                          >
                            <Ionicons name="pencil" size={14} color={colors.text.secondary} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.accountActionBtnIcon}
                            onPress={() => handleConfirmDeleteAccount(w.id, acc)}
                          >
                            <Ionicons name="trash" size={14} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Credit Cards list */}
                      {acc.creditCards && acc.creditCards.length > 0 && (
                        <View style={styles.cardsSubList}>
                          {acc.creditCards.map((card) => (
                            <View key={card.id} style={styles.cardItem}>
                              <View style={styles.cardItemLeft}>
                                <Ionicons name="card-outline" size={16} color={colors.brand.accent} />
                                <Text style={styles.cardNameText}>
                                  {card.brand} •••• {card.lastFourDigits}
                                </Text>
                                <Text style={styles.cardLimitText}>
                                  (Limite: {fmt(card.totalLimit)})
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.cardDeleteBtn}
                                onPress={() => handleConfirmDeleteCard(w.id, acc.id, card)}
                              >
                                <Ionicons name="trash-outline" size={12} color={colors.danger} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>
          ))}
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
              <TouchableOpacity onPress={() => setWalletModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
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
              <Text style={styles.label}>Saldo Físico (Dinheiro Vivo em Mãos)</Text>
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
              <TouchableOpacity onPress={() => setAccountModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
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

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
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
              <TouchableOpacity onPress={() => setCardModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
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

              <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
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
  title: { ...typography.h2, color: colors.text.primary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
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
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  totalCard: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.sm, ...shadow.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { ...typography.h1, color: colors.white, marginTop: spacing.xs },
  dividerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metricItem: { flex: 1 },
  metricLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  metricVal: { ...typography.body, color: colors.white, fontWeight: '700', marginTop: 2 },
  walletGroup: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  walletHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  walletIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: `${colors.brand.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletName: { ...typography.h4, color: colors.text.primary },
  walletCash: { ...typography.caption, color: colors.text.secondary, marginTop: 1 },
  walletCashValue: { color: colors.success, fontWeight: '600' },
  walletActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionBtnIcon: {
    padding: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  accountsSection: { padding: spacing.md, gap: spacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionHeaderTitle: { ...typography.caption, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  addAccountLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addAccountLinkText: { ...typography.caption, color: colors.brand.teal, fontWeight: '700' },
  noAccountsText: { ...typography.bodySmall, color: colors.text.muted, fontStyle: 'italic', paddingVertical: spacing.xs },
  accountRowContainer: { marginBottom: spacing.sm },
  accountCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountMainInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  bankAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bankNameText: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  balancesRow: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
  balanceDebit: { ...typography.bodySmall, color: colors.text.secondary },
  balanceCredit: { ...typography.bodySmall, color: colors.text.secondary },
  boldText: { color: colors.text.primary, fontWeight: '600' },
  accountActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: spacing.sm },
  accountActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  accountActionBtnText: { fontSize: 10, color: colors.brand.teal, fontWeight: '700' },
  accountActionBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsSubList: {
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.bg.card}aa`,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cardItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  cardNameText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '500' },
  cardLimitText: { ...typography.caption, color: colors.text.secondary, marginLeft: 4 },
  cardDeleteBtn: { padding: spacing.xs },
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
  modalTitle: { ...typography.h3, color: colors.text.primary },
  formGroup: { marginBottom: spacing.md },
  formRow: { flexDirection: 'row', marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs },
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
