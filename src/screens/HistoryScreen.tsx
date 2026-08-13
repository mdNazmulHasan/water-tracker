import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { RootState } from '../store';
import { removeIntake } from '../store/slices/hydration';
import { colors, spacing, typography } from '../theme';
import Card from '../components/Card';
import SegmentedControl from '../components/SegmentedControl';
import BarChart, { BarDatum } from '../components/BarChart';
import { lastNDayKeys, totalForDay } from '../utils/date';
import { liters } from '../utils/water';

type Period = 'today' | 'week' | 'month';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export default function HistoryScreen() {
  const dispatch = useDispatch();
  const entries = useSelector((s: RootState) => s.hydration.entries);
  const goal = useSelector((s: RootState) => s.profile.dailyGoalMl);
  const [period, setPeriod] = useState<Period>('today');

  const byDay = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      const k = dayjs(e.timestamp).format('YYYY-MM-DD');
      if (!map[k]) map[k] = [];
      map[k].push(e);
    }
    return map;
  }, [entries]);

  const todayKey = dayjs().format('YYYY-MM-DD');
  const todayEntries = useMemo(() => byDay[todayKey] ?? [], [byDay, todayKey]);

  const hourlyData = useMemo<BarDatum[]>(() => {
    const hours = new Map<number, number>();
    for (const e of todayEntries) hours.set(dayjs(e.timestamp).hour(), (hours.get(dayjs(e.timestamp).hour()) ?? 0) + e.amount);
    const data: BarDatum[] = [];
    for (let h = 0; h < 24; h++) {
      data.push({ value: hours.get(h) ?? 0, label: `${String(h).padStart(2, '0')}` });
    }
    return data;
  }, [todayEntries]);

  const weekData = useMemo<BarDatum[]>(() => {
    const keys = lastNDayKeys(7);
    return keys.map((k) => ({
      value: totalForDay(byDay[k] ?? []),
      label: dayjs(k).format('ddd').slice(0, 2),
    }));
  }, [byDay]);

  const weekTotal = weekData.reduce((s, d) => s + d.value, 0);
  const weekBest = Math.max(...weekData.map((d) => d.value), 0);

  const monthData = useMemo<BarDatum[]>(() => {
    const keys = lastNDayKeys(30);
    return keys.map((k) => ({
      value: totalForDay(byDay[k] ?? []),
      label: `${dayjs(k).date()}`,
    }));
  }, [byDay]);

  const monthTotal = monthData.reduce((s, d) => s + d.value, 0);
  const monthAvg = monthTotal / 30;

  const todayTotal = totalForDay(todayEntries);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      {period === 'today' && (
        <>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Today's intake</Text>
            <Text style={styles.bigValue}>{liters(todayTotal)}L</Text>
            <Text style={styles.subValue}>
              {todayEntries.length} drinks · {Math.max(0, goal - todayTotal)} ml to go
            </Text>
            <View style={styles.chart}>
              <BarChart
                data={hourlyData}
                goal={goal / 24}
                height={140}
                formatValue={(v) => (v > 0 ? `${(v / 1000).toFixed(1)}L` : '')}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            {todayEntries.length === 0 ? (
              <Text style={styles.emptyText}>
                No drinks logged yet today. Start from the Home tab!
              </Text>
            ) : (
              [...todayEntries]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((e) => (
                  <View key={e.id} style={styles.timelineRow}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineTime}>
                      {dayjs(e.timestamp).format('HH:mm')}
                    </Text>
                    <Text style={styles.timelineAmount}>+{e.amount} ml</Text>
                    <Text
                      style={styles.timelineDelete}
                      onPress={() => dispatch(removeIntake(e.id))}
                    >
                      ×
                    </Text>
                  </View>
                ))
            )}
          </Card>
        </>
      )}

      {period === 'week' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Last 7 days</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{liters(weekTotal)}L</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{liters(weekTotal / 7)}L</Text>
              <Text style={styles.statLabel}>Daily avg</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{liters(weekBest)}L</Text>
              <Text style={styles.statLabel}>Best day</Text>
            </View>
          </View>
          <View style={styles.chart}>
            <BarChart
              data={weekData}
              goal={goal}
              height={170}
              highlightIndex={6}
              formatValue={(v) => (v > 0 ? `${Math.round(v / 100) / 10}L` : '')}
            />
          </View>
        </Card>
      )}

      {period === 'month' && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Last 30 days</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{liters(monthTotal)}L</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{liters(monthAvg)}L</Text>
              <Text style={styles.statLabel}>Daily avg</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {monthData.filter((d) => d.value >= goal).length}
              </Text>
              <Text style={styles.statLabel}>Goal days</Text>
            </View>
          </View>
          <View style={styles.chart}>
            <BarChart
              data={monthData}
              goal={goal}
              height={190}
              highlightIndex={29}
              formatValue={(v) => (v > 0 ? `${Math.round(v / 100) / 10}L` : '')}
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginTop: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
  },
  bigValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  subValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  chart: {
    marginTop: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  timelineTime: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 56,
    fontVariant: ['tabular-nums'],
  },
  timelineAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timelineDelete: {
    fontSize: 22,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});