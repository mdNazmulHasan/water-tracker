import notifee, {
  TriggerType,
  RepeatFrequency,
  EventType,
  AndroidImportance,
} from '@notifee/react-native';
import dayjs from 'dayjs';
import { RemindersState } from '../store/slices/reminders';
import { computeSchedule } from '../utils/schedule';

const CHANNEL_ID = 'water-reminders';
const NOTIFICATION_ID_PREFIX = 'water-reminder-';

async function ensureChannel(): Promise<string> {
  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Water reminders',
    importance: AndroidImportance.HIGH,
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

export async function syncReminders(reminders: RemindersState): Promise<void> {
  try {
    const channelId = await ensureChannel();
    await notifee.cancelAllNotifications();

    if (!reminders.enabled) {
      return;
    }

    const schedule = computeSchedule(
      reminders.startTime,
      reminders.endTime,
      reminders.intervalMinutes,
    );

    const now = new Date();
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
          title: 'Time to hydrate',
          body: 'Take a sip — every drop counts.',
          android: { channelId },
        },
        trigger,
      );
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
