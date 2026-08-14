import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  ACTIVITY_OPTIONS,
  GENDER_OPTIONS,
  setGender,
  setWeight,
  setActivityLevel,
  setWakeTime,
  setSleepTime,
  setDailyGoal,
  completeOnboarding,
} from '../store/slices/profile';
import { colors, radius, spacing, typography } from '../theme';
import TimePicker from '../components/TimePicker';
import { recommendedGoalMl, liters } from '../utils/water';

const TOTAL_STEPS = 4;
const GOAL_STEP_ML = 100;
const MIN_GOAL_ML = 500;
const MAX_GOAL_ML = 6000;
const MAX_WEIGHT_KG = 300;

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.profile);

  const [step, setStep] = useState(1);
  const [weightInput, setWeightInput] = useState(String(profile.weightKg));

  const handleWeightChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    setWeightInput(cleaned);

    const parsed = parseFloat(cleaned);
    if (!Number.isNaN(parsed) && parsed > 0) {
      dispatch(setWeight(Math.min(MAX_WEIGHT_KG, parsed)));
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      dispatch(completeOnboarding());
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const recommended = recommendedGoalMl(
    profile.weightKg,
    profile.activityLevel,
    profile.gender
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress Indicator */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to Water Tracker</Text>
        <Text style={styles.headerSubtitle}>
          Let's calculate your daily hydration target
        </Text>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum <= step;
            return (
              <View
                key={stepNum}
                style={[
                  styles.progressBar,
                  isActive && styles.progressBarActive,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Main Form Body */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>What is your gender?</Text>
            <Text style={styles.stepDescription}>
              Gender helps us determine your baseline metabolic hydration requirements.
            </Text>

            <View style={styles.optionsStack}>
              {GENDER_OPTIONS.map((opt) => {
                const active = profile.gender === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.bigChip, active && styles.bigChipActive]}
                    onPress={() => dispatch(setGender(opt.value))}
                  >
                    <Text
                      style={[
                        styles.bigChipText,
                        active && styles.bigChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Body & Activity</Text>
            <Text style={styles.stepDescription}>
              Enter your weight and typical daily physical activity level.
            </Text>

            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              keyboardType="decimal-pad"
              onChangeText={handleWeightChange}
              placeholder="70"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
              Activity level
            </Text>
            <View style={styles.chipGrid}>
              {ACTIVITY_OPTIONS.map((opt) => {
                const active = profile.activityLevel === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.smallChip, active && styles.smallChipActive]}
                    onPress={() => dispatch(setActivityLevel(opt.value))}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        active && styles.smallChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Daily Schedule</Text>
            <Text style={styles.stepDescription}>
              When do you usually wake up and go to sleep? We use this to schedule friendly reminders.
            </Text>

            <View style={styles.timesRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.fieldLabel}>Wake Up Time</Text>
                <TimePicker
                  value={profile.wakeTime}
                  onChange={(t) => dispatch(setWakeTime(t))}
                />
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.fieldLabel}>Bedtime</Text>
                <TimePicker
                  value={profile.sleepTime}
                  onChange={(t) => dispatch(setSleepTime(t))}
                />
              </View>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Your Hydration Target</Text>
            <Text style={styles.stepDescription}>
              Based on your profile, here is your calculated daily water goal.
            </Text>

            <View style={styles.goalBanner}>
              <Text style={styles.goalValue}>{liters(profile.dailyGoalMl)}L</Text>
              <Text style={styles.goalSub}>
                {profile.customGoal
                  ? 'Customized Target'
                  : `Recommended (${liters(recommended)}L/day)`}
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
              Adjust Goal (Optional)
            </Text>
            <View style={styles.goalControls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease goal"
                style={styles.stepButton}
                onPress={() =>
                  dispatch(
                    setDailyGoal(
                      Math.max(MIN_GOAL_ML, profile.dailyGoalMl - GOAL_STEP_ML)
                    )
                  )
                }
              >
                <Text style={styles.stepButtonText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase goal"
                style={styles.stepButton}
                onPress={() =>
                  dispatch(
                    setDailyGoal(
                      Math.min(MAX_GOAL_ML, profile.dailyGoalMl + GOAL_STEP_ML)
                    )
                  )
                }
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons Footer */}
      <View style={styles.footer}>
        {step > 1 ? (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {step === TOTAL_STEPS ? 'Get Started' : 'Next Step'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 24,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  progressBarActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  optionsStack: {
    gap: spacing.md,
  },
  bigChip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  bigChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  bigChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bigChipTextActive: {
    color: colors.primaryDark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  smallChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  smallChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  smallChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  smallChipTextActive: {
    color: colors.white,
  },
  timesRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-around',
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  goalBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  goalValue: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  goalSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  goalControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepButtonText: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
