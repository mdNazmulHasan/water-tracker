import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { RootState } from '../store';
import { addIntake, removeIntake } from '../store/slices/hydration';
import { computeSchedule, nextReminderAt } from '../utils/schedule';
import { colors, radius, shadow, spacing, typography } from '../theme';
import ProgressRing from '../components/ProgressRing';
import Card from '../components/Card';
import { DropIcon, BellIcon, UndoIcon } from '../components/icons';
import { pct, liters } from '../utils/water';
import { minutesToLabel } from '../utils/date';

const QUICK_ADD = [250, 500];
const PRESET_AMOUNTS = [150, 250, 400, 750];

export default function HomeScreen() {
  const dispatch = useDispatch();
  const entries = useSelector((s: RootState) => s.hydration.entries);
  const goal = useSelector((s: RootState) => s.profile.dailyGoalMl);
  const reminders = useSelector((s: RootState) => s.reminders);

  const today = useMemo(() => {
    const key = dayjs().format('YYYY-MM-DD');
    return entries.filter(
      (e) => dayjs(e.timestamp).format('YYYY-MM-DD') === key,
    );
  }, [entries]);

  const consumed = today.reduce((sum, e) => sum + e.amount, 0);
  const percent = pct(consumed, goal);
  const lastEntry = today.length > 0 ? today[today.length - 1] : null;

  const nextReminder = useMemo(() => {
    if (!reminders.enabled) return null;
    const schedule = computeSchedule(
      reminders.startTime,
      reminders.endTime,
      reminders.intervalMinutes,
    );
    return nextReminderAt(schedule);
  }, [reminders]);

  const hour = dayjs().hour();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const add = (amount: number) => dispatch(addIntake(amount));
  const undo = () => lastEntry && dispatch(removeIntake(lastEntry.id));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{dayjs().format('dddd, MMM D')}</Text>
        </View>
        <Pressable style={styles.undoButton} onPress={undo} disabled={!lastEntry}>
          <UndoIcon size={18} color={lastEntry ? colors.primary : colors.textMuted} />
          <Text
            style={[
              styles.undoText,
              !lastEntry && { color: colors.textMuted },
            ]}
          >
            Undo
          </Text>
        </Pressable>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing progress={percent / 100} size={240} strokeWidth={20}>
          <View style={styles.ringCenter}>
            <Text style={styles.ringValue}>
              {liters(consumed)}L
            </Text>
            <Text style={styles.ringGoal}>of {liters(goal)}L goal</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{percent}% completed</Text>
            </View>
          </View>
        </ProgressRing>
      </View>

      <View style={styles.quickRow}>
        {QUICK_ADD.map((amount) => (
          <Pressable
            key={amount}
            style={({ pressed }) => [
              styles.quickButton,
              pressed && styles.quickButtonPressed,
            ]}
            onPress={() => add(amount)}
          >
            <DropIcon size={22} color={colors.white} />
            <Text style={styles.quickButtonText}>+{amount} ml</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.presetRow}>
        {PRESET_AMOUNTS.map((amount) => (
          <Pressable
            key={amount}
            style={styles.presetButton}
            onPress={() => add(amount)}
          >
            <Text style={styles.presetText}>+{amount}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.reminderCard}>
        <View style={styles.reminderRow}>
          <View style={styles.reminderIcon}>
            <BellIcon size={20} color={colors.primary} />
          </View>
          <View style={styles.reminderBody}>
            <Text style={styles.reminderTitle}>
              {nextReminder
                ? `Next reminder: ${nextReminder}`
                : 'Reminders are off'}
            </Text>
            <Text style={styles.reminderSubtitle}>
              {nextReminder
                ? `Every ${minutesToLabel(reminders.intervalMinutes)} · ${reminders.startTime} – ${reminders.endTime}`
                : 'Turn them on from the Reminders tab'}
            </Text>
          </View>
        </View>
      </Card>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.title,
    color: colors.text,
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  undoText: {
    marginLeft: 6,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  ringWrap: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
  },
  ringGoal: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pill: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  pillText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  quickButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  quickButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  presetButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
  reminderCard: {
    marginTop: spacing.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBody: {
    marginLeft: spacing.md,
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  reminderSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});