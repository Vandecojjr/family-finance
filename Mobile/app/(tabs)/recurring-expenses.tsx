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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi, FamilyMemberResponse } from '@/api/endpoints/family';
import { recurringExpensesApi } from '@/api/endpoints/recurringExpenses';
import { recurringIncomesApi } from '@/api/endpoints/recurringIncomes';
import { plannedIncomesApi } from '@/api/endpoints/plannedIncomes';
import { plannedExpensesApi } from '@/api/endpoints/plannedExpenses';
import { categoriesApi } from '@/api/endpoints/categories';
import { walletsApi } from '@/api/endpoints/wallets';
import { decodeJwt } from '@/utils/jwt';
import { RecurringExpense, RecurringIncome, PlannedIncome, PlannedExpense, Wallet, BankAccount, CreditCard } from '@/types';
import { useIsFocused } from '@react-navigation/native';
import DatePicker from '@/components/DatePicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';


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

export default function RecurringExpensesScreen({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { tokens, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: 'planned' | 'recurring' }>();

  // Form context state (set when opening the form via the choice modal)
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');

  // View Mode: 'recurring' (Recorrências) or 'planned' (Previsões Avulsas)
  const [viewMode, setViewMode] = useState<'recurring' | 'planned'>(params.mode ?? 'recurring');

  useEffect(() => {
    if (params.mode) {
      setViewMode(params.mode);
    }
  }, [params.mode]);

  useFocusEffect(
    React.useCallback(() => {
      // Handle deep links/params
      if (params.action === 'new_planned') {
        setViewMode('planned');
        setIsTypeChoiceModalOpen(true);
        router.setParams({ action: '' });
      } else if (params.action === 'new_recurring') {
        setViewMode('recurring');
        setIsTypeChoiceModalOpen(true);
        router.setParams({ action: '' });
      }
    }, [params.action])
  );

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
    queryKey: ['family', isAuthenticated],
    queryFn: () => familyApi.getMyFamily(),
    enabled: isAuthenticated,
  });

  // Set default selected member to logged-in user when family data is loaded
  useEffect(() => {
    if (family?.members && family.members.length > 0 && !selectedMember) {
      const self = family.members.find((m) => m.id === currentMemberId);
      if (self) {
        setSelectedMember({ id: 'all', name: 'Todos', familyId: self.familyId, cpf: '' });
      } else if (family.members[0]) {
        setSelectedMember({ id: 'all', name: 'Todos', familyId: family.members[0].familyId, cpf: '' });
      }
    }
  }, [family, currentMemberId, selectedMember]);

  // Fetch Recurring Expenses for selected member
  const { data: expenses, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['recurringExpenses', selectedMember?.id],
    queryFn: async () => {
      if (selectedMember!.id === 'all') {
        const results = await Promise.all(family!.members.map(m => recurringExpensesApi.getByMemberId(m.id)));
        return results.flat();
      }
      return recurringExpensesApi.getByMemberId(selectedMember!.id);
    },
    enabled: !!selectedMember && !!family,
  });

  // Fetch Recurring Incomes for selected member
  const { data: incomes, isLoading: isLoadingIncomes, refetch: refetchIncomes } = useQuery({
    queryKey: ['recurringIncomes', selectedMember?.id],
    queryFn: async () => {
      if (selectedMember!.id === 'all') {
        const results = await Promise.all(family!.members.map(m => recurringIncomesApi.getByMemberId(m.id)));
        return results.flat();
      }
      return recurringIncomesApi.getByMemberId(selectedMember!.id);
    },
    enabled: !!selectedMember && !!family,
  });

  // Fetch Planned Expenses for selected member
  const { data: plannedExpenses, isLoading: isLoadingPlannedExpenses, refetch: refetchPlannedExpenses } = useQuery({
    queryKey: ['plannedExpenses', selectedMember?.id],
    queryFn: async () => {
      if (selectedMember!.id === 'all') {
        const results = await Promise.all(family!.members.map(m => plannedExpensesApi.getByMemberId(m.id)));
        return results.flat();
      }
      return plannedExpensesApi.getByMemberId(selectedMember!.id);
    },
    enabled: !!selectedMember && !!family,
  });

  // Fetch Planned Incomes for selected member
  const { data: plannedIncomes, isLoading: isLoadingPlannedIncomes, refetch: refetchPlannedIncomes } = useQuery({
    queryKey: ['plannedIncomes', selectedMember?.id],
    queryFn: async () => {
      if (selectedMember!.id === 'all') {
        const results = await Promise.all(family!.members.map(m => plannedIncomesApi.getByMemberId(m.id)));
        return results.flat();
      }
      return plannedIncomesApi.getByMemberId(selectedMember!.id);
    },
    enabled: !!selectedMember && !!family,
  });

  // Fetch Categories for selection
  const { data: categories } = useQuery({
    queryKey: ['categories', isAuthenticated],
    queryFn: () => categoriesApi.list(),
    enabled: isAuthenticated,
  });

  // Fetch Wallets for payment selection
  const { data: wallets } = useQuery({
    queryKey: ['wallets', isAuthenticated],
    queryFn: () => walletsApi.list(),
    enabled: isAuthenticated,
  });

  const flattenedCategories = React.useMemo(() => {
    if (!categories) return [];
    const targetType = formType === 'expense' ? 'Expense' : 'Income';
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
  }, [categories, formType]);

  useEffect(() => {
    if (isFocused && selectedMember?.id) {
      refetchExpenses();
      refetchIncomes();
      refetchPlannedExpenses();
      refetchPlannedIncomes();
    }
  }, [isFocused, selectedMember?.id, refetchExpenses, refetchIncomes, refetchPlannedExpenses, refetchPlannedIncomes]);

  // Calculate totals by frequency based on currentList
  const currentList = React.useMemo(() => {
    const exp = viewMode === 'planned' ? (plannedExpenses || []) : (expenses || []);
    const inc = viewMode === 'planned' ? (plannedIncomes || []) : (incomes || []);
    
    return [
      ...exp.map(e => ({ ...e, _type: 'expense' as const })),
      ...inc.map(i => ({ ...i, _type: 'income' as const }))
    ];
  }, [viewMode, expenses, incomes, plannedExpenses, plannedIncomes]);

  const activeItems = currentList.filter(x => (x as any).isActive !== false);

  const totalWeekly = activeItems
    .filter(x => 'frequency' in x && x.frequency === 1)
    .reduce((sum, x) => sum + (x._type === 'income' ? x.amount : -x.amount), 0);

  const totalMonthly = activeItems
    .filter(x => 'frequency' in x && x.frequency === 2)
    .reduce((sum, x) => sum + (x._type === 'income' ? x.amount : -x.amount), 0);

  const totalYearly = activeItems
    .filter(x => 'frequency' in x && x.frequency === 3)
    .reduce((sum, x) => sum + (x._type === 'income' ? x.amount : -x.amount), 0);

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

  const selectedCategoryName = React.useMemo(() => {
    if (!categoryId || !categories) return 'Selecione uma categoria';
    for (const parent of categories) {
      if (parent.id === categoryId) return parent.name;
      if (parent.subCategories) {
        const sub = parent.subCategories.find((s) => s.id === categoryId);
        if (sub) return `${parent.name} ➔ ${sub.name}`;
      }
    }
    return 'Selecione uma categoria';
  }, [categories, categoryId]);

  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [isTypeChoiceModalOpen, setIsTypeChoiceModalOpen] = useState(false);

  // Pay Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingItem, setPayingItem] = useState<RecurringExpense | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payWalletId, setPayWalletId] = useState('');
  const [payBankAccountId, setPayBankAccountId] = useState('');
  const [payCreditCardId, setPayCreditCardId] = useState('');
  const [payUseCredit, setPayUseCredit] = useState(false);
  const [isWalletSelectOpen, setIsWalletSelectOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalCallback, setInvoiceModalCallback] = useState<((forceNext: boolean) => void) | null>(null);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (viewMode === 'planned') {
        if (formType === 'expense') {
          await plannedExpensesApi.delete(id);
        } else {
          await plannedIncomesApi.delete(id);
        }
      } else {
        if (formType === 'expense') {
          await recurringExpensesApi.delete(id);
        } else {
          await recurringIncomesApi.delete(id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['plannedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['plannedIncomes'] });
    },
    onError: (error: any) => {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao excluir.');
    },
  });

  const payMutation = useMutation({
    mutationFn: async (payload: { id: string, amount: number, walletId: string, bankAccountId?: string | null, creditCardId?: string | null, useCredit?: boolean | null, forceNextInvoice?: boolean | null }) => {
      await recurringExpensesApi.pay(payload.id, {
        walletId: payload.walletId,
        amount: payload.amount,
        bankAccountId: payload.bankAccountId,
        creditCardId: payload.creditCardId,
        useCredit: payload.useCredit,
        forceNextInvoice: payload.forceNextInvoice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsPayModalOpen(false);
      setPayingItem(null);
      Alert.alert('Sucesso', 'Pagamento registrado com sucesso!');
    },
    onError: (error: any) => {
      Alert.alert('Erro', error.message || 'Ocorreu um erro ao registrar o pagamento.');
    },
  });

  const handleDelete = (id: string, itemType: 'expense' | 'income') => {
    Alert.alert('Confirmar Exclusão', 'Tem certeza que deseja excluir este item?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
         // Hack to pass type to deleteMutation if needed, but wait deleteMutation uses activeTab!
         // We must temporarily set formType or adjust deleteMutation to accept type.
         setFormType(itemType);
         setTimeout(() => deleteMutation.mutate(id), 0);
      }},
    ]);
  };

  const openPayForm = (item: RecurringExpense) => {
    setPayingItem(item);
    setPayAmount(item.amount.toString());
    setPayWalletId('');
    setPayBankAccountId('');
    setPayCreditCardId('');
    setPayUseCredit(false);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = () => {
    if (!payingItem) return;
    const amountNum = parseFloat(payAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Erro', 'Informe um valor válido maior que zero.');
      return;
    }
    if (!payWalletId) {
      Alert.alert('Erro', 'Selecione uma carteira.');
      return;
    }

    if (payCreditCardId) {
      const selectedWallet = wallets?.find(w => w.id === payWalletId);
      const selectedAccount = selectedWallet?.accounts.find(a => a.id === payBankAccountId);
      const selectedCard = selectedAccount?.creditCards.find(c => c.id === payCreditCardId);

      if (selectedCard && selectedCard.dueDay) {
        const txDate = new Date();
        const dueDay = selectedCard.dueDay;
        const dueThisMonth = new Date(txDate.getFullYear(), txDate.getMonth(), dueDay, 12, 0, 0);
        
        const diffTime = dueThisMonth.getTime() - txDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Se a compra for entre 7 e 5 dias do vencimento (janela de dúvida)
        if (diffDays >= 5 && diffDays <= 7) {
          setInvoiceModalCallback(() => (forceNext: boolean) => {
            setIsInvoiceModalOpen(false);
            payMutation.mutate({
              id: payingItem.id,
              amount: amountNum,
              walletId: payWalletId,
              bankAccountId: payBankAccountId || null,
              creditCardId: payCreditCardId || null,
              useCredit: payBankAccountId ? payUseCredit : null,
              forceNextInvoice: forceNext,
            });
          });
          setIsInvoiceModalOpen(true);
          return;
        }
      }
    }

    payMutation.mutate({
      id: payingItem.id,
      amount: amountNum,
      walletId: payWalletId,
      bankAccountId: payBankAccountId || null,
      creditCardId: payCreditCardId || null,
      useCredit: payBankAccountId ? payUseCredit : null,
      forceNextInvoice: null,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount.replace(',', '.'));

      if (viewMode === 'planned') {
        if (!description || isNaN(parsedAmount) || !startDate || !categoryId) {
          throw new Error('Preencha os campos obrigatórios corretamente.');
        }

        if (formType === 'expense') {
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
              memberId: selectedMember!.id === 'all' ? null : selectedMember!.id,
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
              memberId: selectedMember!.id === 'all' ? null : selectedMember!.id,
              categoryId,
            });
          }
        }
      } else {
        const rawDueDay = parseInt(dueDay, 10);
        const parsedDueDay = (formType === 'income' && dueDayType === 'business') ? (rawDueDay + 100) : rawDueDay;

        if (!description || isNaN(parsedAmount) || isNaN(parsedDueDay) || !categoryId) {
          throw new Error('Preencha os campos obrigatórios corretamente.');
        }

        if (formType === 'expense') {
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
              memberId: selectedMember!.id === 'all' ? null : selectedMember!.id,
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
              memberId: selectedMember!.id === 'all' ? null : selectedMember!.id,
              categoryId,
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurringIncomes'] });
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
      if (formType === 'income' && rItem.dueDay > 100) {
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
        const label = formType === 'income' 
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
    


  const totalPlanned = React.useMemo(() => {
    if (viewMode !== 'planned' || !currentList) return 0;
    return currentList.reduce((sum, item) => sum + (item._type === 'income' ? item.amount : -item.amount), 0);
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

  const Container = isEmbedded ? View : SafeAreaView;

  return (
    <Container style={isEmbedded ? { flex: 1 } : styles.safe}>
      {isEmbedded ? (
        <View style={styles.embeddedHeader}>
          <Text style={styles.embeddedTitle}>
            {viewMode === 'planned' ? 'Previsões Avulsas' : 'Finanças Recorrentes'}
          </Text>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md, marginTop: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{viewMode === 'planned' ? 'Previsões Avulsas' : 'Finanças Recorrentes'}</Text>
            <Text style={styles.subtitle}>
              {viewMode === 'planned' 
                ? 'Gerencie gastos e ganhos planejados para a família' 
                : 'Gerencie gastos e ganhos recorrentes da família'}
            </Text>
          </View>
        </View>
      )}

      {/* View Mode Switcher */}
      {!params.mode && (
        <View style={styles.viewModeOuterContainer}>
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeBtn,
              viewMode === 'recurring' && styles.viewModeActive,
              viewMode === 'recurring' && { backgroundColor: colors.text.secondary }
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
              viewMode === 'planned' && { backgroundColor: colors.text.secondary }
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
      )}

      {/* Member Selector chips */}
      {family?.members && family.members.length > 0 && (
        <View style={styles.selectorWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 'all', name: 'Todos', familyId: family.members[0].familyId, cpf: '' }, ...family.members]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.memberChipsList}
            renderItem={({ item, index }) => {
              const isSelected = selectedMember?.id === item.id;
              const memberColor = item.id === 'all' ? colors.brand.primary : (MEMBER_COLORS[index % MEMBER_COLORS.length] ?? colors.brand.primary);
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
                    <Text style={[styles.avatarMiniText, { color: memberColor }]}>{item.id === 'all' ? 'All' : getInitials(item.name)}</Text>
                  </View>
                  <Text style={[styles.memberChipName, isSelected && styles.memberChipNameSelected]}>
                    {item.id === 'all' ? 'Todos' : item.name.split(' ')[0]}
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
              <Text style={[styles.summaryValue, { color: totalPlanned < 0 ? colors.danger : colors.brand.teal }]}>
                {fmt(Math.abs(totalPlanned))}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Semanal</Text>
              <Text style={[styles.summaryValue, { color: totalWeekly < 0 ? colors.danger : colors.brand.teal }]}>
                {fmt(Math.abs(totalWeekly))}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Mensal</Text>
              <Text style={[styles.summaryValue, { color: totalMonthly < 0 ? colors.danger : colors.brand.teal }]}>
                {fmt(Math.abs(totalMonthly))}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Anual</Text>
              <Text style={[styles.summaryValue, { color: totalYearly < 0 ? colors.danger : colors.brand.teal }]}>
                {fmt(Math.abs(totalYearly))}
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
                name="calendar-outline" 
                size={64} 
                color={colors.text.muted} 
              />
              <Text style={styles.emptyText}>
                {viewMode === 'planned'
                  ? 'Nenhum lançamento previsto cadastrado.'
                  : 'Nenhum lançamento recorrente cadastrado.'}
              </Text>
              <TouchableOpacity 
                style={styles.emptyAddBtn} 
                onPress={() => setIsTypeChoiceModalOpen(true)}
              >
                <Text style={styles.emptyAddBtnText}>
                  {viewMode === 'planned'
                    ? 'Criar Primeira Previsão'
                    : 'Criar Primeira Recorrência'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            groupedItems.map((parentGroup) => (
              <View key={parentGroup.parentId} style={styles.categorySection}>
                {/* Parent Category Header */}
                <View style={[styles.categoryHeader, { borderLeftColor: colors.text.secondary }]}>
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
                                    {(plannedItem as any)._type === 'income' ? 'Entrada prevista:' : 'Vencimento previsto:'} {formatDateDisplay(plannedItem.date.split('T')[0])}
                                  </Text>
                                </View>
                                <Text style={[styles.expenseAmount, { color: (plannedItem as any)._type === 'expense' ? colors.danger : colors.success }]}>
                                  {(plannedItem as any)._type === 'expense' ? '-' : '+'}{fmt(plannedItem.amount)}
                                </Text>
                              </View>

                              {/* Divider */}
                              <View style={styles.cardDivider} />

                              {/* Controls */}
                              <View style={styles.expenseControls}>
                                <View style={styles.actionGroup}>
                                  <TouchableOpacity 
                                    style={[styles.iconBtn, (plannedItem as any)._type === 'income' && { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]} 
                                    onPress={() => openEditForm(plannedItem)}
                                  >
                                    <Ionicons 
                                      name="create-outline" 
                                      size={16} 
                                      color={(plannedItem as any)._type === 'expense' ? colors.brand.primary : colors.brand.teal} 
                                    />
                                    <Text style={[styles.iconBtnText, { color: (plannedItem as any)._type === 'expense' ? colors.brand.primary : colors.brand.teal }]}>
                                      Editar
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={[styles.iconBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]} 
                                    onPress={() => handleDelete(plannedItem.id, (plannedItem as any)._type)}
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
                                    {(recItem as any)._type === 'income' 
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
                              <Text style={[styles.expenseAmount, { color: (recItem as any)._type === 'expense' ? colors.danger : colors.success }]}>
                                {(recItem as any)._type === 'expense' ? '-' : '+'}{fmt(recItem.amount)}
                              </Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.cardDivider} />

                                {/* Controls */}
                                <View style={styles.expenseControls}>
                                  <View style={styles.actionGroup}>
                                    <TouchableOpacity 
                                      style={[styles.iconBtn, (recItem as any)._type === 'income' && { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]} 
                                      onPress={() => openEditForm(recItem)}
                                    >
                                      <Ionicons 
                                        name="create-outline" 
                                        size={16} 
                                        color={(recItem as any)._type === 'expense' ? colors.brand.primary : colors.brand.teal} 
                                      />
                                      <Text style={[styles.iconBtnText, { color: (recItem as any)._type === 'expense' ? colors.brand.primary : colors.brand.teal }]}>
                                        Editar
                                      </Text>
                                    </TouchableOpacity>
                                     {(recItem as any)._type === 'expense' && !(recItem as RecurringExpense).isPaid && (
                                       <TouchableOpacity 
                                         style={[styles.iconBtn, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]} 
                                        onPress={() => openPayForm(recItem as RecurringExpense)}
                                      >
                                        <Ionicons name="card-outline" size={16} color={colors.brand.primary} />
                                        <Text style={[styles.iconBtnText, { color: colors.brand.primary }]}>Pagar</Text>
                                      </TouchableOpacity>
                                    )}
                                    <TouchableOpacity 
                                      style={[styles.iconBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]} 
                                      onPress={() => handleDelete(recItem.id, (recItem as any)._type)}
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

      {/* ── FLOATING ACTION BUTTON ─────────────────────────────── */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setIsTypeChoiceModalOpen(true)}
        >
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.primary]} // Could use secondary
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── TYPE CHOICE MODAL ─────────────────────────────── */}
      <Modal visible={isTypeChoiceModalOpen} transparent animationType="fade">
        <View style={styles.choiceModalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>O que você deseja registrar?</Text>
            
            <TouchableOpacity 
              style={styles.choiceBtn}
              onPress={() => {
                setFormType('expense');
                setIsTypeChoiceModalOpen(false);
                openCreateForm();
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                <Ionicons name="arrow-down-circle" size={24} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>
                  {viewMode === 'planned' ? 'Gasto Previsto' : 'Gasto Recorrente'}
                </Text>
                <Text style={styles.choiceSubtitle}>
                  {viewMode === 'planned' ? 'Registrar um gasto pontual' : 'Registrar uma despesa fixa ou variável'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.choiceBtn}
              onPress={() => {
                setFormType('income');
                setIsTypeChoiceModalOpen(false);
                openCreateForm();
              }}
            >
              <View style={[styles.choiceIconWrap, { backgroundColor: 'rgba(0, 212, 170, 0.1)' }]}>
                <Ionicons name="arrow-up-circle" size={24} color={colors.brand.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>
                  {viewMode === 'planned' ? 'Ganho Previsto' : 'Ganho Recorrente'}
                </Text>
                <Text style={styles.choiceSubtitle}>
                  {viewMode === 'planned' ? 'Registrar um ganho pontual' : 'Registrar uma receita fixa ou variável'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setIsTypeChoiceModalOpen(false)}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                            ? (formType === 'expense' ? 'Editar Gasto Previsto' : 'Editar Ganho Previsto')
                            : (formType === 'expense' ? 'Editar Gasto Recorrente' : 'Editar Ganho Recorrente')) 
                        : (viewMode === 'planned'
                            ? (formType === 'expense' ? 'Novo Gasto Previsto' : 'Novo Ganho Previsto')
                            : (formType === 'expense' ? 'Novo Gasto Recorrente' : 'Novo Ganho Recorrente'))}
                    </Text>
                    <Text style={[styles.formSubtitle, formType === 'income' && { color: colors.brand.teal }]}>
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
                      placeholder={formType === 'expense' ? "Ex: Assinatura Netflix, Academia" : "Ex: Salário, Rendimentos, Aluguel"}
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
                        {selectedCategoryName}
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
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                      />
                    </View>
                    {viewMode !== 'planned' && (
                      <View style={[styles.fieldWrapper, { width: 130 }]}>
                        <Text style={styles.label}>
                          {formType === 'income' 
                            ? (dueDayType === 'business' ? 'Dia Útil Entrada' : 'Dia Entrada') 
                            : 'Dia Vencimento'}
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder={dueDayType === 'business' ? "5" : "10"}
                          placeholderTextColor={colors.text.muted}
                          keyboardType="decimal-pad"
                          maxLength={2}
                          value={dueDay}
                          onChangeText={setDueDay}
                        />
                      </View>
                    )}
                  </View>

                  {/* Tipo de Dia (apenas para Ganho Recorrente) */}
                  {viewMode !== 'planned' && formType === 'income' && (
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
                        {formType === 'expense' ? 'Tipo de Gasto' : 'Tipo de Ganho'}
                      </Text>
                      <View style={styles.segmentContainer}>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            type === 1 && styles.segmentActive,
                            type === 1 && formType === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
                          onPress={() => setType(1)}
                        >
                          <Text style={[styles.segmentText, type === 1 && styles.segmentTextActive]}>Fixo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            type === 2 && styles.segmentActive,
                            type === 2 && formType === 'income' && { backgroundColor: colors.brand.teal }
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
                            frequency === 1 && formType === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
                          onPress={() => setFrequency(1)}
                        >
                          <Text style={[styles.segmentText, frequency === 1 && styles.segmentTextActive]}>Semanal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            frequency === 2 && styles.segmentActive,
                            frequency === 2 && formType === 'income' && { backgroundColor: colors.brand.teal }
                          ]}
                          onPress={() => setFrequency(2)}
                        >
                          <Text style={[styles.segmentText, frequency === 2 && styles.segmentTextActive]}>Mensal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentBtn, 
                            frequency === 3 && styles.segmentActive,
                            frequency === 3 && formType === 'income' && { backgroundColor: colors.brand.teal }
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
                      style={[styles.saveBtn, formType === 'income' && { backgroundColor: colors.brand.teal }]}
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
                                  ? (formType === 'expense' ? 'Atualizar Gasto Previsto' : 'Atualizar Ganho Previsto') 
                                  : (formType === 'expense' ? 'Atualizar Gasto' : 'Atualizar Ganho')) 
                              : (viewMode === 'planned' 
                                  ? (formType === 'expense' ? 'Criar Gasto Previsto' : 'Criar Ganho Previsto') 
                                  : (formType === 'expense' ? 'Criar Gasto' : 'Criar Ganho'))}
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
                    accentColor={formType === 'income' ? colors.brand.teal : colors.brand.primary}
                    title={viewMode === 'planned' ? "Data Prevista" : "Data de Início"}
                  />

                  <DatePicker
                    visible={isEndDatePickerOpen}
                    value={endDate}
                    onClose={() => setIsEndDatePickerOpen(false)}
                    onSelect={setEndDate}
                    accentColor={formType === 'income' ? colors.brand.teal : colors.brand.primary}
                    title="Data de Fim"
                    showClear
                  />

                  <CategoryPicker
                    visible={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    selectedId={categoryId}
                    onSelect={setCategoryId}
                    categories={categories || []}
                    type={formType === 'income' ? 'Income' : 'Expense'}
                  />
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Invoice Modal */}
      <Modal visible={isInvoiceModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.formCard, { maxWidth: 320, alignSelf: 'center', marginHorizontal: 20 }]}>
            <Text style={{ ...typography.h3, color: colors.text.primary, marginBottom: spacing.md, textAlign: 'center' }}>
              Atenção
            </Text>
            <Text style={{ ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg, textAlign: 'center' }}>
              O vencimento da fatura deste cartão está próximo. Onde deseja lançar este pagamento?
            </Text>
            <View style={{ gap: spacing.sm }}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.brand.primary, marginTop: 0 }]}
                onPress={() => invoiceModalCallback?.(false)}
              >
                <Text style={styles.saveBtnText}>Cair na Fatura Atual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.brand.teal, marginTop: 0 }]}
                onPress={() => invoiceModalCallback?.(true)}
              >
                <Text style={styles.saveBtnText}>Cair na Próxima Fatura</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: spacing.sm, marginTop: spacing.xs }}
                onPress={() => setIsInvoiceModalOpen(false)}
              >
                <Text style={{ ...typography.body, color: colors.danger, textAlign: 'center', fontWeight: '600' }}>
                  Cancelar Pagamento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pay Modal */}
      <Modal visible={isPayModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.formContainer}>
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View style={styles.formHeaderInfo}>
                    <Text style={styles.formTitle}>Registrar Pagamento</Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setIsPayModalOpen(false)}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScrollBody}>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Gasto Recorrente</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.bg.elevated, color: colors.text.secondary }]}
                      value={payingItem?.description}
                      editable={false}
                    />
                  </View>

                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Valor (R$)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="decimal-pad"
                      value={payAmount}
                      onChangeText={setPayAmount}
                    />
                  </View>

                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Carteira / Conta</Text>
                    <TouchableOpacity style={styles.selectInput} onPress={() => {
                      setIsPayModalOpen(false);
                      setIsWalletSelectOpen(true);
                    }}>
                      <Text style={[styles.selectInputText, !payWalletId && { color: colors.text.muted }]}>
                        {payWalletId
                          ? (payUseCredit 
                              ? `Cartão de Crédito - ${wallets?.find(w => w.id === payWalletId)?.accounts.find(a => a.id === payBankAccountId)?.creditCards.find(c => c.id === payCreditCardId)?.brand}` 
                              : payBankAccountId 
                                ? `Conta Bancária - ${wallets?.find(w => w.id === payWalletId)?.accounts.find(a => a.id === payBankAccountId)?.bankName}`
                                : `Dinheiro Vivo - ${wallets?.find(w => w.id === payWalletId)?.name}`)
                          : 'Selecionar fonte de pagamento'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn}
                    onPress={handlePaySubmit}
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.saveBtnText}>Confirmar Pagamento</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Wallet/Account Select Modal */}
      <Modal visible={isWalletSelectOpen} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.categorySelectorCard}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderInfo}>
                <Text style={styles.formTitle}>Selecione a Fonte de Pagamento</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => {
                setIsWalletSelectOpen(false);
                setIsPayModalOpen(true);
              }}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryListContent}>
              {wallets?.map(wallet => (
                <View key={wallet.id} style={{ marginBottom: spacing.md }}>
                  <Text style={styles.walletGroupTitle}>{wallet.name}</Text>
                  
                  {/* Dinheiro Vivo */}
                  <TouchableOpacity 
                    style={styles.walletOptionBtn}
                    onPress={() => {
                      setPayWalletId(wallet.id);
                      setPayBankAccountId('');
                      setPayCreditCardId('');
                      setPayUseCredit(false);
                      setIsWalletSelectOpen(false);
                      setIsPayModalOpen(true);
                    }}
                  >
                    <Ionicons name="cash-outline" size={20} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                    <Text style={styles.walletOptionText}>Dinheiro Vivo ({fmt(wallet.cashBalance)})</Text>
                  </TouchableOpacity>

                  {/* Bank Accounts */}
                  {wallet.accounts.map(acc => (
                    <View key={acc.id}>
                      <TouchableOpacity 
                        style={styles.walletOptionBtn}
                        onPress={() => {
                          setPayWalletId(wallet.id);
                          setPayBankAccountId(acc.id);
                          setPayCreditCardId('');
                          setPayUseCredit(false);
                          setIsWalletSelectOpen(false);
                          setIsPayModalOpen(true);
                        }}
                      >
                        <Ionicons name="business-outline" size={20} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                        <Text style={styles.walletOptionText}>{acc.bankName} - Conta ({fmt(acc.debitBalance)})</Text>
                      </TouchableOpacity>

                      {/* Credit Cards */}
                      {acc.creditCards.map(card => (
                        <TouchableOpacity 
                          key={card.id}
                          style={[styles.walletOptionBtn, { paddingLeft: spacing.xl }]}
                          onPress={() => {
                            setPayWalletId(wallet.id);
                            setPayBankAccountId(acc.id);
                            setPayCreditCardId(card.id);
                            setPayUseCredit(true);
                            setIsWalletSelectOpen(false);
                            setIsPayModalOpen(true);
                          }}
                        >
                          <Ionicons name="card-outline" size={20} color={colors.text.secondary} style={{ marginRight: spacing.sm }} />
                          <Text style={styles.walletOptionText}>{card.brand} final {card.lastFourDigits}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

    </Container>
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

  choiceModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...shadow.lg,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  walletGroupTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  walletOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  walletOptionText: {
    ...typography.body,
    color: colors.text.primary,
  },
  embeddedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  embeddedTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  addBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadow.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  choiceTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  choiceSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cancelBtn: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.danger,
  },
});

