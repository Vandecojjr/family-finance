import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import { CategoryResponse } from '@/api/endpoints/categories';
import { getCategoryMeta } from '@/utils/categoryHelpers';

interface CategoryPickerProps {
  visible: boolean;
  onClose: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  categories: CategoryResponse[];
  type: 'Income' | 'Expense';
}

export function CategoryPicker({
  visible,
  onClose,
  selectedId,
  onSelect,
  categories,
  type,
}: CategoryPickerProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const targetTypeParents = (categories || []).filter(
      (c) => c.type === type && c.parentId === null
    );

    if (!search.trim()) return targetTypeParents;

    const query = search
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return targetTypeParents
      .map((parent) => {
        const normalizedParent = parent.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const parentMatches = normalizedParent.includes(query);

        const matchingSubs = parent.subCategories
          ? parent.subCategories.filter((sub) => {
              const normalizedSub = sub.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return normalizedSub.includes(query);
            })
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
  }, [categories, type, search]);

  const activeColor = type === 'Income' ? colors.brand.teal : colors.brand.accent;

  // Encontra a categoria ou subcategoria selecionada para exibir no "selecionado"
  const selectedCategory = useMemo(() => {
    for (const parent of categories) {
      if (parent.id === selectedId) return parent;
      if (parent.subCategories) {
        const sub = parent.subCategories.find(s => s.id === selectedId);
        if (sub) return sub;
      }
    }
    return null;
  }, [categories, selectedId]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Drag Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerIconWrap, { backgroundColor: `${activeColor}15` }]}>
                  <Ionicons
                    name={type === 'Income' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                    size={18}
                    color={activeColor}
                  />
                </View>
                <View>
                  <Text style={styles.title}>Categoria</Text>
                  <Text style={styles.subtitle}>
                    {type === 'Income' ? 'Receita' : 'Despesa'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Seleção atual */}
            {selectedCategory && (
              <View style={styles.selectedBanner}>
                <View style={[
                  styles.selectedIcon,
                  { backgroundColor: `${getCategoryMeta(selectedCategory.name, selectedCategory.type).color}15` },
                ]}>
                  <Ionicons
                    name={getCategoryMeta(selectedCategory.name, selectedCategory.type).icon}
                    size={14}
                    color={getCategoryMeta(selectedCategory.name, selectedCategory.type).color}
                  />
                </View>
                <Text style={styles.selectedText} numberOfLines={1}>
                  {selectedCategory.name}
                </Text>
                <TouchableOpacity
                  onPress={() => { onSelect(''); onClose(); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color={colors.text.muted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar categoria..."
                placeholderTextColor={colors.text.muted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCategories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="folder-open-outline" size={28} color={colors.text.muted} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {search.trim() ? 'Sem resultados' : 'Nenhuma categoria'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {search.trim()
                      ? `Nenhuma categoria corresponde a "${search}".`
                      : `Não há categorias de ${type === 'Income' ? 'receita' : 'despesa'} cadastradas.`}
                  </Text>
                </View>
              ) : (
                filteredCategories.map((parent) => {
                  const isParentSelected = selectedId === parent.id;
                  const meta = getCategoryMeta(parent.name, parent.type);
                  const parentColor = meta.color;
                  const hasSubs = parent.subCategories && parent.subCategories.length > 0;

                  return (
                    <View key={parent.id} style={styles.parentGroup}>
                      {/* Parent */}
                      <TouchableOpacity
                        style={[
                          styles.parentRow,
                          isParentSelected && { borderColor: parentColor, backgroundColor: `${parentColor}10` },
                        ]}
                        onPress={() => handleSelect(parent.id)}
                        activeOpacity={0.7}
                      >
                        {/* Accent strip */}
                        <View style={[styles.rowAccent, { backgroundColor: parentColor }]} />

                        <View style={[styles.iconWrap, { backgroundColor: `${parentColor}15` }]}>
                          <Ionicons name={meta.icon} size={18} color={parentColor} />
                        </View>

                        <View style={styles.rowContent}>
                          <Text style={[
                            styles.parentText,
                            isParentSelected && { color: parentColor },
                          ]}>
                            {parent.name}
                          </Text>
                          {hasSubs && (
                            <Text style={styles.parentHint}>
                              {parent.subCategories.length} {parent.subCategories.length === 1 ? 'sub' : 'subs'}
                            </Text>
                          )}
                        </View>

                        {isParentSelected && (
                          <View style={[styles.checkWrap, { backgroundColor: `${parentColor}20` }]}>
                            <Ionicons name="checkmark" size={14} color={parentColor} />
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Subcategories */}
                      {hasSubs && (
                        <View style={styles.subList}>
                          {parent.subCategories.map((sub, idx) => {
                            const isSubSelected = selectedId === sub.id;
                            const subMeta = getCategoryMeta(sub.name, sub.type);
                            const subColor = subMeta.color;
                            const isLast = idx === parent.subCategories.length - 1;

                            return (
                              <TouchableOpacity
                                key={sub.id}
                                style={[
                                  styles.subRow,
                                  isSubSelected && { backgroundColor: `${subColor}08` },
                                ]}
                                onPress={() => handleSelect(sub.id)}
                                activeOpacity={0.7}
                              >
                                {/* Connector */}
                                <View style={styles.connectorWrap}>
                                  <View style={[
                                    styles.connectorV,
                                    { backgroundColor: `${parentColor}20` },
                                    isLast && { height: '50%' },
                                  ]} />
                                  <View style={[styles.connectorH, { backgroundColor: `${parentColor}20` }]} />
                                </View>

                                <View style={[styles.subIconWrap, { backgroundColor: `${subColor}12` }]}>
                                  <Ionicons name={subMeta.icon} size={13} color={subColor} />
                                </View>

                                <Text style={[
                                  styles.subText,
                                  isSubSelected && { color: colors.text.primary, fontWeight: '600' },
                                ]} numberOfLines={1}>
                                  {sub.name}
                                </Text>

                                {isSubSelected && (
                                  <View style={[styles.checkWrapSm, { backgroundColor: `${subColor}20` }]}>
                                    <Ionicons name="checkmark" size={12} color={subColor} />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })
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
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },

  // ─── HEADER ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ─── SELECTED BANNER ────────────────────────────────────────────────
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
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
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    ...typography.bodySmall,
  },

  // ─── LIST ────────────────────────────────────────────────────────────
  list: {
    marginTop: spacing.sm,
    maxHeight: 400,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ─── EMPTY ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
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
  },

  // ─── PARENT ROW ──────────────────────────────────────────────────────
  parentGroup: {
    marginBottom: spacing.sm,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowAccent: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  rowContent: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
  },
  parentText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  parentHint: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 1,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  // ─── SUB ROW ─────────────────────────────────────────────────────────
  subList: {
    paddingLeft: spacing.md + 3, // alinha com o accent strip
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: radius.sm,
    minHeight: 36,
  },
  connectorWrap: {
    width: 20,
    alignSelf: 'stretch',
    flexDirection: 'row',
  },
  connectorV: {
    width: 1,
    height: '100%',
  },
  connectorH: {
    width: 12,
    height: 1,
    alignSelf: 'center',
  },
  subIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  subText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  checkWrapSm: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});
