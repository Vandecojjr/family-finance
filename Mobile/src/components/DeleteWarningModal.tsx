import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';

interface DeleteWarningModalProps {
  visible: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteWarningModal({
  visible,
  title,
  description,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteWarningModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={32} color={colors.warning} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={16} color={colors.brand.primary} />
            <Text style={styles.warningText}>
              Atenção: A exclusão deste item pode impactar diretamente nos seus planejamentos e histórico financeiro.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm} disabled={isLoading}>
              <Text style={styles.deleteBtnText}>
                {isLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(124, 106, 255, 0.08)',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.text.primary,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    ...typography.button,
    color: colors.white,
  },
});
