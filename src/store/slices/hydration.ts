import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IntakeEntry {
  id: string;
  amount: number;
  timestamp: number;
}

export interface HydrationState {
  entries: IntakeEntry[];
}

const initialState: HydrationState = {
  entries: [],
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const hydrationSlice = createSlice({
  name: 'hydration',
  initialState,
  reducers: {
    addIntake(state, action: PayloadAction<number>) {
      state.entries.push({
        id: uid(),
        amount: action.payload,
        timestamp: Date.now(),
      });
    },
    addIntakeAt(state, action: PayloadAction<{ amount: number; timestamp: number }>) {
      state.entries.push({
        id: uid(),
        amount: action.payload.amount,
        timestamp: action.payload.timestamp,
      });
    },
    removeIntake(state, action: PayloadAction<string>) {
      state.entries = state.entries.filter((e) => e.id !== action.payload);
    },
    clearDay(state, action: PayloadAction<string>) {
      const prefix = `${action.payload}T00:00:00`;
      const next = new Date(prefix).getTime();
      const end = next + 24 * 60 * 60 * 1000;
      state.entries = state.entries.filter(
        (e) => e.timestamp < next || e.timestamp >= end,
      );
    },
  },
});

export const { addIntake, addIntakeAt, removeIntake, clearDay } =
  hydrationSlice.actions;
export default hydrationSlice.reducer;
