import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api/endpoints/transactions';
import { categoriesApi } from '@/api/endpoints/categories';
import { walletsApi } from '@/api/endpoints/wallets';
import { Transaction, Category, Wallet } from '@/types';
import DatePicker from '@/components/DatePicker';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TransactionsScreen() {
  const queryClient = useQueryClient();

  // Queries
  const { data: transactions = [], isLoading: isLoadingTransactions, isError: isErrorTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.list(),
  });

  // Refetch data every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      refetchTransactions();
    }, [refetchTransactions])
  );

  // Calculate Metrics
  const metrics = React.useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.type === 1) {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions]);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<number>(2); // Default to Expense
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<{
    walletId: string;
    bankAccountId: string | null;
    creditCardId: string | null;
    label: string;
  } | null>(null);

  // Picker States
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isOriginPickerOpen, setIsOriginPickerOpen] = useState(false);

  // Flattened Categories for display
  const targetCategories = React.useMemo(() => {
    const filterType = type === 1 ? 'Income' : 'Expense';
    const list: { id: string; name: string }[] = [];
    categories
      .filter((c) => c.type === filterType)
      .forEach((parent) => {
        list.push({ id: parent.id, name: parent.name });
        if (parent.subCategories && parent.subCategories.length > 0) {
          parent.subCategories.forEach((sub) => {
            list.push({ id: sub.id, name: `${parent.name} ➔ ${sub.name}` });
          });
        }
      });
    return list;
  }, [categories, type]);

  // Flattened resource options (Wallets, Accounts, CreditCards)
  const originOptions = React.useMemo(() => {
    const list: {
      walletId: string;
      bankAccountId: string | null;
      creditCardId: string | null;
      label: string;
      typeLabel: string;
    }[] = [];

    wallets.forEach((w) => {
      // Option 1: Cash Balance
      list.push({
        walletId: w.id,
        bankAccountId: null,
        creditCardId: null,
        label: `Dinheiro Vivo (${w.name})`,
        typeLabel: 'Carteira (Cash)',
      });

      w.accounts.forEach((acc) => {
        // Option 2: Bank Account
        list.push({
          walletId: w.id,
          bankAccountId: acc.id,
          creditCardId: null,
          label: `${acc.bankName} - ${acc.type === 5 ? 'Poupança' : 'Corrente'} (${w.name})`,
          typeLabel: 'Conta Bancária',
        });

        acc.creditCards.forEach((card) => {
          // Option 3: Credit Card
          list.push({
            walletId: w.id,
            bankAccountId: acc.id,
            creditCardId: card.id,
            label: `${card.brand} •••• ${card.lastFourDigits} (${acc.bankName})`,
            typeLabel: 'Cartão de Crédito',
          });
        });
      });
    });

    return list;
  }, [wallets]);

  // Mutations
  const registerMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (!description.trim()) throw new Error('A descrição é obrigatória.');
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('O valor deve ser maior que zero.');
      if (!categoryId) throw new Error('Selecione uma categoria.');
      if (!selectedOrigin) throw new Error('Selecione uma origem/destino de saldo.');

      await transactionsApi.register({
        description,
        amount: parsedAmount,
        type,
        date,
        categoryId,
        walletId: selectedOrigin.walletId,
        bankAccountId: selectedOrigin.bankAccountId,
        creditCardId: selectedOrigin.creditCardId,
        notes: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Erro ao registrar transação', err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir/estornar transação', err.message);
    },
  });

  const handleDelete = (t: Transaction) => {
    Alert.alert(
      'Confirmar Estorno',
      `Deseja realmente remover esta transação de "${t.description}"? Isso estornará o valor de ${fmt(t.amount)} no saldo correspondente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Estornar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(t.id),
        },
      ]
    );
  };

  const closeForm = () => {
    setDescription('');
    setAmount('');
    setType(2);
    setDate(new Date().toISOString().split('T')[0] ?? '');
    setCategoryId('');
    setSelectedOrigin(null);
    setModalOpen(false);
  };

  const getOriginText = (t: Transaction) => {
    if (t.creditCardDisplayName) {
      return t.creditCardDisplayName;
    }
    if (t.bankAccountName) {
      return `Conta ${t.bankAccountName}`;
    }
    if (t.walletName) {
      return `Dinheiro (${t.walletName})`;
    }
    return 'Origem Removida';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Lançamentos</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => refetchTransactions()}>
          <Ionicons name="refresh-outline" size={20} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {isLoadingTransactions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Carregando lançamentos...</Text>
        </View>
      ) : isErrorTransactions ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>Erro ao carregar lançamentos.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetchTransactions()}>
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Top Metrics Banner */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Entradas</Text>
              <Text style={[styles.metricVal, { color: colors.success }]}>
                {fmt(metrics.totalIncome)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Saídas</Text>
              <Text style={[styles.metricVal, { color: colors.danger }]}>
                {fmt(metrics.totalExpense)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Balanço</Text>
              <Text style={[styles.metricVal, { color: metrics.balance >= 0 ? colors.brand.primary : colors.danger }]}>
                {fmt(metrics.balance)}
              </Text>
            </View>
          </View>

          {/* List of Transactions */}
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.text.muted} />
              <Text style={styles.emptyText}>Nenhuma transação lançada.</Text>
              <Text style={styles.emptySubText}>
                Toque no botão "+" no canto inferior para registrar sua primeira despesa ou receita!
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: item.type === 1 ? `${colors.success}18` : `${colors.danger}18` },
                    ]}
                  >
                    <Ionicons
                      name={item.type === 1 ? 'trending-up' : 'trending-down'}
                      size={20}
                      color={item.type === 1 ? colors.success : colors.danger}
                    />
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.desc}>{item.description}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.catText}>{item.categoryName}</Text>
                      <Text style={styles.dot}>·</Text>
                      <Text style={styles.originText}>{getOriginText(item)}</Text>
                      <Text style={styles.dot}>·</Text>
                      <Text style={styles.dateText}>
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={[styles.amount, { color: item.type === 1 ? colors.success : colors.danger }]}>
                      {item.type === 1 ? '+' : '-'}{fmt(item.amount)}
                    </Text>

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                      <Ionicons name="trash-outline" size={16} color={colors.text.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setModalOpen(true)}>
        <LinearGradient colors={colors.gradient.primary} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Register Transaction Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Lançamento</Text>
              <TouchableOpacity onPress={closeForm}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Type Switcher */}
            <View style={styles.typeSelectorContainer}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 2 && styles.typeBtnExpense]}
                onPress={() => {
                  setType(2);
                  setCategoryId('');
                }}
              >
                <Text style={[styles.typeBtnText, type === 2 && styles.typeBtnTextActive]}>Saída / Despesa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 1 && styles.typeBtnIncome]}
                onPress={() => {
                  setType(1);
                  setCategoryId('');
                }}
              >
                <Text style={[styles.typeBtnText, type === 1 && styles.typeBtnTextActive]}>Entrada / Receita</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Padaria, Uber, Salário Quinzenal"
                  placeholderTextColor={colors.text.muted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Date */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Data do Lançamento</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setIsDatePickerOpen(true)}
                >
                  <Text style={styles.pickerTriggerText}>
                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.brand.primary} />
                </TouchableOpacity>
              </View>

              {/* Category Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoria</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setIsCategoryPickerOpen(true)}
                >
                  <Text style={styles.pickerTriggerText}>
                    {categoryId
                      ? targetCategories.find((c) => c.id === categoryId)?.name ?? 'Selecionar Categoria'
                      : 'Selecionar Categoria'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Origin Balance Resource */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Destino / Origem do Lançamento</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setIsOriginPickerOpen(true)}
                >
                  <Text style={styles.pickerTriggerText}>
                    {selectedOrigin ? selectedOrigin.label : 'Selecionar Carteira, Conta ou Cartão'}
                  </Text>
                  <Ionicons name="wallet-outline" size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: type === 1 ? colors.brand.teal : colors.brand.primary },
                ]}
                onPress={() => registerMutation.mutate()}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Salvar Lançamento</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker Modal */}
      <DatePicker
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        value={date}
        onSelect={(d: string) => {
          setDate(d);
          setIsDatePickerOpen(false);
        }}
      />

      {/* Category Picker Modal */}
      <Modal visible={isCategoryPickerOpen} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsCategoryPickerOpen(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Selecione a Categoria</Text>
            <FlatList
              data={targetCategories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: spacing.xs }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    categoryId === item.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setCategoryId(item.id);
                    setIsCategoryPickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, categoryId === item.id && styles.pickerItemTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Origin Picker Modal */}
      <Modal visible={isOriginPickerOpen} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsOriginPickerOpen(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Origem / Destino do Saldo</Text>
            <FlatList
              data={originOptions}
              keyExtractor={(item, index) => `${item.walletId}-${item.bankAccountId}-${item.creditCardId}-${index}`}
              contentContainerStyle={{ gap: spacing.xs }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    selectedOrigin?.walletId === item.walletId &&
                      selectedOrigin?.bankAccountId === item.bankAccountId &&
                      selectedOrigin?.creditCardId === item.creditCardId &&
                      styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedOrigin(item);
                    setIsOriginPickerOpen(false);
                  }}
                >
                  <View style={styles.originPickerRow}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedOrigin?.walletId === item.walletId &&
                          selectedOrigin?.bankAccountId === item.bankAccountId &&
                          selectedOrigin?.creditCardId === item.creditCardId &&
                          styles.pickerItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.originPickerSub}>{item.typeLabel}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typography.body, color: colors.text.secondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  metricsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    ...shadow.sm,
  },
  metricTitle: { ...typography.caption, color: colors.text.secondary },
  metricVal: { ...typography.body, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { ...typography.h3, color: colors.text.primary },
  emptySubText: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', paddingHorizontal: spacing.md },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  desc: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  catText: { fontSize: 11, color: colors.brand.primary, fontWeight: '500' },
  originText: { fontSize: 11, color: colors.brand.teal, fontWeight: '500' },
  dateText: { fontSize: 11, color: colors.text.muted },
  dot: { fontSize: 11, color: colors.text.muted, marginHorizontal: 4 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amount: { ...typography.body, fontWeight: '700' },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: { position: 'absolute', bottom: 32, right: spacing.lg, borderRadius: radius.full, overflow: 'hidden', ...shadow.lg },
  fabGradient: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h3, color: colors.text.primary },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  typeBtnExpense: {
    backgroundColor: colors.brand.accent,
  },
  typeBtnIncome: {
    backgroundColor: colors.brand.teal,
  },
  typeBtnText: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  typeBtnTextActive: { color: colors.white },
  formContent: { gap: spacing.md, paddingBottom: spacing.xl },
  formGroup: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.text.secondary },
  input: {
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    ...typography.body,
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerTriggerText: { ...typography.body, color: colors.text.primary },
  submitBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadow.sm,
  },
  submitBtnText: { ...typography.button, color: colors.white },
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pickerContent: {
    width: '100%',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    maxHeight: '60%',
  },
  pickerTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.md, textAlign: 'center' },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  pickerItemActive: {
    backgroundColor: 'rgba(124, 106, 255, 0.15)',
  },
  pickerItemText: { ...typography.body, color: colors.text.primary },
  pickerItemTextActive: { color: colors.brand.primary, fontWeight: '600' },
  originPickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  originPickerSub: { fontSize: 10, color: colors.text.muted },
});
