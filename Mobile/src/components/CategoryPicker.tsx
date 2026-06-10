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
    // Filter parent categories of target type
    const targetTypeParents = categories.filter(
      (c) => c.type === type && c.parentId === null
    );

    if (!search.trim()) return targetTypeParents;

    const query = search.toLowerCase();
    return targetTypeParents
      .map((parent) => {
        // If parent matches search query, keep parent and all subcategories
        const parentMatches = parent.name.toLowerCase().includes(query);
        
        // Filter subcategories that match search query
        const matchingSubs = parent.subCategories
          ? parent.subCategories.filter((sub) =>
              sub.name.toLowerCase().includes(query)
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
  }, [categories, type, search]);

  const activeColor = type === 'Income' ? colors.brand.teal : colors.brand.accent;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Selecionar Categoria</Text>
                <Text style={styles.subtitle}>
                  Escolha uma categoria de {type === 'Income' ? 'receita' : 'despesa'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color={colors.text.secondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar categoria ou subcategoria..."
                placeholderTextColor={colors.text.muted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {filteredCategories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="pricetags-outline" size={48} color={colors.text.muted} />
                  <Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>
                </View>
              ) : (
                filteredCategories.map((parent) => {
                  const isParentSelected = selectedId === parent.id;
                  
                  return (
                    <View key={parent.id} style={styles.parentGroup}>
                      {/* Parent Category Card */}
                      <TouchableOpacity
                        style={[
                          styles.parentRow,
                          isParentSelected && { borderColor: activeColor, backgroundColor: `${activeColor}11` },
                        ]}
                        onPress={() => {
                          onSelect(parent.id);
                          onClose();
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconWrap, { backgroundColor: `${activeColor}15` }]}>
                          <Ionicons name="pricetag" size={16} color={activeColor} />
                        </View>
                        <Text style={[styles.parentText, isParentSelected && { color: activeColor, fontWeight: '700' }]}>
                          {parent.name}
                        </Text>
                        {isParentSelected && (
                          <Ionicons name="checkmark" size={18} color={activeColor} style={styles.checkIcon} />
                        )}
                      </TouchableOpacity>

                      {/* Subcategories */}
                      {parent.subCategories && parent.subCategories.length > 0 && (
                        <View style={styles.subList}>
                          {parent.subCategories.map((sub) => {
                            const isSubSelected = selectedId === sub.id;
                            return (
                              <TouchableOpacity
                                key={sub.id}
                                style={[
                                  styles.subRow,
                                  isSubSelected && { backgroundColor: `${activeColor}08` },
                                ]}
                                onPress={() => {
                                  onSelect(sub.id);
                                  onClose();
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={styles.treeConnector} />
                                <Ionicons
                                  name="chevron-forward-circle-outline"
                                  size={14}
                                  color={isSubSelected ? activeColor : colors.text.secondary}
                                  style={styles.subIcon}
                                />
                                <Text
                                  style={[
                                    styles.subText,
                                    isSubSelected && { color: colors.text.primary, fontWeight: '600' },
                                  ]}
                                >
                                  {sub.name}
                                </Text>
                                {isSubSelected && (
                                  <Ionicons name="checkmark" size={14} color={activeColor} style={styles.checkIcon} />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    ...typography.bodySmall,
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
  parentGroup: {
    marginBottom: spacing.md,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  parentText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  subList: {
    paddingLeft: spacing.lg,
    marginTop: spacing.xs,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    position: 'relative',
  },
  treeConnector: {
    position: 'absolute',
    left: -12,
    top: 0,
    bottom: '50%',
    width: 12,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  subIcon: {
    marginRight: spacing.xs,
  },
  subText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
});
