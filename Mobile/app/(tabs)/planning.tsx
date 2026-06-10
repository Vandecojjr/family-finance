import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography } from '@/theme';
import AccountsPayableScreen from './accounts-payable';
import AccountsReceivableScreen from './accounts-receivable';
import RecurringExpensesScreen from './recurring-expenses';

export default function PlanningScreen() {
  const [activeSegment, setActiveSegment] = useState<'payable' | 'receivable' | 'recurring'>('payable');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planejamento</Text>
        <Text style={styles.headerSubtitle}>Gerencie contas e gastos futuros</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'payable' && styles.segmentActive]}
          onPress={() => setActiveSegment('payable')}
        >
          <Text style={[styles.segmentText, activeSegment === 'payable' && styles.segmentTextActive]}>
            A Pagar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'receivable' && styles.segmentActive]}
          onPress={() => setActiveSegment('receivable')}
        >
          <Text style={[styles.segmentText, activeSegment === 'receivable' && styles.segmentTextActive]}>
            A Receber
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'recurring' && styles.segmentActive]}
          onPress={() => setActiveSegment('recurring')}
        >
          <Text style={[styles.segmentText, activeSegment === 'recurring' && styles.segmentTextActive]}>
            Recorrentes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeSegment === 'payable' && <AccountsPayableScreen isEmbedded />}
        {activeSegment === 'receivable' && <AccountsReceivableScreen isEmbedded />}
        {activeSegment === 'recurring' && <RecurringExpensesScreen isEmbedded />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.brand.primary,
  },
  segmentText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
