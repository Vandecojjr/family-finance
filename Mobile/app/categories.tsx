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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { decodeJwt } from '@/utils/jwt';
import { categoriesApi, CategoryResponse } from '@/api/endpoints/categories';

export default function CategoriesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tokens } = useAuthStore();

  // Permissões
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (tokens?.accessToken) {
      const decoded = decodeJwt(tokens.accessToken);
      if (decoded?.role) {
        const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
        setIsAdmin(roles.includes('Admin'));
      }
    }
  }, [tokens]);

  // Estados de Filtro e Modais
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense'); // 1 = income, 2 = expense
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);

  // Estados do Formulário
  const [name, setName] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense'); // 'Income' = Ganho, 'Expense' = Gasto
  const [isSubCategory, setIsSubCategory] = useState(false);
  const [selectedParent, setSelectedParent] = useState<CategoryResponse | null>(null);

  // Busca de categorias
  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  // Mutação para criar categoria
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; type: 'Income' | 'Expense'; parentId: string | null }) => 
      categoriesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
      closeCreateModal();
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message ?? 'Não foi possível criar a categoria.');
    },
  });

  // Alternar expansão de categoria
  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Abrir formulário
  const openCreateModal = () => {
    if (!isAdmin) {
      Alert.alert('Acesso Negado', 'Apenas membros administradores podem criar categorias.');
      return;
    }
    // Define o tipo inicial com base na aba ativa
    setType(activeTab === 'income' ? 'Income' : 'Expense');
    setName('');
    setIsSubCategory(false);
    setSelectedParent(null);
    setIsCreateModalOpen(true);
  };

  // Fechar formulário
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Salvar nova categoria
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validação', 'O nome da categoria é obrigatório.');
      return;
    }
    if (isSubCategory && !selectedParent) {
      Alert.alert('Validação', 'Selecione uma categoria pai para a subcategoria.');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      type,
      parentId: isSubCategory && selectedParent ? selectedParent.id : null,
    });
  };

  // Filtrar categorias com base na aba ativa (Income = Ganhos, Expense = Gastos)
  const activeTypeValue = activeTab === 'income' ? 'Income' : 'Expense';
  const filteredCategories = categories.filter(c => c.type === activeTypeValue && c.parentId === null);

  // Categorias disponíveis para serem Pai (sem parentId e do mesmo tipo selecionado no form)
  const availableParents = categories.filter(c => c.type === type && c.parentId === null);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categorias</Text>
        {isAdmin ? (
          <TouchableOpacity style={styles.addHeaderBtn} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color={colors.brand.teal} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'expense' && styles.activeTabExpense,
          ]}
          onPress={() => setActiveTab('expense')}
        >
          <Ionicons 
            name="trending-down" 
            size={18} 
            color={activeTab === 'expense' ? colors.white : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>
            Gastos (Despesas)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'income' && styles.activeTabIncome,
          ]}
          onPress={() => setActiveTab('income')}
        >
          <Ionicons 
            name="trending-up" 
            size={18} 
            color={activeTab === 'income' ? colors.white : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            Ganhos (Receitas)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin Info Banner */}
      {!isAdmin && (
        <View style={styles.adminBanner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.warning} style={{ marginRight: 8 }} />
          <Text style={styles.adminBannerText}>
            Visualização restrita. Apenas administradores da família podem criar ou gerenciar categorias.
          </Text>
        </View>
      )}

      {/* Body List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>Erro ao obter categorias da família.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="pricetags-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyText}>Nenhuma categoria de {activeTab === 'expense' ? 'gasto' : 'ganho'} cadastrada.</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.createFirstBtn} onPress={openCreateModal}>
              <Text style={styles.createFirstBtnText}>Criar Primeira Categoria</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredCategories.map((category) => {
            const hasSub = category.subCategories && category.subCategories.length > 0;
            const isExpanded = !!expandedCategories[category.id];

            return (
              <View key={category.id} style={styles.categoryCard}>
                {/* Categoria Principal */}
                <TouchableOpacity
                  style={styles.categoryRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (hasSub) {
                      toggleExpand(category.id);
                    }
                  }}
                >
                  <View style={[
                    styles.categoryIconContainer, 
                    { backgroundColor: activeTab === 'expense' ? `${colors.brand.accent}22` : `${colors.brand.teal}22` }
                  ]}>
                    <Ionicons 
                      name="pricetag" 
                      size={18} 
                      color={activeTab === 'expense' ? colors.brand.accent : colors.brand.teal} 
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryNameText}>{category.name}</Text>
                    {hasSub && (
                      <Text style={styles.categorySubCountText}>
                        {category.subCategories.length} {category.subCategories.length === 1 ? 'subcategoria' : 'subcategorias'}
                      </Text>
                    )}
                  </View>
                  {hasSub && (
                    <Ionicons 
                      name={isExpanded ? "chevron-down" : "chevron-forward"} 
                      size={18} 
                      color={colors.text.secondary} 
                    />
                  )}
                </TouchableOpacity>

                {/* Subcategorias aninhadas */}
                {hasSub && isExpanded && (
                  <View style={styles.subCategoriesContainer}>
                    <View style={styles.treeLine} />
                    <View style={styles.subList}>
                      {category.subCategories.map((sub) => (
                        <View key={sub.id} style={styles.subCategoryRow}>
                          <View style={styles.subTreeNodeConnector} />
                          <View style={styles.subIconContainer}>
                            <Ionicons name="chevron-forward-circle" size={10} color={colors.text.muted} />
                          </View>
                          <Text style={styles.subCategoryNameText}>{sub.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Botão Flutuante (Somente Admin) */}
      {isAdmin && filteredCategories.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* ── MODAL: CRIAR CATEGORIA ──────────────────────────────────────────── */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Nova Categoria</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={closeCreateModal}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                {/* Nome */}
                <Text style={styles.label}>Nome da Categoria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Supermercado, Salário, Lazer..."
                  placeholderTextColor={colors.text.muted}
                  value={name}
                  onChangeText={setName}
                />

                {/* Tipo Selector */}
                <Text style={styles.label}>Tipo</Text>
                <View style={styles.formTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.formTypeBtn,
                      type === 'Expense' && styles.formTypeBtnExpenseActive,
                    ]}
                    onPress={() => {
                      setType('Expense');
                      setSelectedParent(null); // reseta parent
                    }}
                  >
                    <Ionicons name="trending-down" size={16} color={type === 'Expense' ? colors.white : colors.text.secondary} />
                    <Text style={[styles.formTypeBtnText, type === 'Expense' && styles.formTypeBtnTextActive]}>
                      Despesa / Gasto
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.formTypeBtn,
                      type === 'Income' && styles.formTypeBtnIncomeActive,
                    ]}
                    onPress={() => {
                      setType('Income');
                      setSelectedParent(null); // reseta parent
                    }}
                  >
                    <Ionicons name="trending-up" size={16} color={type === 'Income' ? colors.white : colors.text.secondary} />
                    <Text style={[styles.formTypeBtnText, type === 'Income' && styles.formTypeBtnTextActive]}>
                      Receita / Ganho
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* É Subcategoria toggle */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text style={styles.toggleLabel}>Esta é uma subcategoria?</Text>
                    <Text style={styles.toggleDesc}>
                      Subcategorias ajudam a detalhar seus lançamentos (ex: Mercado dentro de Alimentação).
                    </Text>
                  </View>
                  <Switch
                    value={isSubCategory}
                    onValueChange={(val) => {
                      setIsSubCategory(val);
                      if (!val) setSelectedParent(null);
                    }}
                    trackColor={{ false: colors.bg.secondary, true: colors.brand.primary }}
                    thumbColor={colors.white}
                  />
                </View>

                {/* Categoria Pai Selector */}
                {isSubCategory && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.label}>Selecione a Categoria Pai</Text>
                    <TouchableOpacity
                      style={styles.pickerTrigger}
                      activeOpacity={0.8}
                      onPress={() => setIsParentPickerOpen(true)}
                    >
                      <Text style={[
                        styles.pickerTriggerText,
                        !selectedParent && { color: colors.text.muted }
                      ]}>
                        {selectedParent ? selectedParent.name : 'Selecionar categoria pai...'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Submit button */}
                <TouchableOpacity
                  style={styles.saveBtn}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
                      <Text style={styles.saveBtnText}>Salvar Categoria</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── SUB-MODAL: PICKER DE CATEGORIA PAI ─────────────────────────────────── */}
      <Modal visible={isParentPickerOpen} animationType="fade" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Escolha a Categoria Pai</Text>
              <TouchableOpacity onPress={() => setIsParentPickerOpen(false)}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pickerList} contentContainerStyle={{ paddingBottom: spacing.md }}>
              {availableParents.length === 0 ? (
                <Text style={styles.pickerEmptyText}>
                  Nenhuma categoria principal de {type === 'Income' ? 'receita' : 'despesa'} encontrada para associar.
                </Text>
              ) : (
                availableParents.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.pickerItem,
                      selectedParent?.id === c.id && styles.pickerItemActive
                    ]}
                    onPress={() => {
                      setSelectedParent(c);
                      setIsParentPickerOpen(false);
                    }}
                  >
                    <Ionicons 
                      name="pricetag-outline" 
                      size={16} 
                      color={selectedParent?.id === c.id ? colors.brand.primary : colors.text.secondary}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[
                      styles.pickerItemText,
                      selectedParent?.id === c.id && styles.pickerItemTextActive
                    ]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  addHeaderBtn: {
    padding: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.white,
  },
  activeTabExpense: {
    backgroundColor: colors.brand.accent,
  },
  activeTabIncome: {
    backgroundColor: colors.brand.teal,
  },
  adminBanner: {
    flexDirection: 'row',
    backgroundColor: `${colors.warning}15`,
    borderRadius: radius.sm,
    borderColor: `${colors.warning}44`,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  adminBannerText: {
    ...typography.bodySmall,
    color: colors.warning,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.bg.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: {
    ...typography.bodySmall,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  createFirstBtn: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  createFirstBtnText: {
    ...typography.button,
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  categoryCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  categoryIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categorySubCountText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  subCategoriesContainer: {
    flexDirection: 'row',
    backgroundColor: `${colors.bg.secondary}66`,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingLeft: spacing.md,
  },
  treeLine: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
    marginLeft: 18, // Alinha com o ícone da categoria principal
  },
  subList: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  subCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  subTreeNodeConnector: {
    width: 14,
    height: 1,
    backgroundColor: colors.border,
    marginRight: 6,
  },
  subIconContainer: {
    marginRight: 8,
  },
  subCategoryNameText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoiding: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalForm: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  formTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  formTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  formTypeBtnExpenseActive: {
    backgroundColor: colors.brand.accent,
    borderColor: colors.brand.accent,
  },
  formTypeBtnIncomeActive: {
    backgroundColor: colors.brand.teal,
    borderColor: colors.brand.teal,
  },
  formTypeBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: 6,
  },
  formTypeBtnTextActive: {
    color: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  toggleDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  pickerTriggerText: {
    ...typography.body,
    color: colors.text.primary,
  },
  saveBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  saveBtnText: {
    ...typography.button,
    color: colors.white,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    width: '100%',
    maxHeight: '60%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  pickerTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  pickerList: {
    marginTop: spacing.xs,
  },
  pickerEmptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  pickerItemActive: {
    backgroundColor: `${colors.brand.primary}15`,
  },
  pickerItemText: {
    ...typography.body,
    color: colors.text.primary,
  },
  pickerItemTextActive: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
});
