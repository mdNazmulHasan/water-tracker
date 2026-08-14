import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';

import hydration, {
  addIntake,
  removeIntake,
  clearDay,
} from './slices/hydration';
import profile, { setWakeTime, setSleepTime } from './slices/profile';
import reminders, {
  setRemindersEnabled,
  setStartTime,
  setEndTime,
  setIntervalMinutes,
} from './slices/reminders';
import achievements, {
  unlockAchievements,
  satisfiedAchievementIds,
} from './slices/achievements';
import { syncReminders } from '../services/notifications';
import { clampTime, timeToMinutes } from '../utils/date';

const rootReducer = combineReducers({
  hydration,
  profile,
  reminders,
  achievements,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(addIntake, removeIntake, clearDay),
  effect: (_action, api) => {
    const state = api.getState() as RootState;
    const satisfied = satisfiedAchievementIds(
      state.hydration.entries,
      state.profile.dailyGoalMl,
    );
    api.dispatch(unlockAchievements(satisfied));
  },
});

listenerMiddleware.startListening({
  matcher: isAnyOf(setWakeTime, setSleepTime),
  effect: (action, api) => {
    const state = api.getState() as RootState;
    const { wakeTime, sleepTime } = state.profile;
    let { startTime, endTime } = state.reminders;

    if (setWakeTime.match(action)) {
      startTime = wakeTime;
      if (
        timeToMinutes(endTime) < timeToMinutes(startTime) ||
        timeToMinutes(endTime) > timeToMinutes(sleepTime)
      ) {
        endTime = sleepTime;
      }
    } else if (setSleepTime.match(action)) {
      endTime = sleepTime;
      if (
        timeToMinutes(startTime) > timeToMinutes(endTime) ||
        timeToMinutes(startTime) < timeToMinutes(wakeTime)
      ) {
        startTime = wakeTime;
      }
    }

    const nextStart = clampTime(startTime, wakeTime, sleepTime);
    const nextEnd = clampTime(endTime, nextStart, sleepTime);

    if (nextStart !== state.reminders.startTime) {
      api.dispatch(setStartTime(nextStart));
    }
    if (nextEnd !== state.reminders.endTime) {
      api.dispatch(setEndTime(nextEnd));
    }
  },
});

listenerMiddleware.startListening({
  matcher: isAnyOf(
    setRemindersEnabled,
    setStartTime,
    setEndTime,
    setIntervalMinutes,
  ),
  effect: (_action, api) => {
    const state = api.getState() as RootState;
    syncReminders(state.reminders);
  },
});

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).prepend(listenerMiddleware.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;