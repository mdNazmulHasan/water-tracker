import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { IntakeEntry } from './hydration';
import { entriesByDay, lastNDayKeys, totalForDay } from '../../utils/date';
import { streakDays, bestStreakDays, goalMet } from '../../utils/water';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  color: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_drop', title: 'First Drop', description: 'Log your first glass of water', color: '#0E7CFF' },
  { id: 'glass_runner', title: 'Glass Runner', description: 'Log 5 drinks in a single day', color: '#0FA3E7' },
  { id: 'halfway_hero', title: 'Halfway Hero', description: 'Reach 50% of your daily goal', color: '#2BB673' },
  { id: 'tank_full', title: 'Tank Full', description: 'Hit 100% of your daily goal', color: '#22C55E' },
  { id: 'early_riser', title: 'Early Riser', description: 'First drink before 8:30 AM', color: '#FFB020' },
  { id: 'night_owl', title: 'Night Owl', description: 'Last drink after 9:30 PM', color: '#8B5CF6' },
  { id: 'streak_3', title: 'On a Roll', description: 'Meet your goal 3 days in a row', color: '#F97316' },
  { id: 'streak_7', title: 'Week Warrior', description: 'Meet your goal 7 days in a row', color: '#EF4444' },
  { id: 'streak_14', title: 'Fortnight Flow', description: 'Meet your goal 14 days in a row', color: '#EC4899' },
  { id: 'streak_30', title: 'Hydration Hero', description: 'Meet your goal 30 days in a row', color: '#E11D48' },
  { id: 'week_goal_5', title: 'Strong Week', description: 'Hit your goal on 5 of the last 7 days', color: '#14B8A6' },
  { id: 'month_goal_20', title: 'Iron Will', description: 'Hit your goal on 20 of the last 30 days', color: '#6366F1' },
];

export interface AchievementsState {
  unlocked: string[];
}

const initialState: AchievementsState = {
  unlocked: [],
};

export function satisfiedAchievementIds(
  entries: IntakeEntry[],
  goal: number,
): string[] {
  const byDay = entriesByDay(entries);
  const todayKey = dayjs().format('YYYY-MM-DD');
  const today = byDay[todayKey] ?? [];
  const todayTotal = totalForDay(today);
  const satisfied = new Set<string>();

  if (entries.length > 0) satisfied.add('first_drop');
  if (today.length >= 5) satisfied.add('glass_runner');
  if (todayTotal >= goal * 0.5) satisfied.add('halfway_hero');
  if (todayTotal >= goal) satisfied.add('tank_full');

  if (today.length > 0) {
    const first = Math.min(...today.map((e) => e.timestamp));
    if (dayjs(first).hour() * 60 + dayjs(first).minute() < 8 * 60 + 30) {
      satisfied.add('early_riser');
    }
    const last = Math.max(...today.map((e) => e.timestamp));
    if (dayjs(last).hour() * 60 + dayjs(last).minute() >= 21 * 60 + 30) {
      satisfied.add('night_owl');
    }
  }

  const streak = streakDays(byDay, goal);
  for (const [id, min] of [
    ['streak_3', 3],
    ['streak_7', 7],
    ['streak_14', 14],
    ['streak_30', 30],
  ] as const) {
    if (streak >= min) satisfied.add(id);
  }

  const weekKeys = lastNDayKeys(7, 1);
  const weekMet = weekKeys.filter((k) => goalMet(byDay[k] ?? [], goal)).length;
  if (weekMet >= 5) satisfied.add('week_goal_5');

  const monthKeys = lastNDayKeys(30, 1);
  const monthMet = monthKeys.filter((k) => goalMet(byDay[k] ?? [], goal)).length;
  if (monthMet >= 20) satisfied.add('month_goal_20');

  return ACHIEVEMENTS.map((a) => a.id).filter((id) => satisfied.has(id));
}

export { bestStreakDays };

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    unlockAchievements(state, action: PayloadAction<string[]>) {
      const known = new Set(state.unlocked);
      for (const id of action.payload) known.add(id);
      state.unlocked = [...known];
    },
  },
});

export const { unlockAchievements } = achievementsSlice.actions;
export default achievementsSlice.reducer;
