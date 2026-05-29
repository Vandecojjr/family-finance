import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsPayableApi } from '@/api/endpoints/accountsPayable';
import { walletsApi } from '@/api/endpoints/wallets';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { decodeJwt } from '@/utils/jwt';
import { AccountsPayableDto } from '@/types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getFrequencyLabel = (freq: number) => {
  switch (freq) {
    case 1: return 'Semanal';
    case 2: return 'Mensal';
    case 3: return 'Anual';
    default: return 'Recorrente';
  }
};

export default function AccountsPayableScreen() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  
  // 1 = Semana, 2 = Mês, 3 = Ano
  const [dateFilter, setDateFilter] = useState<number>(2);

  // Modal States
  const [selectedAccount, setSelectedAccount] = useState<AccountsPayableDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isWalletSelectOpen, setIsWalletSelectOpen] = useState(false);

  // Pay Form States
  const [payAmount, setPayAmount] = useState('');
  const [payWalletId, setPayWalletId] = useState('');
  const [payBankAccountId, setPayBankAccountId] = useState('');
  const [payCreditCardId, setPayCreditCardId] = useState('');
  const [payUseCredit, setPayUseCredit] = useState(false);

  useEffect(() => {
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken);
      if (decoded?.memberId) {
        setCurrentMemberId(decoded.memberId);
      }
    }
  }, [tokens]);

  const { data: accountsPayable, isLoading } = useQuery({
    queryKey: ['accountsPayable', currentMemberId, dateFilter],
    queryFn: () => accountsPayableApi.getByMemberId(currentMemberId!, dateFilter),
    enabled: !!currentMemberId,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.list(),
  });

  const payMutation = useMutation({
    mutationFn: async (payload: { id: string, amount: number, walletId: string, bankAccountId?: string | null, creditCardId?: string | null, useCredit?: boolean | null }) => {
      await recurringExpensesApi.pay(payload.id, {
        walletId: payload.walletId,
        amount: payload.amount,
        bankAccountId: payload.bankAccountId,
        creditCardId: payload.creditCardId,
        useCredit: payload.useCredit,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountsPayable'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsPayModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedAccount(null);
      Alert.alert('Sucesso', 'Pagamento registrado com sucesso!');
    },
    onError: (error: any) => {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao registrar o pagamento.');
    },
  });

  const handlePaySubmit = () => {
    if (!selectedAccount) return;
    const amountNum = parseFloat(payAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erro', 'Informe um valor válido maior que zero.');
      return;
    }
    if (!payWalletId) {
      Alert.alert('Erro', 'Selecione uma carteira.');
      return;
    }

    payMutation.mutate({
      id: selectedAccount.id,
      amount: amountNum,
      walletId: payWalletId,
      bankAccountId: payBankAccountId || null,
      creditCardId: payCreditCardId || null,
      useCredit: payUseCredit || null,
    });
  };

  const totalAmount = accountsPayable?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>A Pagar</Text>
          <Text style={styles.subtitle}>Suas pendências financeiras</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeLabel}>Total</Text>
          <Text style={styles.totalBadgeValue}>{fmt(totalAmount)}</Text>
        </View>
      </View>

      {/* Filtro de Período */}
      <View style={styles.filterContainer}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, dateFilter === 1 && styles.segmentActive]}
            onPress={() => setDateFilter(1)}
          >
            <Text style={[styles.segmentText, dateFilter === 1 && styles.segmentTextActive]}>Semana</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, dateFilter === 2 && styles.segmentActive]}
            onPress={() => setDateFilter(2)}
          >
            <Text style={[styles.segmentText, dateFilter === 2 && styles.segmentTextActive]}>Mês</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, dateFilter === 3 && styles.segmentActive]}
            onPress={() => setDateFilter(3)}
          >
            <Text style={[styles.segmentText, dateFilter === 3 && styles.segmentTextActive]}>Ano</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {accountsPayable && accountsPayable.length > 0 ? (
            accountsPayable.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => {
                  setSelectedAccount(item);
                  setIsDetailModalOpen(true);
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.description}</Text>
                  <Text style={styles.cardAmount}>{fmt(item.amount)}</Text>
                </View>
                 <View style={styles.cardFooter}>
                  <View style={styles.badge}>
                    <Ionicons name="pricetag-outline" size={12} color={colors.brand.accent} />
                    <Text style={styles.badgeText}>{item.categoryName}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Ionicons name="repeat-outline" size={12} color={colors.text.secondary} />
                    <Text style={styles.badgeText}>{getFrequencyLabel(item.frequency)}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
                    <Text style={styles.badgeText}>
                      {item.isLate ? 'Venceu dia' : 'Vence dia'} {item.dueDay}
                    </Text>
                  </View>
                  {item.isLate && (
                    <View style={[styles.badge, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                      <Ionicons name="alert-circle-outline" size={12} color={colors.danger} />
                      <Text style={[styles.badgeText, { color: colors.danger }]}>Atrasado</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.brand.teal} />
              <Text style={styles.emptyTitle}>Tudo em dia!</Text>
              <Text style={styles.emptyText}>Você não possui contas pendentes para este período.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={isDetailModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.detailContainer}>
            <View style={styles.detailCard}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderInfo}>
                  <Text style={styles.formTitle}>Detalhes da Conta</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsDetailModalOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailBody}>
                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Descrição</Text>
                  <Text style={styles.detailValueText}>{selectedAccount?.description}</Text>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Categoria</Text>
                  <View style={[styles.badge, { alignSelf: 'flex-start' }]}>
                    <Ionicons name="pricetag-outline" size={12} color={colors.brand.accent} />
                    <Text style={styles.badgeText}>{selectedAccount?.categoryName}</Text>
                  </View>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Frequência</Text>
                  <View style={[styles.badge, { alignSelf: 'flex-start' }]}>
                    <Ionicons name="repeat-outline" size={12} color={colors.text.secondary} />
                    <Text style={styles.badgeText}>{selectedAccount ? getFrequencyLabel(selectedAccount.frequency) : ''}</Text>
                  </View>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Vencimento</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={[styles.badge, { alignSelf: 'flex-start' }]}>
                      <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
                      <Text style={styles.badgeText}>
                        {selectedAccount?.isLate ? 'Venceu dia' : 'Vence dia'} {selectedAccount?.dueDay}
                      </Text>
                    </View>
                    {selectedAccount?.isLate && (
                      <View style={[styles.badge, { backgroundColor: 'rgba(255, 107, 107, 0.1)', alignSelf: 'flex-start' }]}>
                        <Ionicons name="alert-circle-outline" size={12} color={colors.danger} />
                        <Text style={[styles.badgeText, { color: colors.danger }]}>Atrasado</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Valor</Text>
                  <Text style={styles.detailAmountText}>{selectedAccount ? fmt(selectedAccount.amount) : ''}</Text>
                </View>

                <TouchableOpacity
                  style={styles.payActionBtn}
                  onPress={() => {
                    if (selectedAccount) {
                      setPayAmount(selectedAccount.amount.toString());
                      setPayWalletId('');
                      setPayBankAccountId('');
                      setPayCreditCardId('');
                      setPayUseCredit(false);
                      setIsPayModalOpen(true);
                    }
                  }}
                >
                  <Ionicons name="cash-outline" size={20} color={colors.white} />
                  <Text style={styles.payActionBtnText}>Pagar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Pay Modal */}
      <Modal visible={isPayModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.formContainer}>
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View style={styles.formHeaderInfo}>
                    <Text style={styles.formTitle}>Registrar Pagamento</Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setIsPayModalOpen(false)}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollBody}>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Gasto Recorrente</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bg.elevated, color: colors.text.secondary }]}
                      value={selectedAccount?.description}
                      editable={false}
                    />
                  </View>

                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Valor (R$)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                      value={payAmount}
                      onChangeText={setPayAmount}
                    />
                  </View>

                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Carteira / Conta</Text>
                    <TouchableOpacity style={styles.selectInput} onPress={() => setIsWalletSelectOpen(true)}>
                      <Text style={[styles.selectInputText, !payWalletId && { color: colors.text.muted }]}>
                        {payWalletId
                          ? (payUseCredit 
                              ? `Cartão de Crédito - ${wallets?.find(w => w.id === payWalletId)?.accounts.find(a => a.id === payBankAccountId)?.creditCards.find(c => c.id === payCreditCardId)?.brand}` 
                              : payBankAccountId 
                                ? `Conta Bancária - ${wallets?.find(w => w.id === payWalletId)?.accounts.find(a => a.id === payBankAccountId)?.bankName}`
                                : `Dinheiro Vivo - ${wallets?.find(w => w.id === payWalletId)?.name}`)
                          : 'Selecionar fonte de pagamento'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn}
                    onPress={handlePaySubmit}
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.saveBtnText}>Confirmar Pagamento</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Wallet/Account Select Modal */}
      <Modal visible={isWalletSelectOpen} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.categorySelectorCard}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderInfo}>
                <Text style={styles.formTitle}>Selecione a Fonte de Pagamento</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsWalletSelectOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryListContent}>
              {wallets?.map(wallet => (
                <View key={wallet.id} style={{ marginBottom: spacing.md }}>
                  <Text style={styles.walletGroupTitle}>{wallet.name}</Text>
                  
                  {/* Dinheiro Vivo */}
                  <TouchableOpacity 
                    style={styles.walletOptionBtn}
                    onPress={() => {
                      setPayWalletId(wallet.id);
                      setPayBankAccountId('');
                      setPayCreditCardId('');
                      setPayUseCredit(false);
                      setIsWalletSelectOpen(false);
                    }}
                  >
                    <Ionicons name="cash-outline" size={20} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                    <Text style={styles.walletOptionText}>Dinheiro Vivo ({fmt(wallet.cashBalance)})</Text>
                  </TouchableOpacity>

                  {/* Bank Accounts */}
                  {wallet.accounts.map(acc => (
                    <View key={acc.id}>
                      <TouchableOpacity 
                        style={styles.walletOptionBtn}
                        onPress={() => {
                          setPayWalletId(wallet.id);
                          setPayBankAccountId(acc.id);
                          setPayCreditCardId('');
                          setPayUseCredit(false);
                          setIsWalletSelectOpen(false);
                        }}
                      >
                        <Ionicons name="business-outline" size={20} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                        <Text style={styles.walletOptionText}>{acc.bankName} - Conta ({fmt(acc.debitBalance)})</Text>
                      </TouchableOpacity>

                      {/* Credit Cards */}
                      {acc.creditCards.map(card => (
                        <TouchableOpacity 
                          key={card.id}
                          style={[styles.walletOptionBtn, { paddingLeft: spacing.xl }]}
                          onPress={() => {
                            setPayWalletId(wallet.id);
                            setPayBankAccountId(acc.id);
                            setPayCreditCardId(card.id);
                            setPayUseCredit(true);
                            setIsWalletSelectOpen(false);
                          }}
                        >
                          <Ionicons name="card-outline" size={20} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                          <Text style={styles.walletOptionText}>{card.brand} final {card.lastFourDigits}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
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
  subtitle: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  totalBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'flex-end',
  },
  totalBadgeLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.danger,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  totalBadgeValue: {
    ...typography.h3,
    color: colors.danger,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.brand.primary,
    ...shadow.sm,
  },
  segmentText: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  segmentTextActive: { color: colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardAmount: {
    ...typography.body,
    fontWeight: '700',
    color: colors.danger,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 250,
  },

  // Modal styles for forms
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  detailContainer: {
    height: '60%',
  },
  detailCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  detailBody: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  detailField: {
    gap: 4,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValueText: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 16,
  },
  detailAmountText: {
    ...typography.h2,
    color: colors.danger,
  },
  payActionBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.teal,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.md,
  },
  payActionBtnText: {
    ...typography.button,
    color: colors.white,
  },

  formContainer: {
    height: '92%',
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formHeaderInfo: { flex: 1 },
  formTitle: { ...typography.h3, color: colors.text.primary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  formScrollBody: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  fieldWrapper: { gap: 6 },
  label: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  input: {
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 50,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    ...typography.body,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.teal,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.md,
  },
  saveBtnText: { ...typography.button, color: colors.white },
  
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 50,
    paddingHorizontal: spacing.md,
  },
  selectInputText: {
    color: colors.text.primary,
    ...typography.body,
  },
  categorySelectorCard: {
    height: '75%',
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  categoryListContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  walletGroupTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  walletOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  walletOptionText: {
    ...typography.body,
    color: colors.text.primary,
  },
});
