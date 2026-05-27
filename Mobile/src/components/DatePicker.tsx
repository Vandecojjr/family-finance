import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadow } from '@/theme';

interface DatePickerProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (date: string) => void;
  accentColor?: string;
  title?: string;
  showClear?: boolean;
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function DatePicker({
  visible,
  value,
  onClose,
  onSelect,
  accentColor = colors.brand.primary,
  title = 'Selecionar Data',
  showClear = false,
}: DatePickerProps) {
  // Parse initial value or fallback to today
  const getInitialDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      // Use local timezone constructor to avoid timezone shift
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [selectedDateStr, setSelectedDateStr] = useState(value || '');

  useEffect(() => {
    if (visible) {
      const initial = getInitialDate();
      setCurrentDate(initial);
      setSelectedDateStr(value || '');
    }
  }, [visible, value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateStr = (y: number, m: number, d: number) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  };

  // Get calendar details
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const formatted = formatDateStr(year, month, day);
    setSelectedDateStr(formatted);
  };

  const handleConfirm = () => {
    if (selectedDateStr) {
      onSelect(selectedDateStr);
    }
    onClose();
  };

  const handleClear = () => {
    onSelect('');
    onClose();
  };

  // Generate day cells
  const dayCells = [];
  // Add empty spaces for offset
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<View key={`empty-${i}`} style={styles.dayCellEmpty} />);
  }
  // Add days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = formatDateStr(year, month, d);
    const isSelected = selectedDateStr === dayStr;
    const isToday = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) === dayStr;

    dayCells.push(
      <TouchableOpacity
        key={`day-${d}`}
        style={[
          styles.dayCell,
          isSelected && { backgroundColor: accentColor },
          !isSelected && isToday && styles.dayCellToday,
        ]}
        onPress={() => handleSelectDay(d)}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && styles.dayTextSelected,
            !isSelected && isToday && { color: accentColor },
          ]}
        >
          {d}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {MONTHS[month]} de {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Labels */}
            <View style={styles.weekdays}>
              {WEEKDAYS.map((label, index) => (
                <Text key={`weekday-${index}`} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.grid}>{dayCells}</View>

            {/* Actions Footer */}
            <View style={styles.footer}>
              {showClear && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearBtnText}>Limpar</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: accentColor }]}
                onPress={handleConfirm}
                disabled={!selectedDateStr}
              >
                <Text style={styles.confirmBtnText}>Selecionar</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    width: 40,
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: spacing.sm,
    marginBottom: spacing.md,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  dayCellEmpty: {
    width: 40,
    height: 40,
    marginHorizontal: 1,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelBtnText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  confirmBtn: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  clearBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  clearBtnText: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '600',
  },
});
