import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';

const MOCK_WALLETS = [
  { id: '1', name: 'Conta Principal', balance: 8400, type: 'Corrente', icon: 'business-outline' as const, color: colors.brand.primary },
  { id: '2', name: 'Poupança',        balance: 4250, type: 'Poupança',  icon: 'save-outline' as const, color: colors.brand.teal },
  { id: '3', name: 'Cartão de Crédito', balance: -1250, type: 'Crédito', icon: 'card-outline' as const, color: colors.brand.accent },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const total = MOCK_WALLETS.reduce((s, w) => s + w.balance, 0);

export default function WalletsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Carteiras</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patrimônio total */}
        <LinearGradient colors={colors.gradient.primary} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Patrimônio líquido</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </LinearGradient>

        {/* Cards de carteira */}
        {MOCK_WALLETS.map((w) => (
          <TouchableOpacity key={w.id} style={styles.card} activeOpacity={0.8}>
            <View style={[styles.cardIcon, { backgroundColor: `${w.color}22` }]}>
              <Ionicons name={w.icon} size={22} color={w.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{w.name}</Text>
              <Text style={styles.cardType}>{w.type}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardBalance, { color: w.balance < 0 ? colors.danger : colors.text.primary }]}>
                {fmt(w.balance)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text.primary },
  addBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  totalCard: { borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.sm, ...shadow.lg },
  totalLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { ...typography.h1, color: colors.white, marginTop: spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadow.sm },
  cardIcon: { width: 48, height: 48, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  cardType: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardBalance: { ...typography.body, fontWeight: '700' },
});
