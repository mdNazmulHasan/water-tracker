/**
 * Water Tracker — React Native
 * @format
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import { syncReminders, setupForegroundNotifications } from './src/services/notifications';
import RootNavigator from './src/navigation/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { colors } from './src/theme';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';

setupForegroundNotifications();

function MainContent() {
  const hasCompletedOnboarding = useSelector(
    (state: RootState) => state.profile.hasCompletedOnboarding
  );

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return <RootNavigator />;
}

function ReminderSyncBootstrap() {
  useEffect(() => {
    const { reminders } = store.getState();
    syncReminders(reminders);
  }, []);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer
            theme={{
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                primary: colors.primary,
                background: colors.background,
                card: colors.surface,
                text: colors.text,
                border: colors.border,
                notification: colors.primary,
              },
            }}
          >
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <ReminderSyncBootstrap />
            <MainContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;