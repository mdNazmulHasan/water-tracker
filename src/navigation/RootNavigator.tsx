import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import {
  HomeIcon,
  HistoryIcon,
  BellIcon,
  PersonIcon,
  TrophyIcon,
} from '../components/icons';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TABS = [
  { name: 'Home', component: HomeScreen, icon: HomeIcon, label: 'Home' },
  { name: 'History', component: HistoryScreen, icon: HistoryIcon, label: 'History' },
  { name: 'Reminders', component: RemindersScreen, icon: BellIcon, label: 'Reminders' },
  { name: 'Profile', component: ProfileScreen, icon: PersonIcon, label: 'Profile' },
  { name: 'Achievements', component: AchievementsScreen, icon: TrophyIcon, label: 'Streaks' },
] as const;

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: typeof HomeIcon;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Icon size={24} color={color} />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          headerStyle: styles.header,
          headerTitleStyle: typography.subheading,
          headerShadowVisible: false,
          tabBarIcon: ({ color, focused }) =>
            tab ? (
              <TabIcon icon={tab.icon} color={color} focused={focused} />
            ) : null,
        };
      }}
    >
      {TABS.map(({ name, component, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{ title: label, tabBarLabel: label }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingBottom: 8,
    height: 72,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  header: {
    backgroundColor: colors.background,
  },
});