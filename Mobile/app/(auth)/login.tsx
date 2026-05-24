import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    console.log('[LoginScreen] Form submitted:', { email: data.email });
    setIsLoading(true);
    try {
      console.log('[LoginScreen] Calling store login...');
      await login(data.email, data.password);
      console.log('[LoginScreen] Login success!');
    } catch (err: any) {
      console.error('[LoginScreen] Login error:', err);
      Alert.alert('Falha no login', err?.message ?? 'Verifique suas credenciais e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.bg.primary, colors.bg.secondary]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header / Logo */}
          <View style={styles.header}>
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.logoContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="wallet" size={36} color={colors.white} />
            </LinearGradient>
            <Text style={styles.appName}>Family Finance</Text>
            <Text style={styles.tagline}>Controle financeiro familiar</Text>
          </View>

          {/* Card de Login */}
          <View style={styles.card}>
            <Text style={styles.title}>Bem-vindo de volta 👋</Text>
            <Text style={styles.subtitle}>Faça login para acessar sua conta</Text>

            {/* E-mail */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>E-mail</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                    <Ionicons name="mail-outline" size={18} color={colors.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="seu@email.com"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            {/* Senha */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Senha</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.text.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.text.muted}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            {/* Botão */}
            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.btnText}>Entrar</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Rodapé */}
            <Text style={styles.footerText}>
              Sem conta? Fale com o administrador da família.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },

  // Header
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.lg,
  },
  appName: { ...typography.h1, color: colors.text.primary },
  tagline: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },

  // Card
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.xl },

  // Fields
  fieldWrapper: { marginBottom: spacing.md },
  label: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.xs, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputError: { borderColor: colors.danger },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, ...typography.body, color: colors.text.primary },
  eyeBtn: { padding: spacing.xs },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },

  // Button
  btnWrapper: { marginTop: spacing.lg, borderRadius: radius.md, overflow: 'hidden', ...shadow.md },
  btn: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btnText: { ...typography.button, color: colors.white },

  footerText: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
