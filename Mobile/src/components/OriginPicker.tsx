import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { Wallet } from '@/types';

interface OriginSelection {
  walletId: string;
  bankAccountId: string | null;
  creditCardId: string | null;
  useCredit?: boolean | null;
  label: string;
}

interface OriginPickerProps {
  visible: boolean;
  onClose: () => void;
  wallets: Wallet[];
  selectedWalletId: string | null;
  selectedBankAccountId: string | null;
  selectedCreditCardId: string | null;
  selectedUseCredit?: boolean | null;
  onSelect: (selection: OriginSelection) => void;
  allowCreditCards?: boolean;
}

export function OriginPicker({
  visible,
  onClose,
  wallets,
  selectedWalletId,
  selectedBankAccountId,
  selectedCreditCardId,
  selectedUseCredit,
  onSelect,
  allowCreditCards = true,
}: OriginPickerProps) {

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Escolha a Conta / Carteira</Text>
                <Text style={styles.subtitle}>Selecione a origem ou destino do saldo</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {wallets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="wallet-outline" size={48} color={colors.text.muted} />
                  <Text style={styles.emptyText}>Nenhuma carteira encontrada.</Text>
                </View>
              ) : (
                wallets.map((wallet) => (
                  <View key={wallet.id} style={styles.walletGroup}>
                    {/* Wallet Section Header */}
                    <View style={styles.walletHeader}>
                      <Ionicons name="folder-open-outline" size={14} color={colors.text.secondary} />
                      <Text style={styles.walletName}>{wallet.name}</Text>
                    </View>

                    {/* 1. Dinheiro Vivo (Cash) */}
                    {(() => {
                      const isSelected =
                        selectedWalletId === wallet.id &&
                        selectedBankAccountId === null &&
                        selectedCreditCardId === null;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.optionRow,
                            isSelected && styles.optionSelected,
                          ]}
                          onPress={() => {
                            onSelect({
                              walletId: wallet.id,
                              bankAccountId: null,
                              creditCardId: null,
                              useCredit: null,
                              label: `Dinheiro Vivo (${wallet.name})`,
                            });
                            onClose();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.iconWrap, { backgroundColor: 'rgba(0, 214, 170, 0.12)' }]}>
                            <Ionicons name="cash" size={16} color={colors.brand.teal} />
                          </View>
                          <View style={styles.optionInfo}>
                            <Text style={[styles.optionLabel, isSelected && styles.selectedText]}>
                              Dinheiro Vivo
                            </Text>
                            <Text style={styles.optionSub}>
                              Saldo em caixa: {fmt(wallet.cashBalance)}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })()}

                    {/* 2. Bank Accounts */}
                    {wallet.accounts && wallet.accounts.map((acc) => {
                      const isAccSelectedDebit =
                        selectedWalletId === wallet.id &&
                        selectedBankAccountId === acc.id &&
                        selectedCreditCardId === null &&
                        selectedUseCredit !== true;

                      const isAccSelectedCredit =
                        selectedWalletId === wallet.id &&
                        selectedBankAccountId === acc.id &&
                        selectedCreditCardId === null &&
                        selectedUseCredit === true;
                      
                      return (
                        <View key={acc.id}>
                          <TouchableOpacity
                            style={[
                              styles.optionRow,
                              isAccSelectedDebit && styles.optionSelected,
                            ]}
                            onPress={() => {
                              onSelect({
                                walletId: wallet.id,
                                bankAccountId: acc.id,
                                creditCardId: null,
                                useCredit: false,
                                label: `${acc.bankName} - Saldo (${wallet.name})`,
                              });
                              onClose();
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(124, 106, 255, 0.12)' }]}>
                              <Ionicons name="business" size={16} color={colors.brand.primary} />
                            </View>
                            <View style={styles.optionInfo}>
                              <Text style={[styles.optionLabel, isAccSelectedDebit && styles.selectedText]}>
                                {acc.bankName} - Saldo
                              </Text>
                              <Text style={styles.optionSub}>
                                {acc.type === 5 ? 'Conta Poupança' : 'Conta Corrente'} • Saldo: {fmt(acc.debitBalance)}
                              </Text>
                            </View>
                            {isAccSelectedDebit && (
                              <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                            )}
                          </TouchableOpacity>

                          {/* Cheque Especial / Crédito da Conta */}
                          {acc.creditLimit > 0 && (
                            <TouchableOpacity
                              style={[
                                styles.optionRow,
                                styles.creditCardRow,
                                isAccSelectedCredit && styles.optionSelected,
                              ]}
                              onPress={() => {
                                onSelect({
                                  walletId: wallet.id,
                                  bankAccountId: acc.id,
                                  creditCardId: null,
                                  useCredit: true,
                                  label: `${acc.bankName} - Crédito Especial (${wallet.name})`,
                                });
                                onClose();
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.treeConnector} />
                              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 165, 0, 0.12)' }]}>
                                <Ionicons name="alert-circle-outline" size={16} color="#FFA500" />
                              </View>
                              <View style={styles.optionInfo}>
                                <Text style={[styles.optionLabel, isAccSelectedCredit && styles.selectedText]}>
                                  {acc.bankName} - Crédito Especial
                                </Text>
                                <Text style={styles.optionSub}>
                                  Limite Disp: {fmt(acc.remainingCreditLimit)}
                                </Text>
                              </View>
                              {isAccSelectedCredit && (
                                <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                              )}
                            </TouchableOpacity>
                          )}

                          {/* 3. Credit Cards */}
                          {allowCreditCards && acc.creditCards && acc.creditCards.map((card) => {
                            const isCardSelected =
                              selectedWalletId === wallet.id &&
                              selectedBankAccountId === acc.id &&
                              selectedCreditCardId === card.id;

                            return (
                              <TouchableOpacity
                                key={card.id}
                                style={[
                                  styles.optionRow,
                                  styles.creditCardRow,
                                  isCardSelected && styles.optionSelected,
                                ]}
                                onPress={() => {
                                  onSelect({
                                    walletId: wallet.id,
                                    bankAccountId: acc.id,
                                    creditCardId: card.id,
                                    useCredit: null,
                                    label: `${card.brand} •••• ${card.lastFourDigits} (${acc.bankName})`,
                                  });
                                  onClose();
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={styles.treeConnector} />
                                <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 107, 157, 0.12)' }]}>
                                  <Ionicons name="card" size={16} color={colors.brand.accent} />
                                </View>
                                <View style={styles.optionInfo}>
                                  <Text style={[styles.optionLabel, isCardSelected && styles.selectedText]}>
                                    {card.brand} •••• {card.lastFourDigits}
                                  </Text>
                                  <Text style={styles.optionSub}>
                                    Limite disp: {fmt(card.remainingLimit)}
                                  </Text>
                                </View>
                                {isCardSelected && (
                                  <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
    maxHeight: '85%',
  },
  container: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    marginTop: spacing.md,
    maxHeight: 450,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  walletGroup: {
    marginBottom: spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  walletName: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  optionSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}08`,
  },
  creditCardRow: {
    marginLeft: spacing.lg,
    position: 'relative',
  },
  treeConnector: {
    position: 'absolute',
    left: -12,
    top: -12,
    bottom: '50%',
    width: 12,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  optionSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
});
