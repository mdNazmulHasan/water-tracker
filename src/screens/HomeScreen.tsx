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
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { RootState } from '../store';
import { addIntake, addIntakeAt, removeIntake } from '../store/slices/hydration';
import { computeSchedule, nextReminderAt } from '../utils/schedule';
import { colors, radius, shadow, spacing, typography } from '../theme';
import ProgressRing from '../components/ProgressRing';
import Card from '../components/Card';
import TimePicker from '../components/TimePicker';
import { DropIcon, BellIcon, UndoIcon, PlusIcon } from '../components/icons';
import { pct, liters } from '../utils/water';
import { formatTime12, formatTimeRange, minutesToLabel } from '../utils/date';
import { TabNavigation } from '../navigation/types';

const QUICK_ADD = [250, 500];
const PRESET_AMOUNTS = [150, 300, 450, 750];

export default function HomeScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<TabNavigation>();
  const entries = useSelector((s: RootState) => s.hydration.entries);
  const goal = useSelector((s: RootState) => s.profile.dailyGoalMl);
  const reminders = useSelector((s: RootState) => s.reminders);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('250');
  const [customTime, setCustomTime] = useState(() => dayjs().format('HH:mm'));

  const today = useMemo(() => {
    const now = dayjs();
    return entries
      .filter((e) => dayjs(e.timestamp).isSame(now, 'day'))
      .sort((a, b) => a.timestamp - b.timestamp);
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

  const openCustomModal = () => {
    setCustomAmount('250');
    setCustomTime(dayjs().format('HH:mm'));
    setIsCustomModalOpen(true);
  };

  const handleSaveCustom = () => {
    const parsedAmount = parseInt(customAmount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      const [h, m] = customTime.split(':').map(Number);
      const timestamp = dayjs()
        .hour(h ?? 0)
        .minute(m ?? 0)
        .second(0)
        .millisecond(0)
        .valueOf();
      dispatch(addIntakeAt({ amount: parsedAmount, timestamp }));
    }
    setIsCustomModalOpen(false);
  };

  return (
    <View style={styles.screen}>
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
          <Pressable
            style={styles.undoButton}
            onPress={undo}
            disabled={!lastEntry}
            accessibilityRole="button"
            accessibilityLabel="Undo last intake"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
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
              accessibilityRole="button"
              accessibilityLabel={`Add ${amount} ml of water`}
            >
              <DropIcon size={22} color={colors.white} />
              <Text style={styles.quickButtonText}>+{amount} ml</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.presetSection}>
          <View style={styles.presetRow}>
            {PRESET_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                style={({ pressed }) => [
                  styles.presetButton,
                  pressed && styles.presetButtonPressed,
                ]}
                onPress={() => add(amount)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${amount} ml of water`}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.presetText}>+{amount} ml</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.customWideButton,
              pressed && styles.presetButtonPressed,
            ]}
            onPress={openCustomModal}
            accessibilityRole="button"
            accessibilityLabel="Add custom water amount and time"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <PlusIcon size={16} color={colors.primary} />
            <Text style={styles.customWideButtonText}>Custom amount & time</Text>
          </Pressable>
        </View>

        <Card
          style={styles.reminderCard}
          onPress={!nextReminder ? () => navigation.navigate('Reminders') : undefined}
          accessibilityLabel={
            nextReminder
              ? `Next reminder: ${formatTime12(nextReminder)}`
              : 'Reminders are off. Tap to open Reminders tab.'
          }
        >
          <View style={styles.reminderRow}>
            <View style={styles.reminderIcon}>
              <BellIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.reminderBody}>
              <Text style={styles.reminderTitle}>
                {nextReminder
                  ? `Next reminder: ${formatTime12(nextReminder)}`
                  : 'Reminders are off'}
              </Text>
              <Text style={styles.reminderSubtitle}>
                {nextReminder
                  ? `Every ${minutesToLabel(reminders.intervalMinutes)} · ${formatTimeRange(reminders.startTime, reminders.endTime)}`
                  : 'Turn them on from the Reminders tab'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Custom Intake Modal */}
      <Modal
        visible={isCustomModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsCustomModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add Custom Drink</Text>
            <Text style={styles.modalSubtitle}>
              Specify amount and logged time
            </Text>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Amount</Text>
              <View style={styles.modalInputRow}>
                <TextInput
                  style={styles.modalInput}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={styles.modalUnit}>ml</Text>
              </View>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Time</Text>
              <View style={styles.timePickerContainer}>
                <TimePicker value={customTime} onChange={setCustomTime} />
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel custom intake"
                style={styles.modalCancelBtn}
                onPress={() => setIsCustomModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add custom intake"
                style={styles.modalSaveBtn}
                onPress={handleSaveCustom}
              >
                <Text style={styles.modalSaveBtnText}>Add</Text>
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
    marginBottom: spacing.md,
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
  presetSection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  presetButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.primarySoft,
  },
  presetText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  customWideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderStyle: 'dashed',
    gap: 6,
    ...shadow.card,
  },
  customWideButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  reminderCard: {
    marginTop: spacing.xs,
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
  modalFieldGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
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