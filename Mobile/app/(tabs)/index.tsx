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
} from 'react-native';
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

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardScreen() {
  const { logout, tokens } = useAuthStore();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { showBalances, toggleBalances } = usePreferenceStore();
  const [memberId, setMemberId] = useState<string | null>(null);
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
    enabled: !!memberId,
  });

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

        <View style={isDesktop ? styles.desktopRow : undefined}>
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
        </View>

        {/* ── Projeções Financeiras (Planejamento) ─────────── */}
        <View style={styles.section}>
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
        </View>

        {/* ── Distribuição das Projeções por Categoria ─────────── */}
        <View style={styles.section}>
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
        </View>

        {/* ── Atalhos de Acesso Rápido ─────────────────────── */}
        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={isDesktop ? styles.desktopShortcutsRow : styles.shortcutsGrid}>
            <View style={isDesktop ? styles.shortcutCardDesktop : styles.shortcutRow}>
              <TouchableOpacity 
                style={styles.shortcutCard} 
                onPress={() => router.push('/accounts-payable')}
              >
                <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(124, 106, 255, 0.12)' }]}>
                  <Ionicons name="cash-outline" size={24} color={colors.brand.primary} />
                </View>
                <Text style={styles.shortcutText}>A Pagar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shortcutCard} 
                onPress={() => router.push('/accounts-receivable')}
              >
                <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(0, 212, 170, 0.12)' }]}>
                  <Ionicons name="receipt-outline" size={24} color={colors.brand.teal} />
                </View>
                <Text style={styles.shortcutText}>A Receber</Text>
              </TouchableOpacity>
            </View>

            <View style={isDesktop ? styles.shortcutCardDesktop : styles.shortcutRow}>
              <TouchableOpacity 
                style={styles.shortcutCard} 
                onPress={() => router.push('/recurring-expenses')}
              >
                <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(255, 107, 157, 0.12)' }]}>
                  <Ionicons name="repeat-outline" size={24} color={colors.brand.accent} />
                </View>
                <Text style={styles.shortcutText}>Recorrentes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shortcutCard} 
                onPress={() => router.push('/wallets')}
              >
                <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(124, 106, 255, 0.12)' }]}>
                  <Ionicons name="wallet-outline" size={24} color={colors.brand.primary} />
                </View>
                <Text style={styles.shortcutText}>Carteiras</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
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

  // Shortcuts Grid
  shortcutsGrid: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.sm,
  },
  shortcutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutText: {
    ...typography.caption,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  desktopRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  desktopShortcutsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shortcutCardDesktop: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
});
