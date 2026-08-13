import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  ACTIVITY_OPTIONS,
  setWeight,
  setActivityLevel,
  setWakeTime,
  setSleepTime,
  setDailyGoal,
  applyRecommendedGoal,
  ActivityLevel,
} from '../store/slices/profile';
import { colors, radius, spacing, typography } from '../theme';
import Card from '../components/Card';
import TimePicker from '../components/TimePicker';
import { recommendedGoalMl, liters } from '../utils/water';

const GOAL_STEP = 100;

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const profile = useSelector((s: RootState) => s.profile);

  const recommended = recommendedGoalMl(profile.weightKg, profile.activityLevel);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Body</Text>

        <Text style={styles.fieldLabel}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={String(profile.weightKg)}
          keyboardType="numeric"
          onChangeText={(t) => {
            const n = Number(t.replace(/[^0-9.]/g, ''));
            if (t !== '' && !Number.isNaN(n) && n > 0) dispatch(setWeight(Math.min(300, n)));
          }}
          placeholder="70"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Activity level</Text>
        <View style={styles.activityRow}>
          {ACTIVITY_OPTIONS.map((opt) => {
            const active = profile.activityLevel === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.activityChip, active && styles.activityChipActive]}
                onPress={() => dispatch(setActivityLevel(opt.value as ActivityLevel))}
              >
                <Text
                  style={[
                    styles.activityText,
                    active && styles.activityTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.timesRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.fieldLabel}>Wake time</Text>
            <TimePicker
              value={profile.wakeTime}
              onChange={(t) => dispatch(setWakeTime(t))}
            />
          </View>
          <View style={styles.timeColumn}>
            <Text style={styles.fieldLabel}>Sleep time</Text>
            <TimePicker
              value={profile.sleepTime}
              onChange={(t) => dispatch(setSleepTime(t))}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Daily goal</Text>
        <Text style={styles.goalValue}>{liters(profile.dailyGoalMl)}L</Text>
        <Text style={styles.goalSub}>
          {profile.customGoal
            ? 'Custom goal'
            : `Recommended for your weight & activity (${liters(recommended)}L)`}
        </Text>

        <View style={styles.goalControls}>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              dispatch(setDailyGoal(Math.max(500, profile.dailyGoalMl - GOAL_STEP)))
            }
          >
            <Text style={styles.stepButtonText}>−</Text>
          </Pressable>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              dispatch(setDailyGoal(Math.min(6000, profile.dailyGoalMl + GOAL_STEP)))
            }
          >
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>

        {profile.customGoal && (
          <Pressable
            style={styles.recommendedButton}
            onPress={() => dispatch(applyRecommendedGoal())}
          >
            <Text style={styles.recommendedButtonText}>
              Use recommended ({liters(recommended)}L)
            </Text>
          </Pressable>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginTop: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  activityTextActive: {
    color: colors.white,
  },
  timesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  goalSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalControls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stepButton: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  stepButtonText: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '700',
  },
  recommendedButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  recommendedButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});