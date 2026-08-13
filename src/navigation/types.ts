import { NavigationProp } from '@react-navigation/native';

export type RootTabParamList = {
  Home: undefined;
  History: undefined;
  Reminders: undefined;
  Profile: undefined;
  Achievements: undefined;
};

export type TabNavigation = NavigationProp<RootTabParamList>;