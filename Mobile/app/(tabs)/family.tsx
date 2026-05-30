import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { familyApi, FamilyMemberResponse } from '@/api/endpoints/family';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { recurringIncomesApi } from '@/api/endpoints/recurringIncomes';
import { categoriesApi } from '@/api/endpoints/categories';
import { RecurringExpense, RecurringIncome } from '@/types';
import DatePicker from '@/components/DatePicker';

const MEMBER_COLORS = [colors.brand.primary, colors.brand.teal, colors.brand.accent];

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FamilyScreen() {
  const { logout, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Active tab state: 'expense' (Gastos) or 'income' (Ganhos)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Selections
  const [selectedMember, setSelectedMember] = useState<FamilyMemberResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | RecurringIncome | null>(null);

  // Form local states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<number>(1); // 1 = Fixed, 2 = Variable
  const [frequency, setFrequency] = useState<number>(2); // 1 = Weekly, 2 = Monthly, 3 = Yearly
  const [dueDay, setDueDay] = useState('');
  const [dueDayType, setDueDayType] = useState<'regular' | 'business'>('regular');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  // Queries
  const { data: family, isLoading: isLoadingFamily, error: familyError, refetch: refetchFamily } = useQuery({
    queryKey: ['family', isAuthenticated],
    queryFn: () => familyApi.getMyFamily(),
    enabled: isAuthenticated,
  });

  // Refetch data every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetchFamily();
      }
    }, [refetchFamily, isAuthenticated])
  );

  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['recurringExpenses', selectedMember?.id],
    queryFn: () => recurringExpensesApi.getByMemberId(selectedMember!.id),
    enabled: !!selectedMember,
  });

  const { data: incomes, isLoading: isLoadingIncomes } = useQuery({
    queryKey: ['recurringIncomes', selectedMember?.id],
    queryFn: () => recurringIncomesApi.getByMemberId(selectedMember!.id),
    enabled: !!selectedMember,
  });

  // Fetch Categories for selection
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const flattenedCategories = React.useMemo(() => {
    if (!categories) return [];
    const targetType = activeTab === 'expense' ? 'Expense' : 'Income';
    const list: { id: string; name: string }[] = [];
    categories
      .filter(c => c.type === targetType)
      .forEach(parent => {
        list.push({ id: parent.id, name: parent.name });
        if (parent.subCategories && parent.subCategories.length > 0) {
          parent.subCategories.forEach(sub => {
            list.push({ id: sub.id, name: `${parent.name} ➔ ${sub.name}` });
          });
        }
      });
    return list;
  }, [categories, activeTab]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (activeTab === 'expense') {
        await recurringExpensesApi.delete(id);
      } else {
        await recurringIncomesApi.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpensesTotalFixed'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomesTotalFixed'] });
    },
    onError: (err: any) => {
      Alert.alert('Erro ao excluir item', err.message);
    },
  });

  const handleDelete = (id: string) => {
    const label = activeTab === 'expense' ? 'gasto recorrente' : 'ganho recorrente';
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza de que deseja excluir este ${label}?`,
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
      const rawDueDay = parseInt(dueDay, 10);
      const parsedDueDay = (activeTab === 'income' && dueDayType === 'business') ? (rawDueDay + 100) : rawDueDay;

      if (!description || isNaN(parsedAmount) || isNaN(parsedDueDay) || !categoryId) {
        throw new Error('Preencha os campos obrigatórios corretamente.');
      }

      if (activeTab === 'expense') {
        if (editingItem) {
          await recurringExpensesApi.update(editingItem.id, {
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
      } else {
        if (editingItem) {
          await recurringIncomesApi.update(editingItem.id, {
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
          await recurringIncomesApi.create({
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpensesTotalFixed'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomesTotalFixed'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Erro ao salvar', err.message);
    },
  });

  // Actions
  const openCreateForm = () => {
    setEditingItem(null);
    setDescription('');
    setAmount('');
    setType(1);
    setFrequency(2);
    setDueDayType('regular');
    setDueDay('10');
    setStartDate(new Date().toISOString().split('T')[0] ?? '');
    setEndDate('');
    setCategoryId('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: RecurringExpense | RecurringIncome) => {
    setEditingItem(item);
    setDescription(item.description);
    setAmount(item.amount.toString());
    setType(item.type);
    setFrequency(item.frequency);
    if (activeTab === 'income' && item.dueDay > 100) {
      setDueDayType('business');
      setDueDay((item.dueDay - 100).toString());
    } else {
      setDueDayType('regular');
      setDueDay(item.dueDay.toString());
    }
    setStartDate(item.startDate.split('T')[0] ?? '');
    setEndDate(item.endDate ? item.endDate.split('T')[0] ?? '' : '');
    setCategoryId(item.categoryId);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
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
      const label = activeTab === 'income' 
        ? (dueDayType === 'business' ? 'dia útil de entrada' : 'dia de entrada') 
        : 'dia de vencimento';
      Alert.alert('Validação', `O ${label} deve estar entre 1 e 31.`);
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

  const currentList = activeTab === 'expense' ? expenses : incomes;
  const isLoadingList = activeTab === 'expense' ? isLoadingExpenses : isLoadingIncomes;

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
          <Text style={styles.sectionSubtitle}>Selecione um membro para gerenciar seus gastos e ganhos recorrentes</Text>
          
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
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Gerenciamento</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/categories' as any)}>
            <Ionicons name="pricetags-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.actionText}>Categorias da Família</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { marginTop: spacing.sm }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Sair da conta</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── MODAL: GERENCIADOR DE RECORRÊNCIAS ──────────────────────────── */}
      <Modal visible={!!selectedMember} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeContainer}>
            <View style={styles.modalContentCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>Finanças Recorrentes</Text>
                  <Text style={styles.modalSubtitle}>{selectedMember?.name}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMember(null)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Tab Selector Inside Modal */}
              <View style={styles.tabOuterContainer}>
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'expense' && styles.tabActiveExpense]}
                    onPress={() => {
                      setActiveTab('expense');
                      closeForm();
                    }}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={18}
                      color={activeTab === 'expense' ? colors.white : colors.danger}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>Gastos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'income' && styles.tabActiveIncome]}
                    onPress={() => {
                      setActiveTab('income');
                      closeForm();
                    }}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={18}
                      color={activeTab === 'income' ? colors.white : colors.brand.teal}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>Ganhos</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* List / Loader */}
              {isLoadingList ? (
                <View style={styles.modalBodyLoader}>
                  <ActivityIndicator size="large" color={colors.brand.primary} />
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  {/* Action Bar */}
                  <TouchableOpacity 
                    style={[styles.createBtn, activeTab === 'income' && { backgroundColor: colors.brand.teal }]} 
                    onPress={openCreateForm}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                    <Text style={styles.createBtnText}>
                      {activeTab === 'expense' ? 'Novo Gasto Recorrente' : 'Novo Ganho Recorrente'}
                    </Text>
                  </TouchableOpacity>

                  {currentList && currentList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons 
                        name={activeTab === 'expense' ? "calendar-outline" : "trending-up-outline"} 
                        size={48} 
                        color={colors.text.muted} 
                      />
                      <Text style={styles.emptyText}>
                        {activeTab === 'expense' ? 'Nenhum gasto recorrente cadastrado.' : 'Nenhum ganho recorrente cadastrado.'}
                      </Text>
                    </View>
                  ) : (
                    currentList?.map((item) => (
                      <View key={item.id} style={styles.expenseCard}>
                        {/* Upper row */}
                        <View style={styles.expenseHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.expenseDesc}>
                              {item.description}
                            </Text>
                            <Text style={styles.expenseDetails}>
                               {activeTab === 'income' 
                                 ? (item.dueDay > 100 ? `Dia de entrada: ${item.dueDay - 100}º dia útil` : `Dia de entrada: ${item.dueDay}`) 
                                 : `Vence dia ${item.dueDay}`} · {item.frequency === 1 ? 'Semanal' : item.frequency === 2 ? 'Mensal' : 'Anual'} · {item.type === 1 ? 'Fixo' : 'Variável'}
                             </Text>
                             {item.startDate && (
                               <Text style={styles.expensePeriod}>
                                 Período: {formatDateDisplay(item.startDate.split('T')[0])} 
                                 {item.endDate ? ` a ${formatDateDisplay(item.endDate.split('T')[0])}` : ' (Indeterminado)'}
                               </Text>
                             )}
                            {item.categoryName ? (
                              <View style={[styles.categoryBadge, activeTab === 'income' && { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]}>
                                <Ionicons 
                                  name="pricetag-outline" 
                                  size={10} 
                                  color={activeTab === 'expense' ? colors.brand.primary : colors.brand.teal} 
                                />
                                <Text style={[styles.categoryBadgeText, activeTab === 'income' && { color: colors.brand.teal }]}>
                                  {item.categoryName}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.expenseAmount, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>
                            {activeTab === 'expense' ? '-' : '+'}{fmt(item.amount)}
                          </Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.cardDivider} />

                        {/* Controls */}
                        <View style={styles.expenseControls}>
                          <View style={styles.actionGroup}>
                            <TouchableOpacity 
                              style={[styles.iconBtn, activeTab === 'income' && { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]} 
                              onPress={() => openEditForm(item)}
                            >
                              <Ionicons 
                                name="create-outline" 
                                size={18} 
                                color={activeTab === 'expense' ? colors.brand.primary : colors.brand.teal} 
                              />
                              <Text style={[styles.iconBtnText, { color: activeTab === 'expense' ? colors.brand.primary : colors.brand.teal }]}>
                                Editar
                              </Text>
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
                        {editingItem 
                          ? (activeTab === 'expense' ? 'Editar Gasto' : 'Editar Ganho') 
                          : (activeTab === 'expense' ? 'Novo Gasto Recorrente' : 'Novo Ganho Recorrente')}
                      </Text>
                      <Text style={[styles.modalSubtitle, activeTab === 'income' && { color: colors.brand.teal }]}>
                        {selectedMember?.name}
                      </Text>
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
                        placeholder={activeTab === 'expense' ? "Ex: Assinatura Netflix, Aluguel" : "Ex: Salário, Rendimentos"}
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
                            ? (flattenedCategories.find(c => c.id === categoryId)?.name ?? 'Categoria Selecionada') 
                            : 'Selecione uma categoria'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Valor e Dia Vencimento/Entrada */}
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
                      <View style={[styles.fieldWrapper, { width: 130 }]}>
                        <Text style={styles.label}>
                          {activeTab === 'income' 
                            ? (dueDayType === 'business' ? 'Dia Útil Entrada' : 'Dia Entrada') 
                            : 'Dia Vencimento'}
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder={dueDayType === 'business' ? "5" : "10"}
                          placeholderTextColor={colors.text.muted}
                          keyboardType="numeric"
                          maxLength={2}
                          value={dueDay}
                          onChangeText={setDueDay}
                        />
                      </View>
                    </View>

                    {/* Tipo de Dia (apenas para Ganho Recorrente) */}
                    {activeTab === 'income' && (
                      <View style={styles.fieldWrapper}>
                        <Text style={styles.label}>Tipo de Dia de Entrada</Text>
                        <View style={styles.segmentContainer}>
                          <TouchableOpacity
                            style={[
                              styles.segmentBtn, 
                              dueDayType === 'regular' && styles.segmentActive,
                              dueDayType === 'regular' && { backgroundColor: colors.brand.teal }
                            ]}
                            onPress={() => setDueDayType('regular')}
                          >
                            <Text style={[styles.segmentText, dueDayType === 'regular' && styles.segmentTextActive]}>Dia do Mês</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.segmentBtn, 
                              dueDayType === 'business' && styles.segmentActive,
                              dueDayType === 'business' && { backgroundColor: colors.brand.teal }
                            ]}
                            onPress={() => setDueDayType('business')}
                          >
                            <Text style={[styles.segmentText, dueDayType === 'business' && styles.segmentTextActive]}>Dia Útil (ex: 5º útil)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Tipo (Fixo / Variável) */}
                    <View style={styles.fieldWrapper}>
                      <Text style={styles.label}>
                        {activeTab === 'expense' ? 'Tipo de Gasto' : 'Tipo de Ganho'}
                      </Text>
                      <View style={styles.segmentContainer}>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            type === 1 && styles.segmentActive,
                            type === 1 && activeTab === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
                          onPress={() => setType(1)}
                        >
                          <Text style={[styles.segmentText, type === 1 && styles.segmentTextActive]}>Fixo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            type === 2 && styles.segmentActive,
                            type === 2 && activeTab === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
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
                          style={[
                            styles.segmentBtn, 
                            frequency === 1 && styles.segmentActive,
                            frequency === 1 && activeTab === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
                          onPress={() => setFrequency(1)}
                        >
                          <Text style={[styles.segmentText, frequency === 1 && styles.segmentTextActive]}>Semanal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            frequency === 2 && styles.segmentActive,
                            frequency === 2 && activeTab === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
                          onPress={() => setFrequency(2)}
                        >
                          <Text style={[styles.segmentText, frequency === 2 && styles.segmentTextActive]}>Mensal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            frequency === 3 && styles.segmentActive,
                            frequency === 3 && activeTab === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
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
                        <TouchableOpacity
                          style={styles.selectInput}
                          onPress={() => setIsStartDatePickerOpen(true)}
                        >
                          <Text style={[styles.selectInputText, !startDate && { color: colors.text.muted }]}>
                            {startDate ? formatDateDisplay(startDate) : 'Selecione a data'}
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.fieldWrapper, { flex: 1 }]}>
                        <Text style={styles.label}>Data de Fim (Opcional)</Text>
                        <TouchableOpacity
                          style={styles.selectInput}
                          onPress={() => setIsEndDatePickerOpen(true)}
                        >
                          <Text style={[styles.selectInputText, !endDate && { color: colors.text.muted }]}>
                            {endDate ? formatDateDisplay(endDate) : 'Sem data de fim'}
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.saveBtn, activeTab === 'income' && { backgroundColor: colors.brand.teal }]}
                      onPress={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                          <Text style={styles.saveBtnText}>
                            {editingItem 
                              ? (activeTab === 'expense' ? 'Atualizar Gasto' : 'Atualizar Ganho') 
                              : (activeTab === 'expense' ? 'Criar Gasto' : 'Criar Ganho')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </ScrollView>

                  {/* Date Pickers Modals */}
                  <DatePicker
                    visible={isStartDatePickerOpen}
                    value={startDate}
                    onClose={() => setIsStartDatePickerOpen(false)}
                    onSelect={setStartDate}
                    accentColor={activeTab === 'income' ? colors.brand.teal : colors.brand.primary}
                    title="Data de Início"
                  />

                  <DatePicker
                    visible={isEndDatePickerOpen}
                    value={endDate}
                    onClose={() => setIsEndDatePickerOpen(false)}
                    onSelect={setEndDate}
                    accentColor={activeTab === 'income' ? colors.brand.teal : colors.brand.primary}
                    title="Data de Fim"
                    showClear
                  />
                </View>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Modal>

      {/* ── SELETOR DE CATEGORIA MODAL ─────────────────────────────── */}
      <Modal visible={isCategoryModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.categorySelectorCard}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderInfo}>
                <Text style={styles.formTitle}>
                  {activeTab === 'expense' ? 'Selecionar Categoria de Gasto' : 'Selecionar Categoria de Ganho'}
                </Text>
                <Text style={styles.formSubtitle}>Escolha uma categoria para a recorrência</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCategoryModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={flattenedCategories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryListContent}
              renderItem={({ item }) => {
                const isSelected = categoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categorySelectItem, 
                      isSelected && styles.categorySelectItemActive,
                      isSelected && activeTab === 'income' && { borderColor: colors.brand.teal, backgroundColor: 'rgba(0, 212, 170, 0.05)' }
                    ]}
                    onPress={() => {
                      setCategoryId(item.id);
                      setIsCategoryModalOpen(false);
                    }}
                  >
                    <Text style={[
                      styles.categorySelectText, 
                      isSelected && styles.categorySelectTextActive,
                      isSelected && activeTab === 'income' && { color: colors.brand.teal }
                    ]}>
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons 
                        name="checkmark" 
                        size={20} 
                        color={activeTab === 'expense' ? colors.brand.primary : colors.brand.teal} 
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="pricetags-outline" size={48} color={colors.text.muted} />
                  <Text style={styles.emptyText}>
                    {activeTab === 'expense' 
                      ? 'Nenhuma categoria de gasto disponível. Crie-as na aba de Categorias primeiro.' 
                      : 'Nenhuma categoria de ganho disponível. Crie-as na aba de Categorias primeiro.'}
                  </Text>
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
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  formHeaderInfo: { flex: 1 },
  formTitle: { ...typography.h3, color: colors.text.primary },
  formSubtitle: { ...typography.bodySmall, color: colors.brand.primary, fontWeight: '600', marginTop: 2 },
  modalHeaderInfo: { flex: 1 },
  modalTitle: { ...typography.h3, color: colors.text.primary },
  modalSubtitle: { ...typography.bodySmall, color: colors.brand.primary, fontWeight: '600', marginTop: 2 },
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

  // Tab Selector Styles
  tabOuterContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActiveExpense: {
    backgroundColor: colors.danger,
    ...shadow.sm,
  },
  tabActiveIncome: {
    backgroundColor: colors.brand.teal,
    ...shadow.sm,
  },
  tabText: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '700' },
  tabTextActive: { color: colors.white },

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
