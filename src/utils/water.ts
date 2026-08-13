import { ActivityLevel } from '../store/slices/profile';
import { IntakeEntry } from '../store/slices/hydration';
import { totalForDay } from './date';

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 0.9,
  light: 1.0,
  moderate: 1.1,
  active: 1.2,
  veryActive: 1.35,
};

export function roundTo50(ml: number): number {
  return Math.max(500, Math.round(ml / 50) * 50);
}

export function recommendedGoalMl(weightKg: number, activity: ActivityLevel): number {
  return roundTo50(weightKg * 35 * ACTIVITY_MULTIPLIER[activity]);
}

export function pct(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((consumed / goal) * 100));
}

export function liters(ml: number): string {
  return (ml / 1000).toFixed(2);
}

export function goalMet(entries: IntakeEntry[], goal: number): boolean {
  return totalForDay(entries) >= goal;
}

export function streakDays(
  byDay: Record<string, IntakeEntry[]>,
  goal: number,
): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 1000; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
    const dayEntries = byDay[key] ?? [];
    if (goalMet(dayEntries, goal)) {
      streak++;
    } else {
      if (i === 0) {
        continue;
      }
      break;
    }
  }
  return streak;
}

export function bestStreakDays(
  byDay: Record<string, IntakeEntry[]>,
  goal: number,
): number {
  const keys = Object.keys(byDay).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    if (!goalMet(byDay[key], goal)) {
      run = 0;
      prev = null;
      continue;
    }
    const cur = new Date(`${key}T00:00:00`);
    if (prev) {
      const diffDays = Math.round(
        (cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
      );
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}
