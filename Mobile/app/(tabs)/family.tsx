import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';

const MOCK_MEMBERS = [
  { id: '1', name: 'João Silva', role: 'Administrador', initials: 'JS', color: colors.brand.primary },
  { id: '2', name: 'Maria Silva', role: 'Membro', initials: 'MS', color: colors.brand.teal },
  { id: '3', name: 'Pedro Silva', role: 'Membro', initials: 'PS', color: colors.brand.accent },
];

export default function FamilyScreen() {
  const { logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Família</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="person-add-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner família */}
        <LinearGradient colors={colors.gradient.primary} style={styles.familyBanner}>
          <Ionicons name="home" size={32} color={colors.white} />
          <Text style={styles.familyName}>Família Silva</Text>
          <Text style={styles.familyCount}>{MOCK_MEMBERS.length} membros</Text>
        </LinearGradient>

        {/* Membros */}
        <Text style={styles.sectionTitle}>Membros</Text>
        {MOCK_MEMBERS.map((m) => (
          <TouchableOpacity key={m.id} style={styles.memberCard} activeOpacity={0.8}>
            <View style={[styles.avatar, { backgroundColor: `${m.color}33` }]}>
              <Text style={[styles.avatarText, { color: m.color }]}>{m.initials}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        ))}

        {/* Ações */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Conta</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text.primary },
  addBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  familyBanner: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, ...shadow.lg },
  familyName: { ...typography.h2, color: colors.white },
  familyCount: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  sectionTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.xs },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadow.sm },
  avatar: { width: 48, height: 48, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h4 },
  memberInfo: { flex: 1 },
  memberName: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  memberRole: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  actionText: { ...typography.body, fontWeight: '600' },
});
