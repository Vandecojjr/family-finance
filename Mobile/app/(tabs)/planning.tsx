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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsPayableApi } from '@/api/endpoints/accountsPayable';
import { accountsReceivableApi } from '@/api/endpoints/accountsReceivable';
import { walletsApi } from '@/api/endpoints/wallets';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { recurringIncomesApi } from '@/api/endpoints/recurringIncomes';
import { decodeJwt } from '@/utils/jwt';
import { dashboardApi } from '@/api/endpoints/dashboard';
import { AccountsPayableDto, AccountsReceivableDto } from '@/types';
import { OriginPicker } from '@/components/OriginPicker';
import { CustomCalendar } from '@/components/CustomCalendar';
import { useRouter } from 'expo-router';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getFrequencyLabel = (freq: number) => {
  switch (freq) {
    case 1: return 'Semanal';
    case 2: return 'Mensal';
    case 3: return 'Anual';
    default: return 'Recorrente';
  }
};

type UnifiedAccount = (AccountsPayableDto | AccountsReceivableDto) & { _type: 'payable' | 'receivable' };

export default function PlanningScreen() {
  const { tokens, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  
  // 1 = Semana, 2 = Mês, 3 = Ano
  const [dateFilter, setDateFilter] = useState<number>(2);
  // 'all', 'payable', 'receivable'
  const [typeFilter, setTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');

  // Modal States
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<UnifiedAccount | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isWalletSelectOpen, setIsWalletSelectOpen] = useState(false);

  // Transaction Form States
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionWalletId, setTransactionWalletId] = useState('');
  const [transactionBankAccountId, setTransactionBankAccountId] = useState('');
  const [transactionCreditCardId, setTransactionCreditCardId] = useState('');
  const [transactionUseCredit, setTransactionUseCredit] = useState(false);
  
  // Calendar States
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  
  // Fetch Calendar Indicators
  const { data: calendarData } = useQuery({
    queryKey: ['calendarIndicators', calendarMonth],
    queryFn: () => dashboardApi.getCalendarIndicators(calendarMonth),
    enabled: isAuthenticated && isCalendarModalOpen,
  });

  const calendarIndicatorsMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (calendarData) {
      calendarData.forEach(item => {
        map[item.date] = {
          hasPayable: item.hasPayable,
          hasReceivable: item.hasReceivable,
          details: item.details || [],
        };
      });
    }
    return map;
  }, [calendarData]);

  const handleDayPress = (date: string) => {
    setSelectedCalendarDate(date);
    setIsDayDetailModalOpen(true);
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken);
      if (decoded?.memberId) {
        setCurrentMemberId(decoded.memberId);
      }
    }
  }, [tokens]);

  const { data: accountsPayable, isLoading: isLoadingPayable } = useQuery({
    queryKey: ['accountsPayable', currentMemberId, dateFilter],
    queryFn: () => accountsPayableApi.getByMemberId(currentMemberId!, dateFilter),
    enabled: !!currentMemberId,
  });

  const { data: accountsReceivable, isLoading: isLoadingReceivable } = useQuery({
    queryKey: ['accountsReceivable', currentMemberId, dateFilter],
    queryFn: () => accountsReceivableApi.getByMemberId(currentMemberId!, dateFilter),
    enabled: !!currentMemberId,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets', isAuthenticated],
    queryFn: () => walletsApi.list(),
    enabled: isAuthenticated,
  });

  const isLoading = isLoadingPayable || isLoadingReceivable;

  const currentList = React.useMemo(() => {
    const payables = (accountsPayable || []).map(item => ({ ...item, _type: 'payable' as const }));
    const receivables = (accountsReceivable || []).map(item => ({ ...item, _type: 'receivable' as const }));
    
    let combined: UnifiedAccount[] = [...payables, ...receivables];
    if (typeFilter === 'payable') combined = payables;
    if (typeFilter === 'receivable') combined = receivables;
    
    combined.sort((a, b) => a.dueDay - b.dueDay);
    return combined;
  }, [accountsPayable, accountsReceivable, typeFilter]);

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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsTransactionModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedAccount(null);
      Alert.alert('Sucesso', 'Pagamento registrado com sucesso!');
    },
    onError: (error: any) => {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao registrar o pagamento.');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (payload: { id: string, amount: number, walletId: string, bankAccountId?: string | null }) => {
      await recurringIncomesApi.receive(payload.id, {
        walletId: payload.walletId,
        amount: payload.amount,
        bankAccountId: payload.bankAccountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountsReceivable'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsTransactionModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedAccount(null);
      Alert.alert('Sucesso', 'Recebimento registrado com sucesso!');
    },
    onError: (error: any) => {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao registrar o recebimento.');
    },
  });

  const handleTransactionSubmit = () => {
    if (!selectedAccount) return;
    const amountNum = parseFloat(transactionAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erro', 'Informe um valor válido maior que zero.');
      return;
    }
    if (!transactionWalletId) {
      Alert.alert('Erro', selectedAccount._type === 'payable' ? 'Selecione uma carteira de pagamento.' : 'Selecione uma carteira de destino.');
      return;
    }

    if (selectedAccount._type === 'payable') {
      payMutation.mutate({
        id: selectedAccount.id,
        amount: amountNum,
        walletId: transactionWalletId,
        bankAccountId: transactionBankAccountId || null,
        creditCardId: transactionCreditCardId || null,
        useCredit: transactionBankAccountId ? transactionUseCredit : null,
      });
    } else {
      receiveMutation.mutate({
        id: selectedAccount.id,
        amount: amountNum,
        walletId: transactionWalletId,
        bankAccountId: transactionBankAccountId || null,
      });
    }
  };

  const totalPayable = currentList.filter(i => i._type === 'payable').reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceivable = currentList.filter(i => i._type === 'receivable').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Planejamento</Text>
          <Text style={styles.headerSubtitle}>Gerencie contas a pagar e a receber</Text>
        </View>
      </View>

      {/* Totals Banner */}
      <View style={styles.totalsContainer}>
        {(typeFilter === 'all' || typeFilter === 'payable') && (
          <View style={[styles.totalCard, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
            <Text style={[styles.totalCardLabel, { color: colors.danger }]}>A PAGAR</Text>
            <Text style={[styles.totalCardValue, { color: colors.danger }]}>{fmt(totalPayable)}</Text>
          </View>
        )}
        {(typeFilter === 'all' || typeFilter === 'receivable') && (
          <View style={[styles.totalCard, { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]}>
            <Text style={[styles.totalCardLabel, { color: colors.success }]}>A RECEBER</Text>
            <Text style={[styles.totalCardValue, { color: colors.success }]}>{fmt(totalReceivable)}</Text>
          </View>
        )}
      </View>

      {/* Type Filter */}
      <View style={styles.typeFilterContainer}>
        <TouchableOpacity
          style={[styles.typePill, typeFilter === 'all' && styles.typePillActive]}
          onPress={() => setTypeFilter('all')}
        >
          <Text style={[styles.typePillText, typeFilter === 'all' && styles.typePillTextActive]}>Tudo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typePill, typeFilter === 'payable' && { backgroundColor: colors.danger }]}
          onPress={() => setTypeFilter('payable')}
        >
          <Text style={[styles.typePillText, typeFilter === 'payable' && styles.typePillTextActive]}>A Pagar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typePill, typeFilter === 'receivable' && { backgroundColor: colors.brand.teal }]}
          onPress={() => setTypeFilter('receivable')}
        >
          <Text style={[styles.typePillText, typeFilter === 'receivable' && styles.typePillTextActive]}>A Receber</Text>
        </TouchableOpacity>
      </View>

      {/* Time Filter */}
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
          {currentList && currentList.length > 0 ? (
            currentList.map((item, index) => {
              const isPayable = item._type === 'payable';
              const cardAccent = isPayable ? colors.danger : colors.brand.teal;
              return (
                <TouchableOpacity
                  key={`${item._type}-${item.id}-${index}`}
                  style={[styles.card, { borderLeftColor: cardAccent, borderLeftWidth: 4 }]}
                  onPress={() => {
                    setSelectedAccount(item);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <View style={styles.cardMain}>
                    <View style={[styles.dateBox, { backgroundColor: isPayable ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 212, 170, 0.1)' }]}>
                      <Text style={[styles.dateBoxDay, { color: cardAccent }]}>{String(item.dueDay).padStart(2, '0')}</Text>
                      <Text style={[styles.dateBoxLabel, { color: cardAccent }]}>DIA</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{item.description}</Text>
                      <Text style={[styles.cardAmount, { color: cardAccent }]}>{fmt(item.amount)}</Text>
                      <View style={styles.cardFooter}>
                        <View style={styles.badge}>
                          <Ionicons name="pricetag-outline" size={10} color={colors.text.secondary} />
                          <Text style={styles.badgeText}>{item.categoryName}</Text>
                        </View>
                        <View style={styles.badge}>
                          <Ionicons name="repeat-outline" size={10} color={colors.text.secondary} />
                          <Text style={styles.badgeText}>{getFrequencyLabel(item.frequency)}</Text>
                        </View>
                        {item.isLate && (
                          <View style={[styles.badge, { backgroundColor: isPayable ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 179, 71, 0.1)' }]}>
                            <Ionicons name="alert-circle-outline" size={10} color={isPayable ? colors.danger : colors.warning} />
                            <Text style={[styles.badgeText, { color: isPayable ? colors.danger : colors.warning }]}>
                              {isPayable ? 'Atrasado' : 'Pendente'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.brand.primary} />
              <Text style={styles.emptyTitle}>Tudo em ordem!</Text>
              <Text style={styles.emptyText}>Você não possui pendências para este período.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── FLOATING ACTION BUTTONS ─────────────────────────────── */}
      <View style={styles.fabContainer}>
        {/* Calendar FAB */}
        <TouchableOpacity 
          style={[styles.fab, { marginBottom: spacing.md }]} 
          onPress={() => setIsCalendarModalOpen(true)}
        >
          <LinearGradient
            colors={[colors.brand.teal, colors.brand.teal]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="calendar" size={24} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add FAB */}
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setIsChoiceModalOpen(true)}
        >
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.primary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── CALENDAR MODAL ─────────────────────────────── */}
      <Modal visible={isCalendarModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.formContainer, { justifyContent: 'center', padding: spacing.md }]}>
            <View style={[styles.formCard, { padding: 0, overflow: 'hidden' }]}>
              <View style={[styles.formHeader, { backgroundColor: colors.bg.elevated, padding: spacing.md }]}>
                <View style={styles.formHeaderInfo}>
                  <Text style={styles.formHeaderTitle}>Calendário de Planejamento</Text>
                  <Text style={styles.formHeaderSubtitle}>Visualize suas contas no mês</Text>
                </View>
                <TouchableOpacity onPress={() => setIsCalendarModalOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <View style={{ padding: spacing.sm }}>
                <CustomCalendar 
                  indicators={calendarIndicatorsMap}
                  onMonthChange={(y, m) => {
                    const monthStr = String(m).padStart(2, '0');
                    setCalendarMonth(`${y}-${monthStr}`);
                  }}
                  onDayPress={handleDayPress}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── DAY DETAILS MODAL ─────────────────────────────── */}
      <Modal visible={isDayDetailModalOpen} animationType="fade" transparent>
        <View style={styles.choiceModalOverlay}>
          <View style={[styles.choiceModalContent, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={styles.modalTitle}>Detalhes do Dia {selectedCalendarDate ? selectedCalendarDate.split('-').reverse().join('/') : ''}</Text>
              <TouchableOpacity onPress={() => setIsDayDetailModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: spacing.md }}>
              {selectedCalendarDate && calendarIndicatorsMap[selectedCalendarDate]?.details?.length > 0 ? (
                calendarIndicatorsMap[selectedCalendarDate].details.map((item: any) => (
                  <View key={item.id} style={[styles.transactionCard, { marginBottom: spacing.sm }]}>
                    <View style={[styles.transactionIconWrap, { backgroundColor: item.type === 'payable' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 212, 170, 0.1)' }]}>
                      <Ionicons 
                        name={item.type === 'payable' ? 'arrow-down' : 'arrow-up'} 
                        size={20} 
                        color={item.type === 'payable' ? colors.danger : colors.success} 
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{item.title}</Text>
                      <Text style={styles.transactionDate}>{item.isPaid ? 'Pago' : 'Pendente'}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={[styles.transactionAmount, { color: item.type === 'payable' ? colors.danger : colors.success }]}>
                        {fmt(item.amount)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <Text style={{ ...typography.body, color: colors.text.secondary }}>Nenhuma conta para este dia.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Choice Modal */}
      <Modal visible={isChoiceModalOpen} transparent animationType="fade">
        <View style={styles.choiceModalOverlay}>
          <View style={styles.choiceModalContent}>
            <Text style={styles.modalTitle}>O que deseja planejar?</Text>
            
            <TouchableOpacity 
              style={styles.choiceBtn} 
              onPress={() => {
                setIsChoiceModalOpen(false);
                router.push({ pathname: '/(tabs)/recurring-expenses', params: { mode: 'planned' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Previsão Avulsa</Text>
                <Text style={styles.choiceSubtitle}>Planejar gasto/ganho pontual futuro</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.choiceBtn} 
              onPress={() => {
                setIsChoiceModalOpen(false);
                router.push({ pathname: '/(tabs)/recurring-expenses', params: { mode: 'recurring' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                <Ionicons name="repeat-outline" size={24} color={colors.brand.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Conta Recorrente</Text>
                <Text style={styles.choiceSubtitle}>Gasto/ganho que se repete mensalmente</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsChoiceModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={isDetailModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.detailContainer}>
            <View style={styles.detailCard}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderInfo}>
                  <Text style={styles.formTitle}>Detalhes</Text>
                  <Text style={[styles.formSubtitle, { color: selectedAccount?._type === 'payable' ? colors.danger : colors.brand.teal }]}>
                    {selectedAccount?._type === 'payable' ? 'Conta a Pagar' : 'Conta a Receber'}
                  </Text>
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
                  <Text style={styles.detailLabel}>Vencimento</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={[styles.badge, { alignSelf: 'flex-start' }]}>
                      <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
                      <Text style={styles.badgeText}>
                        {selectedAccount?.isLate ? 'Venceu dia' : 'Vence dia'} {selectedAccount?.dueDay}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailField}>
                  <Text style={styles.detailLabel}>Valor</Text>
                  <Text style={[styles.detailAmountText, { color: selectedAccount?._type === 'payable' ? colors.danger : colors.brand.teal }]}>
                    {selectedAccount ? fmt(selectedAccount.amount) : ''}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: selectedAccount?._type === 'payable' ? colors.danger : colors.brand.teal }]}
                  onPress={() => {
                    if (selectedAccount) {
                      setTransactionAmount(selectedAccount.amount.toString());
                      setTransactionWalletId('');
                      setTransactionBankAccountId('');
                      setTransactionCreditCardId('');
                      setTransactionUseCredit(false);
                      setIsDetailModalOpen(false);
                      setIsTransactionModalOpen(true);
                    }
                  }}
                >
                  <Ionicons name="cash-outline" size={20} color={colors.white} />
                  <Text style={styles.actionBtnText}>{selectedAccount?._type === 'payable' ? 'Pagar' : 'Receber'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Transaction Modal */}
      <Modal visible={isTransactionModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.formContainer}>
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View style={styles.formHeaderInfo}>
                    <Text style={styles.formTitle}>
                      {selectedAccount?._type === 'payable' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => {
                    setIsTransactionModalOpen(false);
                    setIsDetailModalOpen(true);
                  }}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollBody}>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Conta</Text>
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
                      keyboardType="decimal-pad"
                      value={transactionAmount}
                      onChangeText={setTransactionAmount}
                    />
                  </View>

                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>
                      {selectedAccount?._type === 'payable' ? 'Carteira / Conta (Origem)' : 'Destino do Valor (Carteira / Conta)'}
                    </Text>
                    <TouchableOpacity style={styles.selectInput} onPress={() => {
                      setIsTransactionModalOpen(false);
                      setIsWalletSelectOpen(true);
                    }}>
                      <Text style={[styles.selectInputText, !transactionWalletId && { color: colors.text.muted }]}>
                        {transactionWalletId
                          ? (transactionUseCredit 
                              ? `Cartão de Crédito - ${wallets?.find(w => w.id === transactionWalletId)?.accounts.find(a => a.id === transactionBankAccountId)?.creditCards.find(c => c.id === transactionCreditCardId)?.brand}` 
                              : transactionBankAccountId 
                                ? `Conta Bancária - ${wallets?.find(w => w.id === transactionWalletId)?.accounts.find(a => a.id === transactionBankAccountId)?.bankName}`
                                : `Dinheiro Vivo - ${wallets?.find(w => w.id === transactionWalletId)?.name}`)
                          : 'Selecionar conta'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: selectedAccount?._type === 'payable' ? colors.danger : colors.brand.teal }]}
                    onPress={handleTransactionSubmit}
                    disabled={payMutation.isPending || receiveMutation.isPending}
                  >
                    {payMutation.isPending || receiveMutation.isPending ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.actionBtnText}>Confirmar</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <OriginPicker
        visible={isWalletSelectOpen}
        onClose={() => {
          setIsWalletSelectOpen(false);
          setIsTransactionModalOpen(true);
        }}
        wallets={wallets || []}
        selectedWalletId={transactionWalletId || null}
        selectedBankAccountId={transactionBankAccountId || null}
        selectedCreditCardId={transactionCreditCardId || null}
        onSelect={(selection) => {
          setTransactionWalletId(selection.walletId);
          setTransactionBankAccountId(selection.bankAccountId || '');
          setTransactionCreditCardId(selection.creditCardId || '');
          setTransactionUseCredit(selection.creditCardId !== null);
          setIsWalletSelectOpen(false);
          setIsTransactionModalOpen(true);
        }}
        allowCreditCards={selectedAccount?._type === 'payable'}
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
  headerTitle: { ...typography.h2, color: colors.text.primary, fontWeight: '700' },
  headerSubtitle: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...shadow.lg,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  totalCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  totalCardLabel: { ...typography.caption, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  totalCardValue: { ...typography.h3, marginTop: 4 },
  
  typeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  typePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  typePillText: { ...typography.caption, fontWeight: '600', color: colors.text.secondary },
  typePillTextActive: { color: colors.white },

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
    backgroundColor: colors.text.secondary,
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
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBoxDay: { ...typography.h3, fontWeight: '700', lineHeight: 28 },
  dateBoxLabel: { ...typography.caption, fontSize: 8, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardAmount: {
    ...typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 4,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 9,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  choiceModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  choiceModalContent: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadow.lg,
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.lg, textAlign: 'center' },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  choiceTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary },
  choiceSubtitle: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  cancelBtn: { padding: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  cancelBtnText: { ...typography.body, fontWeight: '600', color: colors.danger },
  
  detailContainer: { height: '60%' },
  detailCard: {
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
  formSubtitle: { ...typography.caption, fontWeight: '700', marginTop: 2 },
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
  detailBody: { padding: spacing.lg, gap: spacing.lg },
  detailField: { gap: 4 },
  detailLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: '600', textTransform: 'uppercase' },
  detailValueText: { ...typography.body, color: colors.text.primary, fontSize: 16 },
  detailAmountText: { ...typography.h2 },
  actionBtn: {
    flexDirection: 'row',
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.md,
  },
  actionBtnText: { ...typography.button, color: colors.white },

  formContainer: { height: '92%' },
  formCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
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
  selectInputText: { color: colors.text.primary, ...typography.body },
});
