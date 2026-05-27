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
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, FamilyMemberResponse } from '@/api/endpoints/family';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { recurringIncomesApi } from '@/api/endpoints/recurringIncomes';
import { plannedIncomesApi } from '@/api/endpoints/plannedIncomes';
import { plannedExpensesApi } from '@/api/endpoints/plannedExpenses';
import { categoriesApi } from '@/api/endpoints/categories';
import { decodeJwt } from '@/utils/jwt';
import { RecurringExpense, RecurringIncome, PlannedIncome, PlannedExpense } from '@/types';
import { useIsFocused } from '@react-navigation/native';
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

export default function RecurringExpensesScreen() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();

  // Active tab state: 'expense' (Gastos) or 'income' (Ganhos)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // View Mode: 'recurring' (Recorrências) or 'planned' (Previsões Avulsas)
  const [viewMode, setViewMode] = useState<'recurring' | 'planned'>('recurring');

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

  // Fetch Recurring Incomes for selected member
  const { data: incomes, isLoading: isLoadingIncomes, refetch: refetchIncomes } = useQuery({
    queryKey: ['recurringIncomes', selectedMember?.id],
    queryFn: () => recurringIncomesApi.getByMemberId(selectedMember!.id),
    enabled: !!selectedMember,
  });

  // Fetch Planned Expenses for selected member
  const { data: plannedExpenses, isLoading: isLoadingPlannedExpenses, refetch: refetchPlannedExpenses } = useQuery({
    queryKey: ['plannedExpenses', selectedMember?.id],
    queryFn: () => plannedExpensesApi.getByMemberId(selectedMember!.id),
    enabled: !!selectedMember,
  });

  // Fetch Planned Incomes for selected member
  const { data: plannedIncomes, isLoading: isLoadingPlannedIncomes, refetch: refetchPlannedIncomes } = useQuery({
    queryKey: ['plannedIncomes', selectedMember?.id],
    queryFn: () => plannedIncomesApi.getByMemberId(selectedMember!.id),
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

  useEffect(() => {
    if (isFocused && selectedMember?.id) {
      refetchExpenses();
      refetchIncomes();
      refetchPlannedExpenses();
      refetchPlannedIncomes();
    }
  }, [isFocused, selectedMember?.id, refetchExpenses, refetchIncomes, refetchPlannedExpenses, refetchPlannedIncomes]);

  // Calculate totals by frequency based on active tab
  const activeItems = activeTab === 'expense'
    ? (expenses ? expenses.filter(x => x.isActive) : [])
    : (incomes ? incomes.filter(x => x.isActive) : []);

  const totalWeekly = activeItems
    .filter(x => x.frequency === 1)
    .reduce((sum, x) => sum + x.amount, 0);

  const totalMonthly = activeItems
    .filter(x => x.frequency === 2)
    .reduce((sum, x) => sum + x.amount, 0);

  const totalYearly = activeItems
    .filter(x => x.frequency === 3)
    .reduce((sum, x) => sum + x.amount, 0);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | RecurringIncome | PlannedExpense | PlannedIncome | null>(null);
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

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (viewMode === 'planned') {
        if (activeTab === 'expense') {
          await plannedExpensesApi.delete(id);
        } else {
          await plannedIncomesApi.delete(id);
        }
      } else {
        if (activeTab === 'expense') {
          await recurringExpensesApi.delete(id);
        } else {
          await recurringIncomesApi.delete(id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpensesTotalFixed'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomesTotalFixed'] });
      queryClient.invalidateQueries({ queryKey: ['plannedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['plannedIncomes'] });
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message);
    },
  });

  const handleDelete = (id: string) => {
    const title = viewMode === 'planned'
      ? (activeTab === 'expense' ? 'gasto previsto' : 'ganho previsto')
      : (activeTab === 'expense' ? 'gasto recorrente' : 'ganho recorrente');
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza de que deseja excluir este ${title}?`,
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

      if (viewMode === 'planned') {
        if (!description || isNaN(parsedAmount) || !startDate || !categoryId) {
          throw new Error('Preencha os campos obrigatórios corretamente.');
        }

        if (activeTab === 'expense') {
          if (editingItem) {
            await plannedExpensesApi.update(editingItem.id, {
              description,
              amount: parsedAmount,
              date: startDate,
              categoryId,
            });
          } else {
            await plannedExpensesApi.create({
              description,
              amount: parsedAmount,
              date: startDate,
              memberId: selectedMember!.id,
              categoryId,
            });
          }
        } else {
          if (editingItem) {
            await plannedIncomesApi.update(editingItem.id, {
              description,
              amount: parsedAmount,
              date: startDate,
              categoryId,
            });
          } else {
            await plannedIncomesApi.create({
              description,
              amount: parsedAmount,
              date: startDate,
              memberId: selectedMember!.id,
              categoryId,
            });
          }
        }
      } else {
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringExpensesTotalFixed'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomesTotalFixed'] });
      queryClient.invalidateQueries({ queryKey: ['plannedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['plannedIncomes'] });
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

  const openEditForm = (item: RecurringExpense | RecurringIncome | PlannedExpense | PlannedIncome) => {
    setEditingItem(item);
    setDescription(item.description);
    setAmount(item.amount.toString());
    
    if (viewMode === 'planned') {
      setType(1);
      setFrequency(2);
      setDueDayType('regular');
      setDueDay('10');
      const pItem = item as PlannedExpense | PlannedIncome;
      setStartDate(pItem.date.split('T')[0] ?? '');
      setEndDate('');
    } else {
      const rItem = item as RecurringExpense | RecurringIncome;
      setType(rItem.type);
      setFrequency(rItem.frequency);
      if (activeTab === 'income' && rItem.dueDay > 100) {
        setDueDayType('business');
        setDueDay((rItem.dueDay - 100).toString());
      } else {
        setDueDayType('regular');
        setDueDay(rItem.dueDay.toString());
      }
      setStartDate(rItem.startDate.split('T')[0] ?? '');
      setEndDate(rItem.endDate ? rItem.endDate.split('T')[0] ?? '' : '');
    }
    
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
    if (viewMode === 'planned') {
      if (!startDate) {
        Alert.alert('Validação', 'A data prevista é obrigatória.');
        return;
      }
    } else {
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
    }
    if (!categoryId) {
      Alert.alert('Validação', 'A categoria é obrigatória.');
      return;
    }

    saveMutation.mutate();
  };

  const isLoadingData = viewMode === 'planned'
    ? (isLoadingPlannedExpenses || isLoadingPlannedIncomes || isLoadingFamily)
    : (isLoadingExpenses || isLoadingIncomes || isLoadingFamily);
    
  const currentList = viewMode === 'planned'
    ? (activeTab === 'expense' ? plannedExpenses : plannedIncomes)
    : (activeTab === 'expense' ? expenses : incomes);

  const totalPlanned = React.useMemo(() => {
    if (viewMode !== 'planned' || !currentList) return 0;
    return currentList.reduce((sum, item) => sum + item.amount, 0);
  }, [viewMode, currentList]);

  const groupedItems = React.useMemo(() => {
    if (!currentList) return [];
    if (!categories) {
      return [{
        parentId: 'uncategorized',
        parentName: 'Geral',
        subgroups: [{
          subId: 'uncategorized-sub',
          subName: null,
          items: currentList
        }]
      }];
    }

    const catMap: Record<string, { parentId: string; parentName: string; subId: string | null; subName: string | null }> = {};
    
    categories.forEach(parent => {
      catMap[parent.id] = {
        parentId: parent.id,
        parentName: parent.name,
        subId: null,
        subName: null
      };
      if (parent.subCategories) {
        parent.subCategories.forEach(sub => {
          catMap[sub.id] = {
            parentId: parent.id,
            parentName: parent.name,
            subId: sub.id,
            subName: sub.name
          };
        });
      }
    });

    const groups: Record<string, {
      parentId: string;
      parentName: string;
      subgroups: Record<string, {
        subId: string | null;
        subName: string | null;
        items: (RecurringExpense | RecurringIncome | PlannedExpense | PlannedIncome)[];
      }>;
    }> = {};

    currentList.forEach(item => {
      const mapping = catMap[item.categoryId];
      const pId = mapping?.parentId ?? 'uncategorized';
      const pName = mapping?.parentName ?? item.categoryName ?? 'Sem Categoria';
      const sId = mapping?.subId ?? null;
      const sName = mapping?.subName ?? null;

      if (!groups[pId]) {
        groups[pId] = {
          parentId: pId,
          parentName: pName,
          subgroups: {}
        };
      }

      const sKey = sId ?? 'none';
      if (!groups[pId].subgroups[sKey]) {
        groups[pId].subgroups[sKey] = {
          subId: sId,
          subName: sName,
          items: []
        };
      }

      groups[pId].subgroups[sKey].items.push(item);
    });

    return Object.values(groups)
      .sort((a, b) => a.parentName.localeCompare(b.parentName))
      .map(group => ({
        ...group,
        subgroups: Object.values(group.subgroups)
          .sort((a, b) => {
            if (!a.subName) return -1;
            if (!b.subName) return 1;
            return a.subName.localeCompare(b.subName);
          })
      }));
  }, [currentList, categories]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{viewMode === 'planned' ? 'Previsões Avulsas' : 'Finanças Recorrentes'}</Text>
          <Text style={styles.subtitle}>
            {viewMode === 'planned' 
              ? 'Gerencie gastos e ganhos planejados para a família' 
              : 'Gerencie gastos e ganhos recorrentes da família'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, activeTab === 'income' && { backgroundColor: colors.brand.teal }]} 
          onPress={openCreateForm}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
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

      {/* View Mode Switcher */}
      <View style={styles.viewModeOuterContainer}>
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === 'recurring' && styles.viewModeActive,
              viewMode === 'recurring' && { backgroundColor: activeTab === 'expense' ? colors.brand.primary : colors.brand.teal }
            ]}
            onPress={() => setViewMode('recurring')}
          >
            <Ionicons
              name="repeat-outline"
              size={16}
              color={viewMode === 'recurring' ? colors.white : colors.text.secondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.viewModeText, viewMode === 'recurring' && styles.viewModeTextActive]}>
              Recorrências
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === 'planned' && styles.viewModeActive,
              viewMode === 'planned' && { backgroundColor: activeTab === 'expense' ? colors.brand.primary : colors.brand.teal }
            ]}
            onPress={() => setViewMode('planned')}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={viewMode === 'planned' ? colors.white : colors.text.secondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.viewModeText, viewMode === 'planned' && styles.viewModeTextActive]}>
              Previsões Avulsas
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* Resumo de Totais por Frequência ou Total Previsto */}
      {!isLoadingData && selectedMember && currentList && currentList.length > 0 && (
        viewMode === 'planned' ? (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryTitle}>Total Previsto</Text>
              <Text style={[styles.summaryValue, { color: activeTab === 'expense' ? colors.danger : colors.brand.teal }]}>
                {fmt(totalPlanned)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Semanal</Text>
              <Text style={[styles.summaryValue, { color: activeTab === 'expense' ? colors.danger : colors.brand.teal }]}>
                {fmt(totalWeekly)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Mensal</Text>
              <Text style={[styles.summaryValue, { color: activeTab === 'expense' ? colors.danger : colors.brand.teal }]}>
                {fmt(totalMonthly)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Anual</Text>
              <Text style={[styles.summaryValue, { color: activeTab === 'expense' ? colors.danger : colors.brand.teal }]}>
                {fmt(totalYearly)}
              </Text>
            </View>
          </View>
        )
      )}

      {/* Main content body */}
      {isLoadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {currentList && currentList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'expense' ? "calendar-outline" : "trending-up-outline"} 
                size={64} 
                color={colors.text.muted} 
              />
              <Text style={styles.emptyText}>
                {viewMode === 'planned'
                  ? (activeTab === 'expense' 
                    ? 'Nenhum gasto previsto cadastrado para este membro.' 
                    : 'Nenhum ganho previsto cadastrado para este membro.')
                  : (activeTab === 'expense' 
                    ? 'Nenhum gasto recorrente cadastrado para este membro.' 
                    : 'Nenhum ganho recorrente cadastrado para este membro.')}
              </Text>
              <TouchableOpacity 
                style={[styles.emptyAddBtn, activeTab === 'income' && { backgroundColor: colors.brand.teal }]} 
                onPress={openCreateForm}
              >
                <Text style={styles.emptyAddBtnText}>
                  {viewMode === 'planned'
                    ? (activeTab === 'expense' ? 'Criar Primeiro Gasto Previsto' : 'Criar Primeiro Ganho Previsto')
                    : (activeTab === 'expense' ? 'Criar Primeiro Gasto' : 'Criar Primeiro Ganho')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            groupedItems.map((parentGroup) => (
              <View key={parentGroup.parentId} style={styles.categorySection}>
                {/* Parent Category Header */}
                <View style={[styles.categoryHeader, { borderLeftColor: activeTab === 'expense' ? colors.brand.primary : colors.brand.teal }]}>
                  <Ionicons name="folder-open-outline" size={15} color={colors.text.secondary} />
                  <Text style={styles.categoryTitleText}>{parentGroup.parentName}</Text>
                </View>

                {parentGroup.subgroups.map((subGroup) => (
                  <View key={subGroup.subId ?? 'none'} style={styles.subcategoryWrapper}>
                    {/* Subcategory Header */}
                    {subGroup.subName && (
                      <View style={styles.subcategoryHeader}>
                        <Ionicons name="chevron-forward-outline" size={11} color={colors.text.muted} />
                        <Text style={styles.subcategoryTitleText}>{subGroup.subName}</Text>
                      </View>
                    )}

                    {/* Cards grid */}
                    <View style={styles.cardsGrid}>
                      {subGroup.items.map((item) => {
                        if (viewMode === 'planned') {
                          const plannedItem = item as PlannedExpense | PlannedIncome;
                          return (
                            <View key={plannedItem.id} style={styles.expenseCard}>
                              <View style={styles.expenseHeader}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.expenseDesc}>
                                    {plannedItem.description}
                                  </Text>
                                  <Text style={styles.expenseDetails}>
                                    {activeTab === 'income' ? 'Entrada prevista:' : 'Vencimento previsto:'} {formatDateDisplay(plannedItem.date.split('T')[0])}
                                  </Text>
                                </View>
                                <Text style={[styles.expenseAmount, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>
                                  {activeTab === 'expense' ? '-' : '+'}{fmt(plannedItem.amount)}
                                </Text>
                              </View>

                              {/* Divider */}
                              <View style={styles.cardDivider} />

                              {/* Controls */}
                              <View style={styles.expenseControls}>
                                <View style={styles.actionGroup}>
                                  <TouchableOpacity 
                                    style={[styles.iconBtn, activeTab === 'income' && { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]} 
                                    onPress={() => openEditForm(plannedItem)}
                                  >
                                    <Ionicons 
                                      name="create-outline" 
                                      size={16} 
                                      color={activeTab === 'expense' ? colors.brand.primary : colors.brand.teal} 
                                    />
                                    <Text style={[styles.iconBtnText, { color: activeTab === 'expense' ? colors.brand.primary : colors.brand.teal }]}>
                                      Editar
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={[styles.iconBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]} 
                                    onPress={() => handleDelete(plannedItem.id)}
                                  >
                                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                    <Text style={[styles.iconBtnText, { color: colors.danger }]}>Excluir</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          );
                        }

                        const recItem = item as RecurringExpense | RecurringIncome;
                        return (
                          <View key={recItem.id} style={styles.expenseCard}>
                            <View style={styles.expenseHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.expenseDesc}>
                                  {recItem.description}
                                </Text>
                                <Text style={styles.expenseDetails}>
                                  {activeTab === 'income' 
                                    ? (recItem.dueDay > 100 ? `Dia de entrada: ${recItem.dueDay - 100}º dia útil` : `Dia de entrada: ${recItem.dueDay}`) 
                                    : `Vence dia ${recItem.dueDay}`} · {recItem.frequency === 1 ? 'Semanal' : recItem.frequency === 2 ? 'Mensal' : 'Anual'} · {recItem.type === 1 ? 'Fixo' : 'Variável'}
                                </Text>
                                {recItem.startDate && (
                                  <Text style={styles.expensePeriod}>
                                    Início: {formatDateDisplay(recItem.startDate.split('T')[0])} 
                                    {recItem.endDate ? ` · Fim: ${formatDateDisplay(recItem.endDate.split('T')[0])}` : ' (Indeterminado)'}
                                  </Text>
                                )}
                              </View>
                              <Text style={[styles.expenseAmount, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>
                                {activeTab === 'expense' ? '-' : '+'}{fmt(recItem.amount)}
                              </Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.cardDivider} />

                            {/* Controls */}
                            <View style={styles.expenseControls}>
                              <View style={styles.actionGroup}>
                                <TouchableOpacity 
                                  style={[styles.iconBtn, activeTab === 'income' && { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]} 
                                  onPress={() => openEditForm(recItem)}
                                >
                                  <Ionicons 
                                    name="create-outline" 
                                    size={16} 
                                    color={activeTab === 'expense' ? colors.brand.primary : colors.brand.teal} 
                                  />
                                  <Text style={[styles.iconBtnText, { color: activeTab === 'expense' ? colors.brand.primary : colors.brand.teal }]}>
                                    Editar
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={[styles.iconBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]} 
                                  onPress={() => handleDelete(recItem.id)}
                                >
                                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                  <Text style={[styles.iconBtnText, { color: colors.danger }]}>Excluir</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
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
                      {editingItem 
                        ? (viewMode === 'planned' 
                            ? (activeTab === 'expense' ? 'Editar Gasto Previsto' : 'Editar Ganho Previsto')
                            : (activeTab === 'expense' ? 'Editar Gasto Recorrente' : 'Editar Ganho Recorrente')) 
                        : (viewMode === 'planned'
                            ? (activeTab === 'expense' ? 'Novo Gasto Previsto' : 'Novo Ganho Previsto')
                            : (activeTab === 'expense' ? 'Novo Gasto Recorrente' : 'Novo Ganho Recorrente'))}
                    </Text>
                    <Text style={[styles.formSubtitle, activeTab === 'income' && { color: colors.brand.teal }]}>
                      Para {selectedMember?.name}
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
                      placeholder={activeTab === 'expense' ? "Ex: Assinatura Netflix, Academia" : "Ex: Salário, Rendimentos, Aluguel"}
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
                      <Text style={styles.label}>{viewMode === 'planned' ? 'Valor (R$)' : (type === 2 ? 'Valor esperado (R$)' : 'Valor (R$)')}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={viewMode === 'planned' ? '0.00' : (type === 2 ? 'Valor esperado (ex: 100.00)' : '0.00')}
                        placeholderTextColor={colors.text.muted}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                      />
                    </View>
                    {viewMode !== 'planned' && (
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
                    )}
                  </View>

                  {/* Tipo de Dia (apenas para Ganho Recorrente) */}
                  {viewMode !== 'planned' && activeTab === 'income' && (
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
                  {viewMode !== 'planned' && (
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
                  )}

                  {/* Frequência (Semanal / Mensal / Anual) */}
                  {viewMode !== 'planned' && (
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
                  )}

                    {/* Datas */}
                    <View style={styles.row}>
                      <View style={[styles.fieldWrapper, { flex: 1 }]}>
                        <Text style={styles.label}>{viewMode === 'planned' ? 'Data Prevista' : 'Data de Início'}</Text>
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
                      {viewMode !== 'planned' && (
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
                      )}
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
                              ? (viewMode === 'planned' 
                                  ? (activeTab === 'expense' ? 'Atualizar Gasto Previsto' : 'Atualizar Ganho Previsto') 
                                  : (activeTab === 'expense' ? 'Atualizar Gasto' : 'Atualizar Ganho')) 
                              : (viewMode === 'planned' 
                                  ? (activeTab === 'expense' ? 'Criar Gasto Previsto' : 'Criar Ganho Previsto') 
                                  : (activeTab === 'expense' ? 'Criar Gasto' : 'Criar Ganho'))}
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
                    title={viewMode === 'planned' ? "Data Prevista" : "Data de Início"}
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
  
  // Tab Switcher Styles
  tabOuterContainer: {
    paddingHorizontal: spacing.lg,
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

  // View Mode Switcher Styles
  viewModeOuterContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewModeBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  viewModeActive: {
    ...shadow.sm,
  },
  viewModeText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  viewModeTextActive: {
    color: colors.white,
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
  formSubtitle: { ...typography.bodySmall, color: colors.brand.primary, fontWeight: '600', marginTop: 2 },
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
  categorySection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: spacing.sm,
    paddingVertical: 6,
    borderLeftWidth: 3,
    backgroundColor: colors.bg.card,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  categoryTitleText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subcategoryWrapper: {
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  subcategoryTitleText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  cardsGrid: {
    gap: spacing.sm,
  },
});
