import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { recommendedGoalMl } from '../../utils/water';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'veryActive';

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly active' },
  { value: 'moderate', label: 'Moderately active' },
  { value: 'active', label: 'Very active' },
  { value: 'veryActive', label: 'Athlete' },
];

export interface ProfileState {
  weightKg: number;
  activityLevel: ActivityLevel;
  wakeTime: string;
  sleepTime: string;
  dailyGoalMl: number;
  customGoal: boolean;
}

const initialState: ProfileState = {
  weightKg: 70,
  activityLevel: 'light',
  wakeTime: '07:00',
  sleepTime: '23:00',
  dailyGoalMl: recommendedGoalMl(70, 'light'),
  customGoal: false,
};

function applyRecommended(state: ProfileState) {
  if (!state.customGoal) {
    state.dailyGoalMl = recommendedGoalMl(state.weightKg, state.activityLevel);
  }
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setWeight(state, action: PayloadAction<number>) {
      state.weightKg = action.payload;
      applyRecommended(state);
    },
    setActivityLevel(state, action: PayloadAction<ActivityLevel>) {
      state.activityLevel = action.payload;
      applyRecommended(state);
    },
    setWakeTime(state, action: PayloadAction<string>) {
      state.wakeTime = action.payload;
    },
    setSleepTime(state, action: PayloadAction<string>) {
      state.sleepTime = action.payload;
    },
    setDailyGoal(state, action: PayloadAction<number>) {
      state.dailyGoalMl = action.payload;
      state.customGoal = true;
    },
    applyRecommendedGoal(state) {
      state.customGoal = false;
      applyRecommended(state);
    },
  },
});

export const {
  setWeight,
  setActivityLevel,
  setWakeTime,
  setSleepTime,
  setDailyGoal,
  applyRecommendedGoal,
} = profileSlice.actions;
export default profileSlice.reducer;
