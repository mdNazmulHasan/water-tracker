import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { RootState } from '../store';
import { IntakeEntry, removeIntake, updateIntake } from '../store/slices/hydration';
import { colors, radius, spacing, typography } from '../theme';
import Card from '../components/Card';
import SegmentedControl from '../components/SegmentedControl';
import BarChart, { BarDatum } from '../components/BarChart';
import { EditIcon } from '../components/icons';
import {
  entriesByDay,
  formatClock,
  lastNDayKeys,
  todayKey,
  totalForDay,
} from '../utils/date';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmountText, setEditAmountText] = useState<string>('');

  const byDay = useMemo(() => entriesByDay(entries), [entries]);

  const currentTodayKey = todayKey();
  const todayEntries = useMemo(
    () => byDay[currentTodayKey] ?? [],
    [byDay, currentTodayKey]
  );

  const sortedTodayEntries = useMemo(
    () => [...todayEntries].sort((a, b) => b.timestamp - a.timestamp),
    [todayEntries]
  );

  const handleStartEdit = (entry: IntakeEntry) => {
    setEditingId(entry.id);
    setEditAmountText(String(entry.amount));
  };

  const handleSaveEdit = (id: string) => {
    const parsed = parseInt(editAmountText, 10);
    if (!isNaN(parsed) && parsed > 0) {
      dispatch(updateIntake({ id, amount: parsed }));
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const hourlyData = useMemo<BarDatum[]>(() => {
    const hours = new Map<number, number>();
    for (const e of todayEntries)
      hours.set(
        dayjs(e.timestamp).hour(),
        (hours.get(dayjs(e.timestamp).hour()) ?? 0) + e.amount
      );
    const data: BarDatum[] = [];
    for (let h = 0; h < 24; h++) {
      data.push({
        value: hours.get(h) ?? 0,
        label: `${String(h).padStart(2, '0')}`,
      });
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
                formatValue={(v) => (v > 0 ? `${liters(v)}L` : '')}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            {sortedTodayEntries.length === 0 ? (
              <Text style={styles.emptyText}>
                No drinks logged yet today. Start from the Home tab!
              </Text>
            ) : (
              sortedTodayEntries.map((e) => {
                const isEditing = editingId === e.id;
                if (isEditing) {
                  return (
                    <View key={e.id} style={styles.editRow}>
                      <Text style={styles.timelineTime}>
                        {formatClock(e.timestamp)}
                      </Text>
                      <TextInput
                        style={styles.editInput}
                        value={editAmountText}
                        onChangeText={setEditAmountText}
                        keyboardType="number-pad"
                        autoFocus
                        selectTextOnFocus
                      />
                      <Text style={styles.editUnit}>ml</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Save edit"
                        style={styles.saveBtn}
                        onPress={() => handleSaveEdit(e.id)}
                      >
                        <Text style={styles.saveBtnText}>Save</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel edit"
                        style={styles.cancelBtn}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <View key={e.id} style={styles.timelineRow}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineTime}>
                      {formatClock(e.timestamp)}
                    </Text>
                    <Text style={styles.timelineAmount}>+{e.amount} ml</Text>
                    <View style={styles.actionButtons}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit entry"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => handleStartEdit(e)}
                        style={styles.actionBtn}
                      >
                        <EditIcon size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete entry"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => dispatch(removeIntake(e.id))}
                        style={styles.actionBtn}
                      >
                        <Text style={styles.timelineDelete}>×</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
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
              formatValue={(v) => (v > 0 ? `${liters(v)}L` : '')}
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
              formatValue={(v) => (v > 0 ? `${liters(v)}L` : '')}
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: 4,
  },
  timelineDelete: {
    fontSize: 22,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  editInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 60,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  editUnit: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});