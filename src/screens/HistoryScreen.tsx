import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const [editingEntry, setEditingEntry] = useState<IntakeEntry | null>(null);
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
    setEditingEntry(entry);
    setEditAmountText(String(entry.amount));
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    const parsed = parseInt(editAmountText, 10);
    if (!isNaN(parsed) && parsed > 0) {
      dispatch(updateIntake({ id: editingEntry.id, amount: parsed }));
    }
    setEditingEntry(null);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
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
    <View style={styles.screen}>
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
                sortedTodayEntries.map((e) => (
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

      {/* Edit Intake Modal */}
      <Modal
        visible={!!editingEntry}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelEdit}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Drink</Text>
            {editingEntry && (
              <Text style={styles.modalSubtitle}>
                Logged at {formatClock(editingEntry.timestamp)}
              </Text>
            )}

            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                value={editAmountText}
                onChangeText={setEditAmountText}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.modalUnit}>ml</Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel edit"
                style={styles.modalCancelBtn}
                onPress={handleCancelEdit}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save edit"
                style={styles.modalSaveBtn}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveBtnText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    ...typography.subheading,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    minWidth: 100,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});