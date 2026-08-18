import {
  calculateHydrationPacing,
  generateSmartSchedule,
  getAdaptiveInterval,
  getSmartNotificationContent,
} from '../src/utils/smartEngine';

describe('Smart Hydration Engine ⭐', () => {
  describe('calculateHydrationPacing', () => {
    test('identifies when user is on track', () => {
      // 12 hours active window (08:00 - 20:00). At 14:00 (halfway), expected = 1250ml of 2500ml
      const now = new Date('2026-08-18T14:00:00');
      const pacing = calculateHydrationPacing(1250, 2500, '08:00', '20:00', now);

      expect(pacing.status).toBe('on_track');
      expect(pacing.remainingMl).toBe(1250);
      expect(pacing.deltaMl).toBe(0);
      expect(pacing.remainingHours).toBe(6);
    });

    test('identifies when user is ahead of pace', () => {
      // At 14:00 (halfway), consumed 1800ml of 2500ml (expected 1250ml, +550ml ahead)
      const now = new Date('2026-08-18T14:00:00');
      const pacing = calculateHydrationPacing(1800, 2500, '08:00', '20:00', now);

      expect(pacing.status).toBe('ahead');
      expect(pacing.deltaMl).toBeGreaterThan(0);
      expect(pacing.remainingMl).toBe(700);
    });

    test('identifies when user is behind pace and adjusts portion', () => {
      // Example from specification: Goal: 2,500ml, Consumed: 1,000ml, Remaining: 1,500ml, 6 hours until bedtime
      const now = new Date('2026-08-18T14:00:00');
      const pacing = calculateHydrationPacing(1000, 2500, '08:00', '20:00', now);

      expect(pacing.remainingMl).toBe(1500);
      expect(pacing.remainingHours).toBe(6);
      expect(pacing.status).toBe('behind');
      expect(pacing.nextSuggestedPortionMl).toBeGreaterThanOrEqual(250);
    });

    test('handles goal completed', () => {
      const now = new Date('2026-08-18T16:00:00');
      const pacing = calculateHydrationPacing(2600, 2500, '08:00', '20:00', now);

      expect(pacing.status).toBe('completed');
      expect(pacing.remainingMl).toBe(0);
    });
  });

  describe('getAdaptiveInterval', () => {
    test('lengthens interval when ahead of pace', () => {
      const interval = getAdaptiveInterval(120, 'ahead');
      expect(interval).toBeGreaterThan(120);
    });

    test('shortens interval when behind pace', () => {
      const interval = getAdaptiveInterval(120, 'behind');
      expect(interval).toBeLessThan(120);
    });

    test('significantly shortens interval when critically behind', () => {
      const interval = getAdaptiveInterval(120, 'critical');
      expect(interval).toBeLessThanOrEqual(60);
    });
  });

  describe('generateSmartSchedule', () => {
    test('generates dynamic remaining schedule for 1500ml remaining over 6 hours', () => {
      const now = new Date('2026-08-18T14:00:00');
      const result = generateSmartSchedule(
        1000,
        2500,
        '08:00',
        '20:00',
        120,
        undefined,
        now,
      );

      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.pacing.remainingMl).toBe(1500);
      // All future slots must have realistic portion sizes
      expect(result.schedule[0].targetAmountMl).toBeGreaterThanOrEqual(150);
      expect(result.schedule[0].targetAmountMl).toBeLessThanOrEqual(500);
    });

    test('missed reminder recovery: delays next reminder if user logged water very recently', () => {
      const now = new Date('2026-08-18T14:00:00');
      const tenMinutesAgo = now.getTime() - 10 * 60 * 1000;
      const result = generateSmartSchedule(
        1000,
        2500,
        '08:00',
        '20:00',
        120,
        tenMinutesAgo,
        now,
      );

      expect(result.schedule.length).toBeGreaterThan(0);
      // First slot time should be at least ~80-90 min from now
      const [h, m] = result.schedule[0].time.split(':').map(Number);
      const slotMin = h * 60 + m;
      expect(slotMin).toBeGreaterThan(14 * 60);
    });

    test('returns empty schedule when goal is completed', () => {
      const now = new Date('2026-08-18T14:00:00');
      const result = generateSmartSchedule(
        2500,
        2500,
        '08:00',
        '20:00',
        120,
        undefined,
        now,
      );

      expect(result.schedule.length).toBe(0);
      expect(result.nextSlot).toBeNull();
      expect(result.pacing.status).toBe('completed');
    });
  });

  describe('getSmartNotificationContent', () => {
    test('produces encouraging and specific copy', () => {
      const pacing = calculateHydrationPacing(
        1000,
        2500,
        '08:00',
        '20:00',
        new Date('2026-08-18T14:00:00'),
      );
      const content = getSmartNotificationContent(pacing, 300);

      expect(content.title).toBeDefined();
      expect(content.body).toContain('300ml');
    });
  });
});
