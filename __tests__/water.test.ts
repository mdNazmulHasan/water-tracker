/**
 * @format
 */

import { computeSchedule, nextReminderAt } from '../src/utils/schedule';
import { recommendedGoalMl } from '../src/utils/water';

test('computeSchedule generates interval times between start and end', () => {
  const times = computeSchedule('08:00', '22:00', 120);
  expect(times[0]).toBe('08:00');
  expect(times[1]).toBe('10:00');
  expect(times[times.length - 1]).toBe('20:00');
  expect(times).not.toContain('22:00');
});

test('computeSchedule handles an end time before start (overnight)', () => {
  const times = computeSchedule('22:00', '06:00', 240);
  expect(times[0]).toBe('22:00');
  expect(times).toContain('02:00');
  expect(times[times.length - 1]).toBe('02:00');
});

test('nextReminderAt picks the next time after now', () => {
  const schedule = ['08:00', '12:00', '18:00'];
  expect(nextReminderAt(schedule, new Date(2026, 0, 1, 9, 0))).toBe('12:00');
  expect(nextReminderAt(schedule, new Date(2026, 0, 1, 23, 0))).toBe('08:00');
});

test('recommendedGoalMl scales with weight and activity', () => {
  const sedentary = recommendedGoalMl(70, 'sedentary');
  const active = recommendedGoalMl(70, 'active');
  expect(sedentary).toBeGreaterThan(0);
  expect(active).toBeGreaterThan(sedentary);
});

test('recommendedGoalMl is lower for female than male', () => {
  const female = recommendedGoalMl(70, 'light', 'female');
  const male = recommendedGoalMl(70, 'light', 'male');
  expect(female).toBeLessThan(male);
});