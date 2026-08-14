import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RemindersState {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
}

const initialState: RemindersState = {
  enabled: false,
  startTime: '07:00',
  endTime: '23:00',
  intervalMinutes: 120,
};

const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    setRemindersEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload;
    },
    setStartTime(state, action: PayloadAction<string>) {
      state.startTime = action.payload;
    },
    setEndTime(state, action: PayloadAction<string>) {
      state.endTime = action.payload;
    },
    setIntervalMinutes(state, action: PayloadAction<number>) {
      state.intervalMinutes = action.payload;
    },
  },
});

export const {
  setRemindersEnabled,
  setStartTime,
  setEndTime,
  setIntervalMinutes,
} = remindersSlice.actions;
export default remindersSlice.reducer;