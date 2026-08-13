import React from 'react';
import { StyleSheet, Switch } from 'react-native';
import { colors } from '../theme';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function AppSwitch({ value, onValueChange }: AppSwitchProps) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.surfaceAlt, true: colors.primarySoft }}
      thumbColor={value ? colors.primary : colors.textMuted}
      ios_backgroundColor={colors.surfaceAlt}
    />
  );
}

export const switchStyles = StyleSheet.create({});