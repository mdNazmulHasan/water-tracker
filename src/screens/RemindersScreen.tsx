import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setRemindersEnabled,
  setSmartRemindersEnabled,
  setStartTime,
  setEndTime,
  setIntervalMinutes,
} from '../store/slices/reminders';
import { computeSchedule, INTERVAL_OPTIONS } from '../utils/schedule';
import { generateSmartSchedule } from '../utils/smartEngine';
import { requestPermissions } from '../services/notifications';
import { colors, radius, spacing, typography } from '../theme';
import Card from '../components/Card';
import AppSwitch from '../components/AppSwitch';
import TimePicker from '../components/TimePicker';
import { formatTime12, minutesToLabel, timeToMinutes } from '../utils/date';
import dayjs from 'dayjs';

export default function RemindersScreen() {
  const dispatch = useDispatch();
  const reminders = useSelector((s: RootState) => s.reminders);
  const profile = useSelector((s: RootState) => s.profile);
  const hydrationEntries = useSelector((s: RootState) => s.hydration.entries);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    import('@notifee/react-native')
      .then((notifee) => notifee.default.getNotificationSettings())
      .then((settings) => {
        if (mounted) {
          // authorizationStatus: 1 = AUTHORIZED, 2 = PROVISIONAL, 0 = DENIED, -1 = NOT_DETERMINED
          if (settings.authorizationStatus >= 1) {
            setPermissionGranted(true);
          } else if (settings.authorizationStatus === 0) {
            setPermissionGranted(false);
          } else {
            setPermissionGranted(null);
          }
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const todayEntries = useMemo(() => {
    const now = dayjs();
    return hydrationEntries
      .filter((e) => dayjs(e.timestamp).isSame(now, 'day'))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [hydrationEntries]);

  const consumedToday = todayEntries.reduce((sum, e) => sum + e.amount, 0);
  const lastIntake = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : undefined;

  // Classic schedule calculation
  const classicSchedule = useMemo(
    () =>
      computeSchedule(
        reminders.startTime,
        reminders.endTime,
        reminders.intervalMinutes,
      ),
    [reminders.startTime, reminders.endTime, reminders.intervalMinutes],
  );

  // Smart Engine schedule calculation
  const smartResult = useMemo(
    () =>
      generateSmartSchedule(
        consumedToday,
        profile.dailyGoalMl,
        reminders.startTime,
        reminders.endTime,
        reminders.intervalMinutes,
        lastIntake?.timestamp,
      ),
    [
      consumedToday,
      profile.dailyGoalMl,
      reminders.startTime,
      reminders.endTime,
      reminders.intervalMinutes,
      lastIntake?.timestamp,
    ],
  );

  const toggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      setPermissionGranted(granted);
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'Enable notifications for Water Tracker in your system settings to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    dispatch(setRemindersEnabled(value));
  };

  const handleStartTimeChange = (newTime: string) => {
    const minMin = timeToMinutes(profile.wakeTime);
    const maxMin = Math.min(
      timeToMinutes(profile.sleepTime),
      timeToMinutes(reminders.endTime),
    );
    const targetMin = timeToMinutes(newTime);

    if (targetMin < minMin) {
      Alert.alert(
        'Time outside range',
        `Start time cannot be earlier than your wake time (${formatTime12(profile.wakeTime)}).`,
      );
      dispatch(setStartTime(profile.wakeTime));
    } else if (targetMin > maxMin) {
      const boundary =
        timeToMinutes(reminders.endTime) < timeToMinutes(profile.sleepTime)
          ? reminders.endTime
          : profile.sleepTime;
      Alert.alert(
        'Time outside range',
        `Start time cannot be after ${formatTime12(boundary)}.`,
      );
      dispatch(setStartTime(boundary));
    } else {
      dispatch(setStartTime(newTime));
    }
  };

  const handleEndTimeChange = (newTime: string) => {
    const minMin = Math.max(
      timeToMinutes(profile.wakeTime),
      timeToMinutes(reminders.startTime),
    );
    const maxMin = timeToMinutes(profile.sleepTime);
    const targetMin = timeToMinutes(newTime);

    if (targetMin > maxMin) {
      Alert.alert(
        'Time outside range',
        `End time cannot be later than your sleep time (${formatTime12(profile.sleepTime)}).`,
      );
      dispatch(setEndTime(profile.sleepTime));
    } else if (targetMin < minMin) {
      const boundary =
        timeToMinutes(reminders.startTime) > timeToMinutes(profile.wakeTime)
          ? reminders.startTime
          : profile.wakeTime;
      Alert.alert(
        'Time outside range',
        `End time cannot be before ${formatTime12(boundary)}.`,
      );
      dispatch(setEndTime(boundary));
    } else {
      dispatch(setEndTime(newTime));
    }
  };

  const pacing = smartResult.pacing;
  const isSmart = reminders.smartRemindersEnabled;

  const getPacingBadgeStyle = () => {
    switch (pacing.status) {
      case 'ahead':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'critical':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'behind':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'completed':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      default:
        return { bg: colors.primarySoft, text: colors.primaryDark, border: colors.primarySoft };
    }
  };

  const badgeStyle = getPacingBadgeStyle();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLabelWrap}>
            <Text style={styles.rowLabel}>Hydration Reminders</Text>
            {reminders.enabled && permissionGranted === false && (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                accessibilityRole="button"
                accessibilityLabel="Open settings to enable notifications"
              >
                <Text style={styles.rowPermissionNote}>
                  Permission denied — Tap to open Settings
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <AppSwitch value={reminders.enabled} onValueChange={toggle} />
        </View>
      </Card>

      {/* Smart Hydration Engine Card */}
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLabelWrap}>
            <View style={styles.smartTitleRow}>
              <Text style={styles.rowLabel}>Smart Hydration Engine</Text>
              <View style={styles.smartBadge}>
                <Text style={styles.smartBadgeText}>AI Engine</Text>
              </View>
            </View>
            <Text style={styles.rowNote}>
              Dynamically adapts reminder timing and amounts based on your daily intake pace and bedtime.
            </Text>
          </View>
          <AppSwitch
            value={reminders.smartRemindersEnabled}
            onValueChange={(val) => dispatch(setSmartRemindersEnabled(val))}
          />
        </View>
      </Card>

      {/* Real-time Pacing Status (when Smart Reminders is active) */}
      {isSmart && (
        <Card style={styles.card}>
          <View style={styles.pacingHeader}>
            <Text style={styles.cardTitle}>Pacing & Schedule Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                {pacing.statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.pacingHeadline}>{pacing.headline}</Text>
          <Text style={styles.pacingDesc}>{pacing.description}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statVal}>{pacing.remainingMl} ml</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time Left</Text>
              <Text style={styles.statVal}>{pacing.remainingHours} hrs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Adaptive Interval</Text>
              <Text style={styles.statVal}>
                {minutesToLabel(smartResult.adaptiveIntervalMinutes)}
              </Text>
            </View>
          </View>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Active Window</Text>
        <Text style={styles.rowNote}>
          Range: Wake ({formatTime12(profile.wakeTime)}) – Sleep ({formatTime12(profile.sleepTime)})
        </Text>
        <View style={styles.timesRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Start</Text>
            <TimePicker
              value={reminders.startTime}
              onChange={handleStartTimeChange}
            />
          </View>
          <Text style={styles.timeDash}>→</Text>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>End</Text>
            <TimePicker
              value={reminders.endTime}
              onChange={handleEndTimeChange}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          {isSmart ? 'Base Interval (Baseline)' : 'Interval'}
        </Text>
        <Text style={styles.rowNote}>
          {isSmart
            ? `Baseline frequency: ${minutesToLabel(reminders.intervalMinutes)} (Smart Engine will adjust automatically)`
            : `Remind me every ${minutesToLabel(reminders.intervalMinutes)}`}
        </Text>
        <View style={styles.intervalRow}>
          {INTERVAL_OPTIONS.map((min) => {
            const active = reminders.intervalMinutes === min;
            return (
              <Pressable
                key={min}
                style={[styles.intervalChip, active && styles.intervalChipActive]}
                onPress={() => dispatch(setIntervalMinutes(min))}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Interval option ${minutesToLabel(min)}`}
              >
                <Text
                  style={[
                    styles.intervalText,
                    active && styles.intervalTextActive,
                  ]}
                >
                  {minutesToLabel(min)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          {isSmart ? "Today's Smart Drinking Schedule" : 'Daily Schedule'}
        </Text>

        {isSmart ? (
          smartResult.schedule.length === 0 ? (
            <Text style={styles.emptyText}>
              {pacing.status === 'completed'
                ? '🎉 Daily goal completed! No more reminders needed today.'
                : 'No more reminders remaining before bedtime.'}
            </Text>
          ) : (
            <View style={styles.smartScheduleWrap}>
              {smartResult.schedule.map((slot, index) => (
                <View
                  key={index}
                  style={[
                    styles.smartSlotItem,
                    slot.isPast && styles.smartSlotPast,
                  ]}
                >
                  <View style={styles.slotTimeColumn}>
                    <Text style={styles.slotTimeText}>{formatTime12(slot.time)}</Text>
                    {slot.isPast && <Text style={styles.slotPastTag}>Passed</Text>}
                  </View>
                  <View style={styles.slotPortionBadge}>
                    <Text style={styles.slotPortionText}>+{slot.targetAmountMl} ml</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : classicSchedule.length === 0 ? (
          <Text style={styles.emptyText}>No reminders in range</Text>
        ) : (
          <View style={styles.chipWrap}>
            {classicSchedule.map((t) => (
              <View key={t} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{formatTime12(t)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.hint}>
          {isSmart
            ? 'Smart Engine automatically reschedules remaining intervals when you log water or fall behind.'
            : 'Reminders repeat daily at fixed intervals even when the app is closed.'}
        </Text>
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
  card: {
    marginTop: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowPermissionNote: {
    fontSize: 12,
    color: colors.danger || '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  timeDash: {
    fontSize: 18,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  intervalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  intervalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  intervalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intervalText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  intervalTextActive: {
    color: colors.white,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  timeChipText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  smartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smartBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  smartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pacingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pacingHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  pacingDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  smartScheduleWrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  smartSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  smartSlotPast: {
    opacity: 0.45,
  },
  slotTimeColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  slotPastTag: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: '600',
  },
  slotPortionBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  slotPortionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});