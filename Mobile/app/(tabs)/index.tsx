import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/endpoints/dashboard';
import { familyApi } from '@/api/endpoints/family';
import { decodeJwt } from '@/utils/jwt';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { CategoryPieChart } from '@/components/CategoryPieChart';
import { usePreferenceStore } from '@/stores/preferenceStore';
import { CustomCalendar } from '@/components/CustomCalendar';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardScreen() {
  const { logout, tokens, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { showBalances, toggleBalances } = usePreferenceStore();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken);
      if (decoded?.memberId) {
        setMemberId(decoded.memberId);
      }
    }
  }, [tokens]);

  // Query dashboard data
  const { data: dashboardData, refetch: refetchDashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboardData', memberId],
    queryFn: () => dashboardApi.getInitialDashboard(),
    enabled: !!memberId && isAuthenticated,
  });

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

  // Query family data for member name lookup
  const { data: familyData, refetch: refetchFamily, isLoading: loadingFamily } = useQuery({
    queryKey: ['myFamily', memberId],
    queryFn: () => familyApi.getMyFamily(),
    enabled: !!memberId,
  });

  useEffect(() => {
    if (isFocused && memberId) {
      refetchDashboard();
      refetchFamily();
    }
  }, [isFocused, memberId, refetchDashboard, refetchFamily]);

  const memberName = familyData?.members?.find(m => m.id === memberId)?.name ?? 'Membro';
  
  // Dashboard values
  const general = dashboardData?.general;
  const totalBalance = general?.totalBalance ?? 0;
  const totalIncomed = general?.totalIncomed ?? 0;
  const totalExpensed = general?.totalExpensed ?? 0;
  
  const totalProjectedIncome = general?.totalProjectedIncome ?? 0;
  const totalProjectedExpenditure = general?.totalProjectedExpenditure ?? 0;
  const projectedNet = totalProjectedIncome - totalProjectedExpenditure;

  const totalCreditLimit = general?.totalCreditLimit ?? 0;
  const totalCreditExpensed = general?.totalCreditExpensed ?? 0;
  const totalCreditRemainingLimit = general?.totalCreditRemainingLimit ?? 0;
  const creditUsagePercentage = totalCreditLimit > 0 
    ? Math.min((totalCreditExpensed / totalCreditLimit) * 100, 100) 
    : 0;

  if (loadingDashboard && !dashboardData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.loadingText}>Carregando painel financeiro...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {memberName}! 👋</Text>
            <Text style={styles.subtitle}>Resumo financeiro da família</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleBalances} style={styles.toggleBalancesBtn}>
              <Ionicons 
                name={showBalances ? 'eye-outline' : 'eye-off-outline'} 
                size={22} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Atalhos de Acesso Rápido (Top) ─────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.topShortcutsContainer}>
          <TouchableOpacity style={styles.topShortcutItem} onPress={() => router.push('/accounts-payable')}>
            <View style={[styles.topShortcutBubble, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Ionicons name="cash-outline" size={24} color={colors.brand.primary} />
            </View>
            <Text style={styles.topShortcutText}>A Pagar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topShortcutItem} onPress={() => router.push('/accounts-receivable')}>
            <View style={[styles.topShortcutBubble, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
              <Ionicons name="receipt-outline" size={24} color={colors.brand.accent} />
            </View>
            <Text style={styles.topShortcutText}>A Receber</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topShortcutItem} onPress={() => router.push('/recurring-expenses')}>
            <View style={[styles.topShortcutBubble, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Ionicons name="repeat-outline" size={24} color={colors.danger} />
            </View>
            <Text style={styles.topShortcutText}>Fixas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topShortcutItem} onPress={() => router.push('/wallets')}>
            <View style={[styles.topShortcutBubble, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="wallet-outline" size={24} color={colors.warning} />
            </View>
            <Text style={styles.topShortcutText}>Carteiras</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={isDesktop ? styles.desktopRow : undefined}>
          {/* ── Saldo Geral Consolidado ─────────────────────── */}
          <LinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.balanceCard, isDesktop && { flex: 1, marginBottom: 0 }]}
          >
            <Text style={styles.balanceLabel}>Saldo Consolidado</Text>
            <Text style={styles.balanceValue}>
              {showBalances ? fmt(totalBalance) : 'R$ ••••••'}
            </Text>

            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={styles.balanceIconWrap}>
                  <Ionicons name="arrow-up-circle" size={16} color={colors.success} />
                </View>
                <View>
                  <Text style={styles.balanceItemLabel}>Receitas do Mês</Text>
                  <Text style={styles.balanceItemValue}>
                    {showBalances ? fmt(totalIncomed) : 'R$ ••••••'}
                  </Text>
                </View>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <View style={styles.balanceIconWrap}>
                  <Ionicons name="arrow-down-circle" size={16} color={colors.danger} />
                </View>
                <View>
                  <Text style={styles.balanceItemLabel}>Despesas do Mês</Text>
                  <Text style={styles.balanceItemValue}>
                    {showBalances ? fmt(totalExpensed) : 'R$ ••••••'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* ── Cartão de Crédito ────────────────────────────── */}
          <View style={[styles.section, isDesktop && { flex: 1, marginBottom: 0 }]}>
            <Text style={styles.sectionTitle}>Cartão de Crédito</Text>
            <View style={styles.creditCard}>
              <View style={styles.creditHeader}>
                <View style={styles.creditIconWrapper}>
                  <Ionicons name="card" size={22} color={colors.brand.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.creditLabel}>Crédito Utilizado</Text>
                  <Text style={styles.creditValue}>
                    {showBalances ? fmt(totalCreditExpensed) : 'R$ ••••••'}
                  </Text>
                </View>
              </View>

              <View style={styles.creditLimitContainer}>
                <Text style={styles.creditLimitText}>
                  Limite: {showBalances ? fmt(totalCreditLimit) : 'R$ ••••••'} • Disponível: {showBalances ? fmt(totalCreditRemainingLimit) : 'R$ ••••••'}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${creditUsagePercentage}%` }]} />
                </View>
                <Text style={styles.progressPercentage}>{creditUsagePercentage.toFixed(0)}% utilizado</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Projeções Financeiras (Planejamento) ─────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Projeções do Mês</Text>
          <View style={styles.projectionsContainer}>
            <View style={styles.projectionGrid}>
              <View style={styles.projectionBox}>
                <View style={styles.projectionHeader}>
                  <Ionicons name="trending-up" size={18} color={colors.success} />
                  <Text style={styles.projectionBoxLabel}>Receita Prevista</Text>
                </View>
                <Text style={styles.projectionBoxValue}>
                  {showBalances ? fmt(totalProjectedIncome) : 'R$ ••••••'}
                </Text>
              </View>

              <View style={styles.projectionBox}>
                <View style={styles.projectionHeader}>
                  <Ionicons name="trending-down" size={18} color={colors.danger} />
                  <Text style={styles.projectionBoxLabel}>Despesa Prevista</Text>
                </View>
                <Text style={styles.projectionBoxValue}>
                  {showBalances ? fmt(totalProjectedExpenditure) : 'R$ ••••••'}
                </Text>
              </View>
            </View>

            <View style={styles.projectedNetWrapper}>
              <Text style={styles.projectedNetLabel}>Resultado Previsto do Mês:</Text>
              <Text 
                style={[
                  styles.projectedNetValue, 
                  { color: projectedNet >= 0 ? colors.success : colors.danger }
                ]}
              >
                {showBalances ? fmt(projectedNet) : 'R$ ••••••'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Distribuição das Projeções por Categoria ─────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuição das Projeções</Text>
          <View style={isDesktop ? styles.desktopRow : undefined}>
            <View style={isDesktop && { flex: 1 }}>
              <CategoryPieChart
                data={dashboardData?.projectedIncomesByCategory ?? []}
                title="Receitas Previstas por Categoria"
                emptyMessage="Nenhuma receita prevista para este mês."
              />
            </View>
            <View style={isDesktop && { flex: 1 }}>
              <CategoryPieChart
                data={dashboardData?.projectedExpensesByCategory ?? []}
                title="Despesas Previstas por Categoria"
                emptyMessage="Nenhuma despesa prevista para este mês."
              />
            </View>
          </View>
        </Animated.View>

      </ScrollView>

      {/* ── FLOATING ACTION BUTTONS ─────────────────────────────── */}
      <View style={styles.fabContainer}>
        {/* Calendar FAB */}
        <TouchableOpacity 
          style={[styles.fab, { marginBottom: spacing.md }]} 
          activeOpacity={0.85}
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
          activeOpacity={0.85}
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

      {/* Choice Modal */}
      <Modal visible={isChoiceModalOpen} transparent animationType="fade">
        <View style={styles.choiceModalOverlay}>
          <View style={styles.choiceModalContent}>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: spacing.lg }]}>Acesso Rápido</Text>
            
            <TouchableOpacity 
              style={styles.choiceBtn} 
              onPress={() => {
                setIsChoiceModalOpen(false);
                router.navigate({ pathname: '/(tabs)/transactions', params: { action: 'new_expense' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                <Ionicons name="trending-down" size={24} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Despesa</Text>
                <Text style={styles.choiceSubtitle}>Registrar um novo gasto</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.choiceBtn} 
              onPress={() => {
                setIsChoiceModalOpen(false);
                router.navigate({ pathname: '/(tabs)/transactions', params: { action: 'new_income' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(0, 212, 170, 0.15)' }]}>
                <Ionicons name="trending-up" size={24} color={colors.brand.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Receita</Text>
                <Text style={styles.choiceSubtitle}>Registrar um novo ganho</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.choiceBtn} 
              onPress={() => {
                setIsChoiceModalOpen(false);
                router.navigate({ pathname: '/(tabs)/transactions', params: { action: 'new_transfer' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="swap-horizontal" size={24} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
            <Text style={styles.choiceTitle}>Transferência</Text>
                <Text style={styles.choiceSubtitle}>Mover saldo entre suas contas</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.choiceBtn} 
              onPress={() => {
                setIsChoiceModalOpen(false);
                router.navigate({ pathname: '/(tabs)/recurring-expenses', params: { action: 'new_planned' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Ionicons name="calendar-outline" size={24} color={colors.warning} />
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
                router.navigate({ pathname: '/(tabs)/recurring-expenses', params: { action: 'new_recurring' } });
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                <Ionicons name="repeat" size={24} color={colors.brand.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Conta Recorrente</Text>
                <Text style={styles.choiceSubtitle}>Despesas ou receitas fixas mensais</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsChoiceModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CALENDAR MODAL ─────────────────────────────── */}
      <Modal visible={isCalendarModalOpen} animationType="slide" transparent>
        <View style={styles.choiceModalOverlay}>
          <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center', justifyContent: 'center' }}>
            <View style={[styles.choiceModalContent, { padding: 0, overflow: 'hidden' }]}>
              <View style={{ backgroundColor: colors.bg.elevated, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Calendário</Text>
                  <Text style={styles.choiceSubtitle}>Visualize suas contas no mês</Text>
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
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.primary, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm }}>
                    <View style={[{ width: 40, height: 40, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md }, { backgroundColor: item.type === 'payable' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 212, 170, 0.1)' }]}>
                      <Ionicons 
                        name={item.type === 'payable' ? 'arrow-down' : 'arrow-up'} 
                        size={20} 
                        color={item.type === 'payable' ? colors.danger : colors.success} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.body, color: colors.text.primary, fontWeight: '600' }}>{item.title}</Text>
                      <Text style={{ ...typography.caption, color: colors.text.secondary }}>{item.isPaid ? 'Pago' : 'Pendente'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ ...typography.body, fontWeight: '700', color: item.type === 'payable' ? colors.danger : colors.success }}>
                        {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  container: { flex: 1, paddingHorizontal: spacing.lg, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  
  // Loading
  loadingContainer: { flex: 1, backgroundColor: colors.bg.primary, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typography.body, color: colors.text.secondary },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg },
  greeting: { ...typography.h3, color: colors.text.primary },
  subtitle: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  toggleBalancesBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.bg.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  logoutBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.bg.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },

  // Top Shortcuts
  topShortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  topShortcutItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  topShortcutBubble: {
    width: 60,
    height: 60,
    borderRadius: 30, // perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topShortcutText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Balance card
  balanceCard: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.xl, ...shadow.lg },
  balanceLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { ...typography.h1, color: colors.white, marginTop: spacing.xs, marginBottom: spacing.lg },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceIconWrap: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  balanceItemLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  balanceItemValue: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },
  balanceDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: spacing.md },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.md },

  // Credit Card
  creditCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  creditIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 157, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditLabel: { ...typography.caption, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  creditValue: { ...typography.h4, color: colors.text.primary, fontWeight: '700', marginTop: 2 },
  creditLimitContainer: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  creditLimitText: { ...typography.caption, color: colors.text.muted },

  // Progress Bar
  progressContainer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand.accent,
    borderRadius: radius.full,
  },
  progressPercentage: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'right',
  },

  // Projections
  projectionsContainer: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.sm,
  },
  projectionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  projectionBox: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  projectionBoxLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  projectionBoxValue: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  projectedNetWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  projectedNetLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  projectedNetValue: {
    ...typography.body,
    fontWeight: '700',
  },

  desktopRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  
  // FAB and Choice Modal
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
  modalTitle: { ...typography.h3, color: colors.text.primary },
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
});
