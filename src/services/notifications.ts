import notifee, {
  TriggerType,
  RepeatFrequency,
  EventType,
  AndroidImportance,
} from '@notifee/react-native';
import dayjs from 'dayjs';
import { RemindersState } from '../store/slices/reminders';
import { IntakeEntry } from '../store/slices/hydration';
import { ProfileState } from '../store/slices/profile';
import { computeSchedule } from '../utils/schedule';
import {
  generateSmartSchedule,
  getSmartNotificationContent,
} from '../utils/smartEngine';

const CHANNEL_ID = 'water-reminders';
const NOTIFICATION_ID_PREFIX = 'water-reminder-';

async function ensureChannel(): Promise<string> {
  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Water reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
  return channelId;
}

export async function requestPermissions(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const d = dayjs(now).hour(hour).minute(minute).second(0).millisecond(0);
  return d.isBefore(dayjs(now)) ? d.add(1, 'day').toDate() : d.toDate();
}

export async function syncReminders(
  reminders: RemindersState,
  hydrationEntries: IntakeEntry[] = [],
  profile?: ProfileState,
): Promise<void> {
  try {
    const channelId = await ensureChannel();
    await notifee.cancelAllNotifications();

    if (!reminders.enabled) {
      return;
    }

    const now = new Date();

    if (reminders.smartRemindersEnabled && profile) {
      // Smart Hydration Engine mode
      const todayEntries = hydrationEntries.filter((e) =>
        dayjs(e.timestamp).isSame(dayjs(now), 'day'),
      );
      const consumedMl = todayEntries.reduce((sum, e) => sum + e.amount, 0);
      const lastEntry =
        todayEntries.length > 0
          ? todayEntries[todayEntries.length - 1]
          : undefined;

      const smartResult = generateSmartSchedule(
        consumedMl,
        profile.dailyGoalMl,
        reminders.startTime,
        reminders.endTime,
        reminders.intervalMinutes,
        lastEntry?.timestamp,
        now,
      );

      for (const [index, slot] of smartResult.schedule.entries()) {
        const [h, m] = slot.time.split(':').map(Number);
        const targetDate = dayjs(now)
          .hour(h ?? 0)
          .minute(m ?? 0)
          .second(0)
          .millisecond(0);

        if (targetDate.isAfter(dayjs(now))) {
          const content = getSmartNotificationContent(
            smartResult.pacing,
            slot.targetAmountMl,
          );
          const trigger = {
            type: TriggerType.TIMESTAMP as const,
            timestamp: targetDate.valueOf(),
          };

          await notifee.createTriggerNotification(
            {
              id: `${NOTIFICATION_ID_PREFIX}${index}`,
              title: content.title,
              body: content.body,
              android: { channelId },
              ios: { sound: 'default' },
            },
            trigger,
          );
        }
      }
    } else {
      // Classic fixed-interval schedule
      const schedule = computeSchedule(
        reminders.startTime,
        reminders.endTime,
        reminders.intervalMinutes,
      );

      for (const [index, time] of schedule.entries()) {
        const [h, m] = time.split(':').map(Number);
        const trigger = {
          type: TriggerType.TIMESTAMP as const,
          timestamp: nextOccurrence(h, m, now).getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        };
        await notifee.createTriggerNotification(
          {
            id: `${NOTIFICATION_ID_PREFIX}${index}`,
            title: 'Time to hydrate 💧',
            body: 'Take a sip — every drop counts.',
            android: { channelId },
            ios: { sound: 'default' },
          },
          trigger,
        );
      }
    }
  } catch (e) {
    console.warn('Failed to sync reminders', e);
  }
}

export function setupForegroundNotifications(): void {
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.DELIVERED && detail.notification) {
      notifee.displayNotification(detail.notification);
    }
  });
}
