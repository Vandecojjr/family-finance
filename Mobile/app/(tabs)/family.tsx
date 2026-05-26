import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, FamilyMemberResponse } from '@/api/endpoints/family';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { RecurringExpense } from '@/types';

const MEMBER_COLORS = [colors.brand.primary, colors.brand.teal, colors.brand.accent];

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FamilyScreen() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  // Selections
  const [selectedMember, setSelectedMember] = useState<FamilyMemberResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  // Form local states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<number>(1); // 1 = Fixed, 2 = Variable
  const [frequency, setFrequency] = useState<number>(2); // 1 = Weekly, 2 = Monthly, 3 = Yearly
  const [dueDay, setDueDay] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = useState('');

  // Queries
  const { data: family, isLoading: isLoadingFamily, error: familyError, refetch: refetchFamily } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getMyFamily(),
  });

  const { data: expenses, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['recurringExpenses', selectedMember?.id],
    queryFn: () => recurringExpensesApi.getByMemberId(selectedMember!.id),
    enabled: !!selectedMember,
  });

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
      Alert.alert('Erro ao excluir gasto', err.message);
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

      if (!description || isNaN(parsedAmount) || isNaN(parsedDueDay)) {
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
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
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

    saveMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Família</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Informação', 'Para adicionar membros, utilize o painel de administração.')}>
          <Ionicons name="person-add-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoadingFamily ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : familyError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar os dados da família.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetchFamily()}>
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Banner família */}
          <LinearGradient colors={colors.gradient.primary} style={styles.familyBanner}>
            <Ionicons name="home" size={32} color={colors.white} />
            <Text style={styles.familyName}>{family?.name ?? 'Minha Família'}</Text>
            <Text style={styles.familyCount}>
              {family?.members?.length ?? 0} {family?.members?.length === 1 ? 'membro' : 'membros'}
            </Text>
          </LinearGradient>

          {/* Membros */}
          <Text style={styles.sectionTitle}>Membros da Família</Text>
          <Text style={styles.sectionSubtitle}>Selecione um membro para gerenciar seus gastos recorrentes</Text>
          
          {family?.members?.map((m, index) => {
            const memberColor = MEMBER_COLORS[index % MEMBER_COLORS.length] ?? colors.brand.primary;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.memberCard}
                activeOpacity={0.8}
                onPress={() => setSelectedMember(m)}
              >
                <View style={[styles.avatar, { backgroundColor: `${memberColor}33` }]}>
                  <Text style={[styles.avatarText, { color: memberColor }]}>{getInitials(m.name)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberRole}>Membro da Família</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            );
          })}

          {/* Ações */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Conta</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Sair da conta</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── MODAL: GERENCIADOR DE GASTOS RECORRENTES ──────────────────────────── */}
      <Modal visible={!!selectedMember} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeContainer}>
            <View style={styles.modalContentCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>Gastos Recorrentes</Text>
                  <Text style={styles.modalSubtitle}>{selectedMember?.name}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMember(null)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* List / Loader */}
              {isLoadingExpenses ? (
                <View style={styles.modalBodyLoader}>
                  <ActivityIndicator size="large" color={colors.brand.primary} />
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  {/* Action Bar */}
                  <TouchableOpacity style={styles.createBtn} onPress={openCreateForm}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                    <Text style={styles.createBtnText}>Novo Gasto Recorrente</Text>
                  </TouchableOpacity>

                  {expenses && expenses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="calendar-outline" size={48} color={colors.text.muted} />
                      <Text style={styles.emptyText}>Nenhum gasto recorrente cadastrado.</Text>
                    </View>
                  ) : (
                    expenses?.map((item) => (
                      <View key={item.id} style={styles.expenseCard}>
                        {/* Upper row */}
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
                                Período: {new Date(item.startDate).toLocaleDateString('pt-BR')} 
                                {item.endDate ? ` a ${new Date(item.endDate).toLocaleDateString('pt-BR')}` : ' (Indeterminado)'}
                              </Text>
                            )}
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
                            <Ionicons name="create-outline" size={18} color={colors.brand.primary} />
                            <Text style={[styles.iconBtnText, { color: colors.brand.primary }]}>Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.iconBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]} 
                            onPress={() => handleDelete(item.id)}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            <Text style={[styles.iconBtnText, { color: colors.danger }]}>Excluir</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                  )}
                </ScrollView>
              )}
            </View>
          </SafeAreaView>
        </View>

        {/* ── SUB-MODAL: FORMULÁRIO (CRIAÇÃO / EDIÇÃO) ───────────────────────── */}
        <Modal visible={isFormOpen} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <SafeAreaView style={styles.formContainer}>
                <View style={styles.formCard}>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderInfo}>
                      <Text style={styles.modalTitle}>
                        {editingExpense ? 'Editar Gasto' : 'Novo Gasto Recorrente'}
                      </Text>
                      <Text style={styles.modalSubtitle}>{selectedMember?.name}</Text>
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
                        placeholder="Ex: Assinatura Netflix, Aluguel"
                        placeholderTextColor={colors.text.muted}
                        value={description}
                        onChangeText={setDescription}
                      />
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  errorText: { ...typography.body, color: colors.text.muted, textAlign: 'center' },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.brand.primary, borderRadius: radius.md },
  retryBtnText: { ...typography.body, color: colors.white, fontWeight: '600' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  familyBanner: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.lg,
  },
  familyName: { ...typography.h2, color: colors.white },
  familyCount: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  
  sectionTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.xs },
  sectionSubtitle: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm },
  
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h4 },
  memberInfo: { flex: 1 },
  memberName: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  memberRole: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  actionText: { ...typography.body, fontWeight: '600' },

  // ── ESTILOS MODAL DETALHES ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSafeContainer: {
    height: '85%',
  },
  modalContentCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderInfo: { flex: 1 },
  modalTitle: { ...typography.h3, color: colors.text.primary },
  modalSubtitle: { ...typography.bodySmall, color: colors.brand.teal, fontWeight: '600', marginTop: 2 },
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
  modalBodyLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    ...shadow.sm,
  },
  createBtnText: { ...typography.button, color: colors.white },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: { ...typography.bodySmall, color: colors.text.muted },

  // ── CARDS DE GASTOS ────────────────────────────────────────────────────────
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
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusLabel: { ...typography.bodySmall, fontWeight: '600' },
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

  // ── ESTILOS FORMULÁRIO ─────────────────────────────────────────────────────
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
});
