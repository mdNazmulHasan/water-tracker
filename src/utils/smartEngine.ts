import { timeToMinutes, minutesToTime } from './date';

export type HydrationStatus = 'ahead' | 'on_track' | 'behind' | 'critical' | 'completed';

export interface SmartPacingInfo {
  status: HydrationStatus;
  statusLabel: string;
  consumedMl: number;
  goalMl: number;
  remainingMl: number;
  expectedMlAtNow: number;
  deltaMl: number; // positive = ahead, negative = behind
  remainingHours: number;
  suggestedHourlyRateMl: number;
  nextSuggestedPortionMl: number;
  headline: string;
  description: string;
}

export interface SmartReminderSlot {
  time: string; // 'HH:mm'
  targetAmountMl: number;
  isPast: boolean;
  statusMessage?: string;
}

export interface SmartScheduleResult {
  schedule: SmartReminderSlot[];
  pacing: SmartPacingInfo;
  nextSlot: SmartReminderSlot | null;
  adaptiveIntervalMinutes: number;
}

/**
 * Normalizes start and end time window in minutes from midnight.
 */
function getActiveWindowMinutes(
  startTime: string,
  endTime: string,
  nowMinutes: number,
): { startMin: number; endMin: number; nowMin: number } {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  if (endMin <= startMin) {
    endMin += 24 * 60; // Crosses midnight
  }
  let nowMin = nowMinutes;
  if (nowMin < startMin && endMin > 24 * 60) {
    nowMin += 24 * 60;
  }
  return { startMin, endMin, nowMin };
}

/**
 * Calculates real-time pacing comparing consumed water against linear day expectation.
 */
export function calculateHydrationPacing(
  consumedMl: number,
  goalMl: number,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
): SmartPacingInfo {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const { startMin, endMin, nowMin } = getActiveWindowMinutes(
    startTime,
    endTime,
    nowMinutes,
  );

  const totalActiveMinutes = Math.max(60, endMin - startMin);
  const elapsedMinutes = Math.max(0, Math.min(totalActiveMinutes, nowMin - startMin));
  const remainingMinutes = Math.max(0, endMin - nowMin);
  const remainingHours = Math.max(0.1, Math.round((remainingMinutes / 60) * 10) / 10);

  const remainingMl = Math.max(0, goalMl - consumedMl);

  if (consumedMl >= goalMl) {
    return {
      status: 'completed',
      statusLabel: 'Goal reached! 🎉',
      consumedMl,
      goalMl,
      remainingMl: 0,
      expectedMlAtNow: goalMl,
      deltaMl: consumedMl - goalMl,
      remainingHours,
      suggestedHourlyRateMl: 0,
      nextSuggestedPortionMl: 0,
      headline: 'Hydration Goal Completed!',
      description: "You've met your daily target. Sip freely as you please!",
    };
  }

  // Expected progress at current point in the active window
  const expectedProgressRatio = totalActiveMinutes > 0 ? elapsedMinutes / totalActiveMinutes : 0;
  const expectedMlAtNow = Math.round(goalMl * expectedProgressRatio);
  const deltaMl = consumedMl - expectedMlAtNow;

  // Suggested hourly intake rate for remaining time
  const suggestedHourlyRateMl =
    remainingMinutes > 0 ? Math.round((remainingMl / (remainingMinutes / 60))) : remainingMl;

  // Pacing status determination
  let status: HydrationStatus = 'on_track';
  let statusLabel = 'On Track';
  let headline = 'Steady progress!';
  let description = 'Keep up this consistent rhythm to reach your target.';

  const deltaRatio = goalMl > 0 ? deltaMl / goalMl : 0;

  if (deltaRatio >= 0.1) {
    status = 'ahead';
    statusLabel = 'Ahead of Pace ⚡';
    headline = 'Ahead of schedule!';
    description = "You're nicely hydrated. Reminders will be spaced comfortably.";
  } else if (deltaRatio <= -0.25) {
    status = 'critical';
    statusLabel = 'Significantly Behind ⚠️';
    headline = 'Catch-up needed!';
    description = `Still need ${remainingMl}ml before bedtime. We tightened reminders to help you catch up safely.`;
  } else if (deltaRatio < -0.08) {
    status = 'behind';
    statusLabel = 'Slightly Behind ⏱️';
    headline = 'A bit behind pace';
    description = 'Take a healthy sip to get back on track for the day.';
  }

  // Next suggested drink portion
  let nextSuggestedPortionMl = 250;
  if (remainingMl > 0) {
    if (status === 'critical') {
      nextSuggestedPortionMl = Math.min(400, Math.max(250, Math.round(remainingMl / 4 / 50) * 50));
    } else if (status === 'ahead') {
      nextSuggestedPortionMl = Math.min(250, Math.max(150, Math.round(remainingMl / 6 / 50) * 50));
    } else {
      nextSuggestedPortionMl = Math.min(350, Math.max(200, Math.round(remainingMl / 5 / 50) * 50));
    }
  }

  return {
    status,
    statusLabel,
    consumedMl,
    goalMl,
    remainingMl,
    expectedMlAtNow,
    deltaMl,
    remainingHours,
    suggestedHourlyRateMl,
    nextSuggestedPortionMl,
    headline,
    description,
  };
}

/**
 * Calculates adaptive reminder frequency based on base interval and user's pacing.
 */
export function getAdaptiveInterval(
  baseIntervalMinutes: number,
  status: HydrationStatus,
): number {
  switch (status) {
    case 'ahead':
      // Lengthen interval by 30-50% (e.g. 120m -> 150m or 180m)
      return Math.min(180, Math.round((baseIntervalMinutes * 1.35) / 15) * 15);
    case 'behind':
      // Shorten interval slightly by 25% (e.g. 120m -> 90m)
      return Math.max(45, Math.round((baseIntervalMinutes * 0.75) / 15) * 15);
    case 'critical':
      // Shorten interval noticeably (e.g. 120m -> 45m or 60m)
      return Math.max(30, Math.round((baseIntervalMinutes * 0.5) / 15) * 15);
    case 'completed':
      return 180;
    case 'on_track':
    default:
      return baseIntervalMinutes;
  }
}

/**
 * Generates an intelligent, adaptive drinking schedule for the day.
 * Recalculates remaining intervals and portions dynamically based on actual progress and missed activity.
 */
export function generateSmartSchedule(
  consumedMl: number,
  goalMl: number,
  startTime: string,
  endTime: string,
  baseIntervalMinutes: number = 120,
  lastIntakeTimestamp?: number,
  now: Date = new Date(),
): SmartScheduleResult {
  const pacing = calculateHydrationPacing(consumedMl, goalMl, startTime, endTime, now);
  const adaptiveInterval = getAdaptiveInterval(baseIntervalMinutes, pacing.status);

  if (pacing.status === 'completed' || pacing.remainingMl <= 0) {
    return {
      schedule: [],
      pacing,
      nextSlot: null,
      adaptiveIntervalMinutes: adaptiveInterval,
    };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const { startMin, endMin, nowMin } = getActiveWindowMinutes(
    startTime,
    endTime,
    nowMinutes,
  );

  const remainingMinutes = endMin - nowMin;
  if (remainingMinutes <= 15) {
    // Bedtime / active window almost reached
    return {
      schedule: [],
      pacing,
      nextSlot: null,
      adaptiveIntervalMinutes: adaptiveInterval,
    };
  }

  // Determine starting point for remaining reminders:
  // If user just drank recently (e.g. within 30 mins), next reminder should be now + adaptiveInterval
  let nextFirstReminderMin = Math.max(startMin, nowMin + 20); // Give at least 20 min notice from right now

  if (lastIntakeTimestamp) {
    const minSinceLastIntake = Math.floor((now.getTime() - lastIntakeTimestamp) / (60 * 1000));
    if (minSinceLastIntake < adaptiveInterval) {
      const waitRemaining = adaptiveInterval - minSinceLastIntake;
      nextFirstReminderMin = Math.max(nextFirstReminderMin, nowMin + waitRemaining);
    }
  }

  const remainingSlotsCount = Math.max(
    1,
    Math.min(10, Math.floor((endMin - nextFirstReminderMin) / adaptiveInterval) + 1),
  );

  const targetPortionPerSlot = Math.max(
    100,
    Math.min(500, Math.round(pacing.remainingMl / remainingSlotsCount / 25) * 25),
  );

  const slots: SmartReminderSlot[] = [];
  let currentSlotMin = nextFirstReminderMin;

  while (currentSlotMin < endMin && slots.length < 12) {
    const rawTime = minutesToTime(currentSlotMin % (24 * 60));
    slots.push({
      time: rawTime,
      targetAmountMl: targetPortionPerSlot,
      isPast: currentSlotMin <= nowMin,
    });
    currentSlotMin += adaptiveInterval;
  }

  // If no slots generated before bedtime, push a single wind-down reminder
  if (slots.length === 0 && remainingMinutes > 15) {
    const reminderMin = Math.min(endMin - 15, nowMin + 20);
    slots.push({
      time: minutesToTime(reminderMin % (24 * 60)),
      targetAmountMl: Math.min(300, pacing.remainingMl),
      isPast: false,
    });
  }

  const nextSlot = slots.find((s) => !s.isPast) || slots[0] || null;

  return {
    schedule: slots,
    pacing,
    nextSlot,
    adaptiveIntervalMinutes: adaptiveInterval,
  };
}

/**
 * Generates custom contextual notification copy based on pacing and portion.
 */
export function getSmartNotificationContent(
  pacing: SmartPacingInfo,
  targetAmountMl: number,
): { title: string; body: string } {
  if (pacing.status === 'completed') {
    return {
      title: 'Goal reached! 🎉',
      body: "You've crushed your daily water target. Stay refreshed!",
    };
  }

  if (pacing.status === 'critical') {
    return {
      title: 'Hydration catch-up 💧',
      body: `You're behind pace with ${pacing.remainingMl}ml to go. A refreshing ${targetAmountMl}ml glass will help you catch up!`,
    };
  }

  if (pacing.status === 'behind') {
    return {
      title: 'Time for a sip ⏱️',
      body: `Take a quick ${targetAmountMl}ml drink to stay on track for your goal today.`,
    };
  }

  if (pacing.status === 'ahead') {
    return {
      title: 'Great pace! 🌊',
      body: `You're ahead of target. Enjoy a gentle ${targetAmountMl}ml sip to maintain your hydration.`,
    };
  }

  return {
    title: 'Hydration reminder 💧',
    body: `Time for your scheduled ${targetAmountMl}ml drink. Every drop keeps you energized!`,
  };
}
