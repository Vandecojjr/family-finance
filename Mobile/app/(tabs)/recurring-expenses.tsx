import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, FamilyMemberResponse } from '@/api/endpoints/family';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { categoriesApi } from '@/api/endpoints/categories';
import { decodeJwt } from '@/utils/jwt';
import { RecurringExpense } from '@/types';
import { useIsFocused } from '@react-navigation/native';

const MEMBER_COLORS = [colors.brand.primary, colors.brand.teal, colors.brand.accent];

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function RecurringExpensesScreen() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();

  // Decode memberId from logged-in user token
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberResponse | null>(null);

  useEffect(() => {
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken);
      if (decoded?.memberId) {
        setCurrentMemberId(decoded.memberId);
      }
    }
  }, [tokens]);

  // Fetch Family to list members
  const { data: family, isLoading: isLoadingFamily } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getMyFamily(),
  });

  // Set default selected member to logged-in user when family data is loaded
  useEffect(() => {
    if (family?.members && family.members.length > 0 && !selectedMember) {
      const self = family.members.find((m) => m.id === currentMemberId);
      if (self) {
        setSelectedMember(self);
      } else if (family.members[0]) {
        setSelectedMember(family.members[0]);
      }
    }
  }, [family, currentMemberId, selectedMember]);

  // Fetch Recurring Expenses for selected member
  const { data: expenses, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['recurringExpenses', selectedMember?.id],
    queryFn: () => recurringExpensesApi.getByMemberId(selectedMember!.id),
    enabled: !!selectedMember,
  });

  // Fetch Categories for selection
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const flattenedExpenseCategories = React.useMemo(() => {
    if (!categories) return [];
    const list: { id: string; name: string }[] = [];
    categories
      .filter(c => c.type === 'Expense')
      .forEach(parent => {
        list.push({ id: parent.id, name: parent.name });
        if (parent.subCategories && parent.subCategories.length > 0) {
          parent.subCategories.forEach(sub => {
            list.push({ id: sub.id, name: `${parent.name} ➔ ${sub.name}` });
          });
        }
      });
    return list;
  }, [categories]);

  useEffect(() => {
    if (isFocused && selectedMember?.id) {
      refetchExpenses();
    }
  }, [isFocused, selectedMember?.id, refetchExpenses]);

  // Calculate totals by frequency for active recurring expenses (both fixed and variable)
  const activeExpenses = expenses ? expenses.filter(x => x.isActive) : [];

  const totalWeekly = activeExpenses
    .filter(x => x.frequency === 1)
    .reduce((sum, x) => sum + x.amount, 0);

  const totalMonthly = activeExpenses
    .filter(x => x.frequency === 2)
    .reduce((sum, x) => sum + x.amount, 0);

  const totalYearly = activeExpenses
    .filter(x => x.frequency === 3)
    .reduce((sum, x) => sum + x.amount, 0);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<number>(1); // 1 = Fixed, 2 = Variable
  const [frequency, setFrequency] = useState<number>(2); // 1 = Weekly, 2 = Monthly, 3 = Yearly
  const [dueDay, setDueDay] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await recurringExpensesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpensesTotalFixed'] });
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message);
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza de que deseja excluir este gasto recorrente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id) 
        }
      ]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      const parsedDueDay = parseInt(dueDay, 10);

      if (!description || isNaN(parsedAmount) || isNaN(parsedDueDay) || !categoryId) {
        throw new Error('Preencha os campos obrigatórios corretamente.');
      }

      if (editingExpense) {
        await recurringExpensesApi.update(editingExpense.id, {
          description,
          amount: parsedAmount,
          type,
          frequency,
          dueDay: parsedDueDay,
          startDate,
          endDate: endDate || null,
          categoryId,
        });
      } else {
        await recurringExpensesApi.create({
          description,
          amount: parsedAmount,
          type,
          frequency,
          dueDay: parsedDueDay,
          startDate,
          endDate: endDate || null,
          memberId: selectedMember!.id,
          categoryId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpensesTotalFixed'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Erro ao salvar gasto', err.message);
    },
  });

  // Actions
  const openCreateForm = () => {
    setEditingExpense(null);
    setDescription('');
    setAmount('');
    setType(1);
    setFrequency(2);
    setDueDay('10');
    setStartDate(new Date().toISOString().split('T')[0] ?? '');
    setEndDate('');
    setCategoryId('');
    setIsFormOpen(true);
  };

  const openEditForm = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setType(expense.type);
    setFrequency(expense.frequency);
    setDueDay(expense.dueDay.toString());
    setStartDate(expense.startDate.split('T')[0] ?? '');
    setEndDate(expense.endDate ? expense.endDate.split('T')[0] ?? '' : '');
    setCategoryId(expense.categoryId);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    setCategoryId('');
  };

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('Validação', 'A descrição é obrigatória.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert('Validação', 'O valor deve ser um número válido maior ou igual a zero.');
      return;
    }
    const parsedDue = parseInt(dueDay, 10);
    if (isNaN(parsedDue) || parsedDue < 1 || parsedDue > 31) {
      Alert.alert('Validação', 'O dia de vencimento deve estar entre 1 e 31.');
      return;
    }
    if (!startDate) {
      Alert.alert('Validação', 'A data de início é obrigatória.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Validação', 'A categoria é obrigatória.');
      return;
    }

    saveMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gastos Recorrentes</Text>
          <Text style={styles.subtitle}>Gerencie despesas recorrentes da família</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateForm}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Member Selector chips */}
      {family?.members && family.members.length > 0 && (
        <View style={styles.selectorWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={family.members}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.memberChipsList}
            renderItem={({ item, index }) => {
              const isSelected = selectedMember?.id === item.id;
              const memberColor = MEMBER_COLORS[index % MEMBER_COLORS.length] ?? colors.brand.primary;
              return (
                <TouchableOpacity
                  style={[
                    styles.memberChip,
                    isSelected && styles.memberChipSelected,
                    isSelected && { borderColor: memberColor },
                  ]}
                  onPress={() => setSelectedMember(item)}
                >
                  <View style={[styles.avatarMini, { backgroundColor: `${memberColor}22` }]}>
                    <Text style={[styles.avatarMiniText, { color: memberColor }]}>{getInitials(item.name)}</Text>
                  </View>
                  <Text style={[styles.memberChipName, isSelected && styles.memberChipNameSelected]}>
                    {item.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Resumo de Totais por Frequência */}
      {!isLoadingExpenses && !isLoadingFamily && selectedMember && expenses && expenses.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Semanal</Text>
            <Text style={[styles.summaryValue, { color: colors.brand.teal }]}>
              {fmt(totalWeekly)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Mensal</Text>
            <Text style={[styles.summaryValue, { color: colors.brand.primary }]}>
              {fmt(totalMonthly)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Anual</Text>
            <Text style={[styles.summaryValue, { color: colors.brand.accent }]}>
              {fmt(totalYearly)}
            </Text>
          </View>
        </View>
      )}

      {/* Main content body */}
      {isLoadingExpenses || isLoadingFamily ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {expenses && expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.text.muted} />
              <Text style={styles.emptyText}>Nenhum gasto recorrente cadastrado para este membro.</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openCreateForm}>
                <Text style={styles.emptyAddBtnText}>Criar Primeiro Gasto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            expenses?.map((item) => (
              <View key={item.id} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>
                      {item.description}
                    </Text>
                    <Text style={styles.expenseDetails}>
                      Vence dia {item.dueDay} · {item.frequency === 1 ? 'Semanal' : item.frequency === 2 ? 'Mensal' : 'Anual'} · {item.type === 1 ? 'Fixo' : 'Variável'}
                    </Text>
                    {item.startDate && (
                      <Text style={styles.expensePeriod}>
                        Início: {new Date(item.startDate).toLocaleDateString('pt-BR')} 
                        {item.endDate ? ` · Fim: ${new Date(item.endDate).toLocaleDateString('pt-BR')}` : ' (Indeterminado)'}
                      </Text>
                    )}
                    {item.categoryName ? (
                      <View style={styles.categoryBadge}>
                        <Ionicons name="pricetag-outline" size={10} color={colors.brand.primary} />
                        <Text style={styles.categoryBadgeText}>{item.categoryName}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.expenseAmount, { color: colors.danger }]}>
                    {fmt(item.amount)}
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Controls */}
                <View style={styles.expenseControls}>
                  <View style={styles.actionGroup}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditForm(item)}>
                      <Ionicons name="create-outline" size={16} color={colors.brand.primary} />
                      <Text style={[styles.iconBtnText, { color: colors.brand.primary }]}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.iconBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]} 
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={[styles.iconBtnText, { color: colors.danger }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── FORMULÁRIO MODAL (Criação / Edição) ─────────────────────────────── */}
      <Modal visible={isFormOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.formContainer}>
              <View style={styles.formCard}>
                {/* Header */}
                <View style={styles.formHeader}>
                  <View style={styles.formHeaderInfo}>
                    <Text style={styles.formTitle}>
                      {editingExpense ? 'Editar Gasto' : 'Novo Gasto Recorrente'}
                    </Text>
                    <Text style={styles.formSubtitle}>Para {selectedMember?.name}</Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={closeForm}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.formScrollBody} keyboardShouldPersistTaps="handled">
                  {/* Descrição */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Assinatura Netflix, Academia"
                      placeholderTextColor={colors.text.muted}
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  {/* Categoria */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Categoria</Text>
                    <TouchableOpacity
                      style={styles.selectInput}
                      onPress={() => setIsCategoryModalOpen(true)}
                    >
                      <Text style={[styles.selectInputText, !categoryId && { color: colors.text.muted }]}>
                        {categoryId 
                          ? (flattenedExpenseCategories.find(c => c.id === categoryId)?.name ?? 'Categoria Selecionada') 
                          : 'Selecione uma categoria'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Valor e Dia Vencimento */}
                  <View style={styles.row}>
                    <View style={[styles.fieldWrapper, { flex: 1 }]}>
                      <Text style={styles.label}>{type === 2 ? 'Valor esperado (R$)' : 'Valor (R$)'}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={type === 2 ? 'Valor esperado (ex: 100.00)' : '0.00'}
                        placeholderTextColor={colors.text.muted}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                      />
                    </View>
                    <View style={[styles.fieldWrapper, { width: 120 }]}>
                      <Text style={styles.label}>Dia Vencimento</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="10"
                        placeholderTextColor={colors.text.muted}
                        keyboardType="numeric"
                        maxLength={2}
                        value={dueDay}
                        onChangeText={setDueDay}
                      />
                    </View>
                  </View>

                  {/* Tipo (Fixo / Variável) */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Tipo de Gasto</Text>
                    <View style={styles.segmentContainer}>
                      <TouchableOpacity
                        style={[styles.segmentBtn, type === 1 && styles.segmentActive]}
                        onPress={() => setType(1)}
                      >
                        <Text style={[styles.segmentText, type === 1 && styles.segmentTextActive]}>Fixo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, type === 2 && styles.segmentActive]}
                        onPress={() => setType(2)}
                      >
                        <Text style={[styles.segmentText, type === 2 && styles.segmentTextActive]}>Variável</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Frequência (Semanal / Mensal / Anual) */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Frequência de Cobrança</Text>
                    <View style={styles.segmentContainer}>
                      <TouchableOpacity
                        style={[styles.segmentBtn, frequency === 1 && styles.segmentActive]}
                        onPress={() => setFrequency(1)}
                      >
                        <Text style={[styles.segmentText, frequency === 1 && styles.segmentTextActive]}>Semanal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, frequency === 2 && styles.segmentActive]}
                        onPress={() => setFrequency(2)}
                      >
                        <Text style={[styles.segmentText, frequency === 2 && styles.segmentTextActive]}>Mensal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, frequency === 3 && styles.segmentActive]}
                        onPress={() => setFrequency(3)}
                      >
                        <Text style={[styles.segmentText, frequency === 3 && styles.segmentTextActive]}>Anual</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Datas */}
                  <View style={styles.row}>
                    <View style={[styles.fieldWrapper, { flex: 1 }]}>
                      <Text style={styles.label}>Data de Início</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={colors.text.muted}
                        value={startDate}
                        onChangeText={setStartDate}
                      />
                    </View>
                    <View style={[styles.fieldWrapper, { flex: 1 }]}>
                      <Text style={styles.label}>Data de Fim (Opcional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={colors.text.muted}
                        value={endDate}
                        onChangeText={setEndDate}
                      />
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                        <Text style={styles.saveBtnText}>
                          {editingExpense ? 'Atualizar Gasto' : 'Criar Gasto'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── SELETOR DE CATEGORIA MODAL ─────────────────────────────── */}
      <Modal visible={isCategoryModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.categorySelectorCard}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderInfo}>
                <Text style={styles.formTitle}>Selecionar Categoria</Text>
                <Text style={styles.formSubtitle}>Escolha uma categoria para o gasto recorrente</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCategoryModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={flattenedExpenseCategories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryListContent}
              renderItem={({ item }) => {
                const isSelected = categoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.categorySelectItem, isSelected && styles.categorySelectItemActive]}
                    onPress={() => {
                      setCategoryId(item.id);
                      setIsCategoryModalOpen(false);
                    }}
                  >
                    <Text style={[styles.categorySelectText, isSelected && styles.categorySelectTextActive]}>
                      {item.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.brand.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="pricetags-outline" size={48} color={colors.text.muted} />
                  <Text style={styles.emptyText}>Nenhuma categoria de gasto disponível. Crie-as na aba de Categorias primeiro.</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
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
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  
  // Member selector
  selectorWrapper: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberChipsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  memberChipSelected: {
    backgroundColor: colors.bg.elevated,
  },
  memberChipName: { ...typography.caption, color: colors.text.secondary, textTransform: 'none', fontWeight: '600' },
  memberChipNameSelected: { color: colors.text.primary },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 1.5,
    gap: spacing.md,
  },
  emptyText: { ...typography.bodySmall, color: colors.text.muted, textAlign: 'center', maxWidth: 250 },
  emptyAddBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    ...shadow.sm,
  },
  emptyAddBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: '700' },

  // Card layouts
  expenseCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  expenseDesc: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  expenseDetails: { ...typography.caption, color: colors.text.secondary, marginTop: 4 },
  expensePeriod: { ...typography.caption, color: colors.text.muted, marginTop: 2, fontSize: 10 },
  expenseAmount: { ...typography.body, fontWeight: '700' },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  expenseControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(124, 106, 255, 0.1)',
  },
  iconBtnText: { ...typography.caption, fontWeight: '700' },

  // Modal styles for forms
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  formContainer: {
    height: '92%',
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formHeaderInfo: { flex: 1 },
  formTitle: { ...typography.h3, color: colors.text.primary },
  formSubtitle: { ...typography.bodySmall, color: colors.brand.teal, fontWeight: '600', marginTop: 2 },
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
  formScrollBody: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  fieldWrapper: { gap: 6 },
  row: { flexDirection: 'row', gap: spacing.md },
  label: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  input: {
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 50,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    ...typography.body,
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.brand.primary,
    ...shadow.sm,
  },
  segmentText: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  segmentTextActive: { color: colors.white },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.teal,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.md,
  },
  saveBtnText: { ...typography.button, color: colors.white },
  
  // Summary row
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadow.sm,
  },
  summaryTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '700',
    marginTop: 4,
    fontSize: 13,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 50,
    paddingHorizontal: spacing.md,
  },
  selectInputText: {
    color: colors.text.primary,
    ...typography.body,
  },
  categorySelectorCard: {
    height: '75%',
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  categoryListContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  categorySelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categorySelectItemActive: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(124, 106, 255, 0.05)',
  },
  categorySelectText: {
    color: colors.text.primary,
    ...typography.body,
    fontWeight: '500',
  },
  categorySelectTextActive: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(124, 106, 255, 0.1)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  categoryBadgeText: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: '600',
    fontSize: 10,
  },
});
