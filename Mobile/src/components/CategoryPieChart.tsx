import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, radius, typography } from '@/theme';
import { CategorySummary } from '@/types';

interface CategoryPieChartProps {
  data: CategorySummary[];
  title: string;
  emptyMessage: string;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CategoryPieChart({ data, title, emptyMessage }: CategoryPieChartProps) {
  console.log('[CategoryPieChart]', title, 'data:', data);
  // Filter out zero or negative values
  const validData = data ? data.filter(item => item.totalAmount > 0) : [];
  const total = validData.reduce((acc, curr) => acc + curr.totalAmount, 0);

  if (total === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  // Circular Chart Math
  const radiusVal = 50;
  const strokeWidth = 14;
  const size = 130;
  const center = size / 2;
  const circumference = 2 * Math.PI * radiusVal;

  let currentOffset = 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chartContainer}>
        {/* SVG Donut Chart */}
        <View style={styles.svgWrapper}>
          <Svg width={size} height={size}>
            <Circle
              cx={center}
              cy={center}
              r={radiusVal}
              stroke={colors.bg.elevated}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {validData.map((item, index) => {
              const percentage = item.totalAmount / total;
              const strokeLength = percentage * circumference;
              const strokeOffset = currentOffset;
              currentOffset -= strokeLength; // Move counter-clockwise

              // Get color from the theme's chart color palette
              const color = colors.chart[index % colors.chart.length];

              return (
                <Circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radiusVal}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  originX={center}
                  originY={center}
                  rotation={-90}
                />
              );
            })}
          </Svg>
          <View style={styles.centerTextWrap}>
            <Text style={styles.centerTotalLabel}>Total</Text>
            <Text style={styles.centerTotalValue}>{fmt(total).replace('R$', '')}</Text>
          </View>
        </View>

        {/* Legend */}
        <ScrollView 
          style={styles.legendContainer}
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.xs, paddingBottom: spacing.sm }}
          showsVerticalScrollIndicator={true}
        >
          {validData.map((item, index) => {
            const percentage = (item.totalAmount / total) * 100;
            const color = colors.chart[index % colors.chart.length];

            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.colorDot, { backgroundColor: color }]} />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendName} numberOfLines={1}>
                    {item.categoryName}
                  </Text>
                  <Text style={styles.legendValue}>
                    {fmt(item.totalAmount)} ({percentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 240,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    flex: 1,
  },
  svgWrapper: {
    position: 'relative',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  centerTextWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTotalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  centerTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    marginTop: 3,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendName: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  legendValue: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
