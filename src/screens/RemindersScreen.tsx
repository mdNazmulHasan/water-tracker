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
  setStartTime,
  setEndTime,
  setIntervalMinutes,
} from '../store/slices/reminders';
import { computeSchedule, INTERVAL_OPTIONS } from '../utils/schedule';
import { requestPermissions } from '../services/notifications';
import { colors, radius, spacing, typography } from '../theme';
import Card from '../components/Card';
import AppSwitch from '../components/AppSwitch';
import TimePicker from '../components/TimePicker';
import { clampTime, formatTime12, minutesToLabel, timeToMinutes } from '../utils/date';

export default function RemindersScreen() {
  const dispatch = useDispatch();
  const reminders = useSelector((s: RootState) => s.reminders);
  const profile = useSelector((s: RootState) => s.profile);
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

  const schedule = useMemo(
    () =>
      computeSchedule(
        reminders.startTime,
        reminders.endTime,
        reminders.intervalMinutes,
      ),
    [reminders.startTime, reminders.endTime, reminders.intervalMinutes],
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLabelWrap}>
            <Text style={styles.rowLabel}>Reminders</Text>
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

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Schedule</Text>
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
        <Text style={styles.cardTitle}>Interval</Text>
        <Text style={styles.rowNote}>
          Remind me every {minutesToLabel(reminders.intervalMinutes)}
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
        <Text style={styles.cardTitle}>Daily schedule</Text>
        {schedule.length === 0 ? (
          <Text style={styles.emptyText}>No reminders in range</Text>
        ) : (
          <View style={styles.chipWrap}>
            {schedule.map((t) => (
              <View key={t} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{formatTime12(t)}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.hint}>
          Reminders repeat daily and will show as notifications even when the
          app is closed.
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
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});