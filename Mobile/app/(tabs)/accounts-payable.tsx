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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { accountsPayableApi } from '@/api/endpoints/accountsPayable';
import { decodeJwt } from '@/utils/jwt';

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
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  
  // 1 = Semana, 2 = Mês, 3 = Ano
  const [dateFilter, setDateFilter] = useState<number>(2);

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
              <View key={index} style={styles.card}>
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
                </View>
              </View>
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
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
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
});
