import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '@/theme';

const MOCK = [
  { id: '1', description: 'Salário', amount: 8500, type: 'Income' as const, date: '2026-05-01', category: 'Renda' },
  { id: '2', description: 'Supermercado', amount: 420, type: 'Expense' as const, date: '2026-05-10', category: 'Alimentação' },
  { id: '3', description: 'Conta de luz', amount: 180, type: 'Expense' as const, date: '2026-05-12', category: 'Utilidades' },
  { id: '4', description: 'Freelance', amount: 1200, type: 'Income' as const, date: '2026-05-15', category: 'Renda Extra' },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TransactionsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Lançamentos</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={20} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.icon, { backgroundColor: item.type === 'Income' ? `${colors.success}22` : `${colors.danger}22` }]}>
              <Ionicons name={item.type === 'Income' ? 'trending-up' : 'trending-down'} size={20} color={item.type === 'Income' ? colors.success : colors.danger} />
            </View>
            <View style={styles.info}>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.cat}>{item.category} · {new Date(item.date).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={[styles.amount, { color: item.type === 'Income' ? colors.success : colors.danger }]}>
              {item.type === 'Income' ? '+' : '-'}{fmt(item.amount)}
            </Text>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient colors={colors.gradient.primary} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text.primary },
  filterBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.bg.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  desc: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  cat: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  amount: { ...typography.body, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 32, right: spacing.lg, borderRadius: radius.full, overflow: 'hidden' },
  fabGradient: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
});
