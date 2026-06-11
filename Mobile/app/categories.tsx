import React, { useState, useEffect, useMemo } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { decodeJwt } from '@/utils/jwt';
import { categoriesApi, CategoryResponse } from '@/api/endpoints/categories';
import { getCategoryMeta } from '@/utils/categoryHelpers';

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

  // Estados de Filtro, Busca e Modais
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);

  // Estados do Formulário
  const [name, setName] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
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

  // Expandir/recolher todas
  const toggleAll = () => {
    const allExpanded = filteredCategories.every(c => !!expandedCategories[c.id]);
    if (allExpanded) {
      setExpandedCategories({});
    } else {
      const newExpanded: Record<string, boolean> = {};
      filteredCategories.forEach(c => { newExpanded[c.id] = true; });
      setExpandedCategories(newExpanded);
    }
  };

  // Abrir formulário
  const openCreateModal = () => {
    if (!isAdmin) {
      Alert.alert('Acesso Negado', 'Apenas membros administradores podem criar categorias.');
      return;
    }
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

  // Filtrar categorias com base na aba ativa e busca
  const activeTypeValue = activeTab === 'income' ? 'Income' : 'Expense';
  const typeMatchedCategories = useMemo(() => {
    return categories.filter(c => c.type === activeTypeValue && c.parentId === null);
  }, [categories, activeTypeValue]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return typeMatchedCategories;
    const query = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return typeMatchedCategories
      .map((parent) => {
        const parentMatches = parent.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query);
        const matchingSubs = parent.subCategories
          ? parent.subCategories.filter((sub) =>
              sub.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
            )
          : [];

        if (parentMatches || matchingSubs.length > 0) {
          return {
            ...parent,
            subCategories: parentMatches ? parent.subCategories || [] : matchingSubs,
          };
        }
        return null;
      })
      .filter((parent): parent is CategoryResponse => parent !== null);
  }, [typeMatchedCategories, search]);

  // Efeito para expandir categorias automaticamente durante a busca
  useEffect(() => {
    if (search.trim() && filteredCategories.length > 0) {
      const newExpanded: Record<string, boolean> = {};
      filteredCategories.forEach((cat) => {
        newExpanded[cat.id] = true;
      });
      setExpandedCategories(newExpanded);
    }
  }, [search, filteredCategories]);


  // Categorias disponíveis para serem Pai
  const availableParents = categories.filter(c => c.type === type && c.parentId === null);

  // Cor ativa baseada na aba
  const activeColor = activeTab === 'expense' ? colors.brand.accent : colors.brand.teal;

  // Verificar se categorias com sub existem e se todas estão expandidas
  const categoriesWithSubs = filteredCategories.filter(c => c.subCategories && c.subCategories.length > 0);
  const allExpanded = categoriesWithSubs.length > 0 && categoriesWithSubs.every(c => !!expandedCategories[c.id]);

  // Preview Meta para o modal de criação
  const previewMeta = useMemo(() => getCategoryMeta(name || 'Nova Categoria', type), [name, type]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Categorias</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'expense' ? 'Despesas & Gastos' : 'Receitas & Ganhos'}
          </Text>
        </View>
        {isAdmin ? (
          <TouchableOpacity style={[styles.addHeaderBtn, { backgroundColor: `${activeColor}15` }]} onPress={openCreateModal}>
            <Ionicons name="add" size={20} color={activeColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* ─── TABS ──────────────────────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.activeTabExpense]}
          onPress={() => setActiveTab('expense')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-down-circle"
            size={16}
            color={activeTab === 'expense' ? colors.white : colors.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>
            Despesas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTabIncome]}
          onPress={() => setActiveTab('income')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up-circle"
            size={16}
            color={activeTab === 'income' ? colors.white : colors.text.secondary}
          />
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            Receitas
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── SEARCH ────────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categorias..."
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── ADMIN BANNER ──────────────────────────────────────────────── */}
      {!isAdmin && (
        <View style={styles.adminBanner}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.warning} style={{ marginRight: spacing.sm }} />
          <Text style={styles.adminBannerText}>
            Somente administradores podem criar ou editar categorias.
          </Text>
        </View>
      )}

      {/* ─── EXPAND/COLLAPSE TOGGLE ────────────────────────────────────── */}
      {categoriesWithSubs.length > 0 && !isLoading && !error && (
        <View style={styles.expandToggleRow}>
          <Text style={styles.sectionLabel}>
            {search.trim() ? `${filteredCategories.length} resultado(s)` : `${filteredCategories.length} categorias`}
          </Text>
          <TouchableOpacity style={styles.expandToggleBtn} onPress={toggleAll} activeOpacity={0.7}>
            <Ionicons
              name={allExpanded ? 'contract-outline' : 'expand-outline'}
              size={14}
              color={colors.text.secondary}
            />
            <Text style={styles.expandToggleText}>
              {allExpanded ? 'Recolher' : 'Expandir'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── BODY LIST ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Falha ao carregar</Text>
          <Text style={styles.errorText}>Não foi possível obter as categorias da família.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={16} color={colors.brand.primary} style={{ marginRight: spacing.xs }} />
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="pricetags-outline" size={40} color={colors.text.muted} />
          </View>
          <Text style={styles.emptyTitle}>
            {search.trim() ? 'Sem resultados' : 'Nenhuma categoria'}
          </Text>
          <Text style={styles.emptyText}>
            {search.trim()
              ? `Nenhuma categoria corresponde à busca "${search}".`
              : `Você ainda não tem categorias de ${activeTab === 'expense' ? 'despesa' : 'receita'} cadastradas.`}
          </Text>
          {isAdmin && !search.trim() && (
            <TouchableOpacity style={[styles.createFirstBtn, { backgroundColor: activeColor }]} onPress={openCreateModal} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={18} color={colors.white} style={{ marginRight: spacing.xs }} />
              <Text style={styles.createFirstBtnText}>Criar Primeira Categoria</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredCategories.map((category) => {
            const hasSub = category.subCategories && category.subCategories.length > 0;
            const isExpanded = !!expandedCategories[category.id];
            const meta = getCategoryMeta(category.name, category.type);
            const parentColor = meta.color;

            return (
              <View key={category.id} style={[styles.categoryCard, isExpanded && styles.categoryCardExpanded]}>
                {/* Barra lateral de cor */}
                <View style={[styles.cardAccentStrip, { backgroundColor: parentColor }]} />

                {/* Categoria Principal */}
                <View style={styles.cardBody}>
                  <TouchableOpacity
                    style={styles.categoryRow}
                    activeOpacity={0.7}
                    onPress={() => hasSub && toggleExpand(category.id)}
                  >
                    <View style={[styles.categoryIconContainer, { backgroundColor: `${parentColor}18` }]}>
                      <Ionicons name={meta.icon} size={20} color={parentColor} />
                    </View>

                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryNameText}>{category.name}</Text>
                      {hasSub && (
                        <Text style={[styles.categorySubLabel, { color: parentColor }]}>
                          {category.subCategories.length} {category.subCategories.length === 1 ? 'subcategoria' : 'subcategorias'}
                        </Text>
                      )}
                    </View>

                    {hasSub ? (
                      <View style={[styles.expandBtnWrap, { backgroundColor: `${parentColor}12` }]}>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={parentColor}
                        />
                      </View>
                    ) : (
                      <View style={styles.soloIndicator}>
                        <Ionicons name="ellipse" size={6} color={`${parentColor}55`} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Subcategorias aninhadas */}
                  {hasSub && isExpanded && (
                    <View style={styles.subCategoriesContainer}>
                      {category.subCategories.map((sub, idx) => {
                        const subMeta = getCategoryMeta(sub.name, sub.type);
                        const subColor = subMeta.color;
                        const isLast = idx === category.subCategories.length - 1;
                        return (
                          <View key={sub.id} style={[styles.subCategoryRow, isLast && { marginBottom: 0 }]}>
                            {/* Connector visual */}
                            <View style={styles.subConnectorWrap}>
                              <View style={[styles.subConnectorV, { backgroundColor: `${parentColor}25` }, isLast && { height: '50%' }]} />
                              <View style={[styles.subConnectorH, { backgroundColor: `${parentColor}25` }]} />
                            </View>

                            <View style={[styles.subIconContainer, { backgroundColor: `${subColor}15` }]}>
                              <Ionicons name={subMeta.icon} size={13} color={subColor} />
                            </View>
                            <Text style={styles.subCategoryNameText}>{sub.name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ─── FAB ────────────────────────────────────────────────────────── */}
      {isAdmin && filteredCategories.length > 0 && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: activeColor }]} onPress={openCreateModal} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* ─── MODAL: CRIAR CATEGORIA ────────────────────────────────────── */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              {/* Drag Handle */}
              <View style={styles.modalHandle} />

              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Nova Categoria</Text>
                  <Text style={styles.modalSubtitle}>Organize suas finanças</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={closeCreateModal}>
                  <Ionicons name="close" size={20} color={colors.text.secondary} />
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
                      setSelectedParent(null);
                    }}
                  >
                    <Ionicons name="arrow-down-circle" size={16} color={type === 'Expense' ? colors.white : colors.text.secondary} />
                    <Text style={[styles.formTypeBtnText, type === 'Expense' && styles.formTypeBtnTextActive]}>
                      Despesa
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.formTypeBtn,
                      type === 'Income' && styles.formTypeBtnIncomeActive,
                    ]}
                    onPress={() => {
                      setType('Income');
                      setSelectedParent(null);
                    }}
                  >
                    <Ionicons name="arrow-up-circle" size={16} color={type === 'Income' ? colors.white : colors.text.secondary} />
                    <Text style={[styles.formTypeBtnText, type === 'Income' && styles.formTypeBtnTextActive]}>
                      Receita
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* É Subcategoria toggle */}
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text style={styles.toggleLabel}>Esta é uma subcategoria?</Text>
                    <Text style={styles.toggleDesc}>
                      Detalhe seus lançamentos (ex: Mercado → Alimentação).
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
                    <Text style={styles.label}>Categoria Pai</Text>
                    <TouchableOpacity
                      style={styles.pickerTrigger}
                      activeOpacity={0.8}
                      onPress={() => setIsParentPickerOpen(true)}
                    >
                      {selectedParent ? (
                        <View style={styles.pickerSelectedRow}>
                          <View style={[styles.pickerSelectedIcon, { backgroundColor: `${getCategoryMeta(selectedParent.name, selectedParent.type).color}15` }]}>
                            <Ionicons
                              name={getCategoryMeta(selectedParent.name, selectedParent.type).icon}
                              size={14}
                              color={getCategoryMeta(selectedParent.name, selectedParent.type).color}
                            />
                          </View>
                          <Text style={styles.pickerTriggerText}>{selectedParent.name}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.pickerTriggerText, { color: colors.text.muted }]}>
                          Selecionar categoria pai...
                        </Text>
                      )}
                      <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Live Preview Card */}
                {name.trim().length > 0 && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewTitle}>Prévia</Text>
                    <View style={[styles.previewCard, { borderColor: `${previewMeta.color}44` }]}>
                      <View style={[styles.previewStrip, { backgroundColor: previewMeta.color }]} />
                      <View style={[styles.categoryIconContainer, { backgroundColor: `${previewMeta.color}18` }]}>
                        <Ionicons name={previewMeta.icon} size={20} color={previewMeta.color} />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryNameText}>{name}</Text>
                        <Text style={styles.categorySubLabel}>
                          {isSubCategory
                            ? `Sub de: ${selectedParent?.name || '—'}`
                            : `${type === 'Income' ? 'Receita' : 'Despesa'} principal`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: type === 'Income' ? colors.brand.teal : colors.brand.accent }]}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
                      <Text style={styles.saveBtnText}>Salvar Categoria</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>

              {/* ─── PARENT PICKER OVERLAY ─────────────────────────────── */}
              {isParentPickerOpen && (
                <View style={[StyleSheet.absoluteFill, styles.parentPickerOverlay]}>
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Escolha a Categoria Pai</Text>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsParentPickerOpen(false)}>
                      <Ionicons name="close" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerList} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}>
                    {availableParents.length === 0 ? (
                      <View style={styles.pickerEmptyContainer}>
                        <Ionicons name="folder-open-outline" size={32} color={colors.text.muted} />
                        <Text style={styles.pickerEmptyText}>
                          Nenhuma categoria principal de {type === 'Income' ? 'receita' : 'despesa'} encontrada.
                        </Text>
                      </View>
                    ) : (
                      availableParents.map((c) => {
                        const cMeta = getCategoryMeta(c.name, c.type);
                        const isSelected = selectedParent?.id === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              styles.pickerItem,
                              isSelected && { backgroundColor: `${cMeta.color}12`, borderColor: `${cMeta.color}44` },
                            ]}
                            onPress={() => {
                              setSelectedParent(c);
                              setIsParentPickerOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.pickerItemIcon, { backgroundColor: `${cMeta.color}15` }]}>
                              <Ionicons name={cMeta.icon} size={16} color={cMeta.color} />
                            </View>
                            <Text style={[
                              styles.pickerItemText,
                              isSelected && { color: cMeta.color, fontWeight: '700' },
                            ]}>
                              {c.name}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={18} color={cMeta.color} />
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
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

  // ─── HEADER ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ─── TABS ────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.full,
    gap: 6,
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.white,
  },
  activeTabExpense: {
    backgroundColor: colors.brand.accent,
    ...shadow.sm,
  },
  activeTabIncome: {
    backgroundColor: colors.brand.teal,
    ...shadow.sm,
  },

  // ─── SEARCH ──────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    ...typography.bodySmall,
  },

  // ─── STATS ───────────────────────────────────────────────────────────


  // ─── ADMIN BANNER ────────────────────────────────────────────────────
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}10`,
    borderRadius: radius.sm,
    borderColor: `${colors.warning}30`,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  adminBannerText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
  },

  // ─── EXPAND/COLLAPSE ROW ────────────────────────────────────────────
  expandToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandToggleText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // ─── CENTER STATES (loading / error / empty) ─────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.text.muted,
    marginTop: spacing.md,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: `${colors.danger}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: {
    ...typography.bodySmall,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: `${colors.brand.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadow.sm,
  },
  createFirstBtnText: {
    ...typography.button,
    color: colors.white,
  },

  // ─── CATEGORY LIST ───────────────────────────────────────────────────
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryCardExpanded: {
    borderColor: colors.bg.elevated,
    ...shadow.sm,
  },
  cardAccentStrip: {
    width: 3,
  },
  cardBody: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
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
  categorySubLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  categorySubCountText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  expandBtnWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soloIndicator: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── SUBCATEGORIES ───────────────────────────────────────────────────
  subCategoriesContainer: {
    paddingLeft: spacing.md + 20, // Alinha com o texto do pai
    paddingRight: spacing.md,
    paddingBottom: spacing.sm,
  },
  subCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    minHeight: 32,
  },
  subConnectorWrap: {
    width: 20,
    alignSelf: 'stretch',
    flexDirection: 'row',
  },
  subConnectorV: {
    width: 1,
    height: '100%',
  },
  subConnectorH: {
    width: 12,
    height: 1,
    alignSelf: 'center',
  },
  subIconContainer: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  subCategoryNameText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },

  // ─── FAB ─────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
  },

  // ─── MODAL ───────────────────────────────────────────────────────────
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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
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
  modalSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ─── MODAL FORM ──────────────────────────────────────────────────────
  modalForm: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
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
    backgroundColor: colors.bg.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: spacing.md,
  },
  formTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.full,
    gap: 6,
  },
  formTypeBtnExpenseActive: {
    backgroundColor: colors.brand.accent,
    ...shadow.sm,
  },
  formTypeBtnIncomeActive: {
    backgroundColor: colors.brand.teal,
    ...shadow.sm,
  },
  formTypeBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
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

  // ─── PICKER ──────────────────────────────────────────────────────────
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
    flex: 1,
  },
  pickerSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  pickerSelectedIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── PREVIEW ─────────────────────────────────────────────────────────
  previewContainer: {
    marginBottom: spacing.md,
  },
  previewTitle: {
    ...typography.caption,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 2,
    overflow: 'hidden',
  },
  previewStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },

  // ─── SAVE BUTTON ─────────────────────────────────────────────────────
  saveBtn: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  saveBtnText: {
    ...typography.button,
    color: colors.white,
  },

  // ─── PARENT PICKER OVERLAY ───────────────────────────────────────────
  parentPickerOverlay: {
    backgroundColor: colors.bg.secondary,
    zIndex: 10,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pickerList: {
    marginTop: spacing.sm,
  },
  pickerEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  pickerEmptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.transparent,
    gap: spacing.sm,
  },
  pickerItemIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
});
