import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { adminApi } from '@/api/endpoints/admin';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius, typography, shadow } from '@/theme';

export default function AdminPanel() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  
  const [familyName, setFamilyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateFamily = async () => {
    if (!familyName || !adminName || !adminEmail || !adminPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      await adminApi.createFamily({
        familyName,
        adminName,
        adminEmail,
        adminPassword,
      });
      Alert.alert('Sucesso', 'Família e admin criados com sucesso!');
      setFamilyName('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar família.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Painel Master</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>Criar nova Família</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome da Família</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Família Silva"
              placeholderTextColor={colors.text.muted}
              value={familyName}
              onChangeText={setFamilyName}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome do Administrador</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do usuário admin"
              placeholderTextColor={colors.text.muted}
              value={adminName}
              onChangeText={setAdminName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>E-mail do Administrador</Text>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.text.muted}
              value={adminEmail}
              onChangeText={setAdminEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Senha do Administrador</Text>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              placeholderTextColor={colors.text.muted}
              value={adminPassword}
              onChangeText={setAdminPassword}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleCreateFamily} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Criar Família e Admin</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.brand.primary },
  subtitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.lg },
  logoutBtn: { padding: spacing.sm, backgroundColor: colors.danger, borderRadius: radius.md },
  logoutText: { color: colors.white, fontWeight: 'bold' },
  formGroup: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.text.secondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
  },
  btn: {
    backgroundColor: colors.brand.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
