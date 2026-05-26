import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { decodeJwt } from '@/utils/jwt';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

// Dados mock — serão substituídos por queries React Query futuramente
const MOCK_SUMMARY = { income: 8500, expense: 3240, balance: 12650 };
const MOCK_TRANSACTIONS = [
  { id: '1', description: 'Salário', amount: 8500, type: 'Income' as const, date: '2026-05-01', category: 'Renda' },
  { id: '2', description: 'Supermercado', amount: -420, type: 'Expense' as const, date: '2026-05-10', category: 'Alimentação' },
  { id: '3', description: 'Conta de luz', amount: -180, type: 'Expense' as const, date: '2026-05-12', category: 'Utilidades' },
  { id: '4', description: 'Freelance', amount: 1200, type: 'Income' as const, date: '2026-05-15', category: 'Renda Extra' },
  { id: '5', description: 'Farmácia', amount: -95, type: 'Expense' as const, date: '2026-05-18', category: 'Saúde' },
];
const MOCK_WALLETS = [
  { id: '1', name: 'Conta Principal', balance: 8400, icon: 'business-outline' as const },
  { id: '2', name: 'Poupança', balance: 4250, icon: 'save-outline' as const },
];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardScreen() {
  const { logout, tokens } = useAuthStore();
  const router = useRouter();
  const isFocused = useIsFocused();

  // Decode memberId from tokens
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken);
      if (decoded?.memberId) {
        setMemberId(decoded.memberId);
      }
    }
  }, [tokens]);

  // Query total fixed recurring expenses
  const { data: totalRecurring = 0, refetch } = useQuery({
    queryKey: ['recurringExpensesTotalFixed', memberId],
    queryFn: () => recurringExpensesApi.getTotalFixedByMemberId(memberId!),
    enabled: !!memberId,
  });

  useEffect(() => {
    if (isFocused && memberId) {
      refetch();
    }
  }, [isFocused, memberId, refetch]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, bem-vindo! 👋</Text>
            <Text style={styles.subtitle}>Aqui está seu resumo financeiro</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ── Card de Saldo ────────────────────────────────── */}
        <LinearGradient
          colors={colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Saldo Total</Text>
          <Text style={styles.balanceValue}>{fmt(MOCK_SUMMARY.balance)}</Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="arrow-up-circle" size={16} color={colors.success} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Receitas</Text>
                <Text style={styles.balanceItemValue}>{fmt(MOCK_SUMMARY.income)}</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconWrap}>
                <Ionicons name="arrow-down-circle" size={16} color={colors.danger} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Despesas</Text>
                <Text style={styles.balanceItemValue}>{fmt(MOCK_SUMMARY.expense)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Card de Gastos Recorrentes ────────────────────── */}
        <TouchableOpacity
          style={styles.recurringCard}
          activeOpacity={0.85}
          onPress={() => router.push('/recurring-expenses')}
        >
          <View style={styles.recurringContent}>
            <View style={styles.recurringIconWrapper}>
              <Ionicons name="calendar" size={22} color={colors.brand.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recurringLabel}>Gastos Fixos Previstos</Text>
              <Text style={styles.recurringValue}>{fmt(totalRecurring)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>

        {/* ── Carteiras ───────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Carteiras</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletsList}>
            {MOCK_WALLETS.map((w) => (
              <View key={w.id} style={styles.walletCard}>
                <LinearGradient colors={colors.gradient.card} style={styles.walletCardInner}>
                  <View style={styles.walletIcon}>
                    <Ionicons name={w.icon} size={20} color={colors.brand.primary} />
                  </View>
                  <Text style={styles.walletName}>{w.name}</Text>
                  <Text style={styles.walletBalance}>{fmt(w.balance)}</Text>
                </LinearGradient>
              </View>
            ))}
            <TouchableOpacity style={styles.addWalletCard}>
              <Ionicons name="add-circle-outline" size={28} color={colors.brand.primary} />
              <Text style={styles.addWalletText}>Nova{'\n'}carteira</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Últimas Transações ──────────────────────────── */}
        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas Transações</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {MOCK_TRANSACTIONS.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'Income' ? `${colors.success}22` : `${colors.danger}22` }]}>
                <Ionicons
                  name={tx.type === 'Income' ? 'trending-up' : 'trending-down'}
                  size={18}
                  color={tx.type === 'Income' ? colors.success : colors.danger}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDescription}>{tx.description}</Text>
                <Text style={styles.txCategory}>{tx.category}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.type === 'Income' ? colors.success : colors.danger }]}>
                  {tx.type === 'Income' ? '+' : ''}{fmt(tx.amount)}
                </Text>
                <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString('pt-BR')}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  container: { flex: 1, paddingHorizontal: spacing.lg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg },
  greeting: { ...typography.h3, color: colors.text.primary },
  subtitle: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.text.primary },
  seeAll: { ...typography.bodySmall, color: colors.brand.primary, fontWeight: '600' },

  // Wallet cards
  walletsList: { paddingRight: spacing.md, gap: spacing.md },
  walletCard: { width: 160, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  walletCardInner: { padding: spacing.md, gap: spacing.sm },
  walletIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: `${colors.brand.primary}22`, justifyContent: 'center', alignItems: 'center' },
  walletName: { ...typography.bodySmall, color: colors.text.secondary },
  walletBalance: { ...typography.h4, color: colors.text.primary },
  addWalletCard: { width: 100, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  addWalletText: { ...typography.caption, color: colors.text.muted, textAlign: 'center' },

  // Transactions
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  txIcon: { width: 40, height: 40, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDescription: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  txCategory: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { ...typography.body, fontWeight: '700' },
  txDate: { ...typography.caption, color: colors.text.muted, marginTop: 2 },

  // Recurring Card
  recurringCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  recurringContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recurringIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 157, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringLabel: { ...typography.caption, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  recurringValue: { ...typography.h4, color: colors.text.primary, fontWeight: '700', marginTop: 2 },
});
