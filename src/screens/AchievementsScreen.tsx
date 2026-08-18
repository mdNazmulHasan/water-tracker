import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { RootState } from '../store';
import {
  ACHIEVEMENTS,
  AchievementDef,
  bestStreakDays,
} from '../store/slices/achievements';
import { colors, spacing, typography } from '../theme';
import Card from '../components/Card';
import { FlameIcon, TrophyIcon, CheckIcon } from '../components/icons';
import { streakDays, goalMet } from '../utils/water';
import { lastNDayKeys } from '../utils/date';

export default function AchievementsScreen() {
  const entries = useSelector((s: RootState) => s.hydration.entries);
  const unlocked = useSelector((s: RootState) => s.achievements.unlocked);
  const goal = useSelector((s: RootState) => s.profile.dailyGoalMl);

  const byDay = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      const k = dayjs(e.timestamp).format('YYYY-MM-DD');
      if (!map[k]) map[k] = [];
      map[k].push(e);
    }
    return map;
  }, [entries]);

  const currentStreak = streakDays(byDay, goal);
  const best = bestStreakDays(byDay, goal);

  const weekMet = useMemo(() => {
    const keys = lastNDayKeys(7, 1);
    return keys.filter((k) => goalMet(byDay[k] ?? [], goal)).length;
  }, [byDay, goal]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.streakRow}>
        <Card style={[styles.streakCard, styles.streakMain] as ViewStyle[]}>
          <View style={styles.streakHeader}>
            <FlameIcon size={28} />
            <Text style={styles.streakValue}>{currentStreak}</Text>
          </View>
          <Text style={styles.streakLabel}>Day streak</Text>
        </Card>
        <Card style={[styles.streakCard, styles.streakSub] as ViewStyle[]}>
          <View style={styles.streakHeader}>
            <TrophyIcon size={26} color={colors.primary} />
            <Text style={styles.subValue}>{best}</Text>
          </View>
          <Text style={styles.streakLabel}>Best streak</Text>
        </Card>
        <Card style={[styles.streakCard, styles.streakSub] as ViewStyle[]}>
          <View style={styles.streakHeader}>
            <Text style={styles.subValue}>{weekMet}</Text>
          </View>
          <Text style={styles.streakLabel}>/7 goal days</Text>
        </Card>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
        </Text>
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} def={a} locked={!unlocked.includes(a.id)} />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function AchievementBadge({ def, locked }: { def: AchievementDef; locked: boolean }) {
  return (
    <View style={[styles.badge, locked && styles.badgeLocked]}>
      <View
        style={[styles.badgeIcon, { backgroundColor: locked ? colors.surfaceAlt : def.color }]}
      >
        {locked ? (
          <Text style={styles.badgeLockedMark}>?</Text>
        ) : (
          <CheckIcon size={22} color={colors.white} />
        )}
      </View>
      <Text style={[styles.badgeTitle, locked && styles.badgeTitleLocked]}>
        {def.title}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>
        {def.description}
      </Text>
    </View>
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
  streakRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
  },
  streakMain: {
    backgroundColor: colors.primary,
  },
  streakSub: {
    backgroundColor: colors.surface,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  subValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  streakLabel: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  card: {
    marginTop: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    width: '30.5%',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  badgeLocked: {
    opacity: 0.75,
  },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLockedMark: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMuted,
  },
  badgeTitle: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  badgeTitleLocked: {
    color: colors.textSecondary,
  },
  badgeDesc: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});