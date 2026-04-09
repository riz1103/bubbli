import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalmButton } from '../components/CalmButton';
import { GameCard } from '../components/GameCard';
import { SoftCard } from '../components/SoftCard';
import { GAMES, GameId } from '../core/constants/games';
import { colors, spacing } from '../core/theme';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const dailyLimitMinutes = useAppStore((s) => s.dailyLimitMinutes);
  const todayUsageMs = useAppStore((s) => s.todayUsageMs);
  const muted = useAppStore((s) => s.muted);
  const rolloverDayIfNeeded = useAppStore((s) => s.rolloverDayIfNeeded);

  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => rolloverDayIfNeeded());
    }, [rolloverDayIfNeeded])
  );
  const dailyLimitMs = dailyLimitMinutes * 60 * 1000;
  const dailyReached = todayUsageMs >= dailyLimitMs;

  const openGame = (id: GameId) => {
    if (dailyReached) return;
    navigation.navigate('Game', { gameId: id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image
            accessibilityLabel="Bubbli — gentle learning games"
            source={require('../../assets/bubbli-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {dailyReached ? (
          <SoftCard style={styles.notice}>
            <Text style={styles.noticeTitle}>Play time is paused for today</Text>
            <Text style={styles.noticeBody}>
              This helps keep eyes and minds rested. A grown-up can change the daily limit in
              settings.
            </Text>
          </SoftCard>
        ) : null}

        <View style={styles.list}>
          {GAMES.map((g) => (
            <GameCard
              key={g.id}
              title={g.title}
              subtitle={g.subtitle}
              emoji={g.emoji}
              disabled={!g.available || dailyReached}
              onPress={() => (g.available ? openGame(g.id) : undefined)}
            />
          ))}
        </View>

        <CalmButton
          label="Grown-up settings"
          variant="ghost"
          onPress={() => navigation.navigate('Parent')}
          style={styles.parentBtn}
        />
        {muted ? (
          <Text style={styles.mutedNote}>Sound feedback is off.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    maxHeight: 200,
    width: '100%',
  },
  logo: {
    width: '100%',
    height: 180,
    maxWidth: 420,
  },
  list: { gap: spacing.sm },
  notice: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.border,
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noticeBody: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  parentBtn: { marginTop: spacing.lg, alignSelf: 'center' },
  mutedNote: { textAlign: 'center', fontSize: 13, color: colors.textMuted },
});
