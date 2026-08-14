import { clampTime, formatClock, formatTime12, formatTimeRange, minutesToTime, timeToMinutes } from '../src/utils/date';
import { computeSchedule } from '../src/utils/schedule';

describe('Time utils & Reminders boundary logic', () => {
  test('timeToMinutes converts HH:mm string to total minutes from midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('07:30')).toBe(450);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  test('minutesToTime converts minutes from midnight to HH:mm string', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(450)).toBe('07:30');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  test('formatTime12 and formatTimeRange format times into 12-hour AM/PM format', () => {
    expect(formatTime12('00:00')).toBe('12:00 AM');
    expect(formatTime12('07:30')).toBe('7:30 AM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
    expect(formatTime12('23:30')).toBe('11:30 PM');
    expect(formatTimeRange('08:00', '22:00')).toBe('8:00 AM – 10:00 PM');
  });

  test('clampTime restricts times to within min and max boundaries', () => {
    const wake = '07:00';
    const sleep = '23:00';

    // Earlier than wake time -> clamped to wake time
    expect(clampTime('05:30', wake, sleep)).toBe('07:00');

    // Later than sleep time -> clamped to sleep time
    expect(clampTime('23:30', wake, sleep)).toBe('23:00');

    // Within wake and sleep time -> unchanged
    expect(clampTime('09:00', wake, sleep)).toBe('09:00');
  });

  test('computeSchedule respects start and end times within wake/sleep bounds', () => {
    const times = computeSchedule('07:00', '23:00', 120);
    expect(times[0]).toBe('07:00');
    expect(times[times.length - 1]).toBe('21:00');
    expect(times.every((t) => timeToMinutes(t) >= timeToMinutes('07:00'))).toBe(
      true,
    );
    expect(timeToMinutes(times[times.length - 1])).toBeLessThan(
      timeToMinutes('23:00'),
    );
  });
});

