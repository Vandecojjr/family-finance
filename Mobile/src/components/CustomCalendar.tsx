import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';

export interface CalendarIndicator {
  hasPayable: boolean;
  hasReceivable: boolean;
}

interface CustomCalendarProps {
  indicators: Record<string, CalendarIndicator>;
  onDayPress: (dateString: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CustomCalendar({ indicators, onDayPress, onMonthChange }: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1);
  };

  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result = [];
    let week = [];
    
    // Empty days at start
    for (let i = 0; i < firstDay; i++) {
      week.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      result.push(week);
    }

    return result;
  }, [year, month]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map(d => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((week, wIdx) => (
          <View key={`week-${wIdx}`} style={styles.dayRow}>
            {week.map((day, dIdx) => {
              if (day === null) {
                return <View key={`empty-${wIdx}-${dIdx}`} style={styles.dayCell} />;
              }

              const m = String(month + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const dateString = `${year}-${m}-${d}`;
              const ind = indicators[dateString];
              const isToday = dateString === todayStr;

              return (
                <TouchableOpacity 
                  key={dateString} 
                  style={[styles.dayCell, isToday && styles.todayCell]}
                  onPress={() => onDayPress(dateString)}
                >
                  <Text style={[styles.dayText, isToday && styles.todayText]}>
                    {day}
                  </Text>
                  <View style={styles.dotsContainer}>
                    {ind?.hasReceivable && <View style={[styles.dot, { backgroundColor: colors.brand.teal }]} />}
                    {ind?.hasPayable && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  navBtn: {
    padding: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekDayText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  grid: {
    gap: spacing.xs,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  todayCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayText: {
    ...typography.body,
    color: colors.text.primary,
  },
  todayText: {
    fontWeight: '700',
    color: colors.brand.primary,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
