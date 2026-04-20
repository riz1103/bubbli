import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalmButton } from '../components/CalmButton';
import { SoftCard } from '../components/SoftCard';
import { SoftModal } from '../components/SoftModal';
import { EmotionMatchingGame } from '../features/games/emotions/EmotionMatchingGame';
import { ShapeMatchingGame } from '../features/games/matching/ShapeMatchingGame';
import { PatternCompletionGame } from '../features/games/patterns/PatternCompletionGame';
import { SoundMatchingGame } from '../features/games/sounds/SoundMatchingGame';
import { EchoWordsGame } from '../features/games/speech/EchoWordsGame';
import { ReadAloudGame } from '../features/games/speech/ReadAloudGame';
import { TagalogEchoGame } from '../features/games/speech/TagalogEchoGame';
import { TagalogReadAloudGame } from '../features/games/speech/TagalogReadAloudGame';
import { RhymePickGame } from '../features/games/speech/RhymePickGame';
import { ClockGame } from '../features/games/clock/ClockGame';
import { ColorSortingGame } from '../features/games/sorting/ColorSortingGame';
import type { GameId } from '../core/constants/games';
import { colors, spacing } from '../core/theme';
import { RootStackParamList } from '../navigation/types';
import {
  getRestReason,
  RestReason,
  useAppStore,
} from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export function GameScreen({ navigation, route }: Props) {
  const gameId = route.params.gameId;
  const addPlaytime = useAppStore((s) => s.addPlaytime);
  const rolloverDayIfNeeded = useAppStore((s) => s.rolloverDayIfNeeded);
  const setActiveGame = useAppStore((s) => s.setActiveGame);
  const wrongGuessNoticePulse = useAppStore((s) => s.wrongGuessNoticePulse);

  const [restReason, setRestReason] = useState<RestReason>(null);
  const [wrongNotice, setWrongNotice] = useState<string | null>(null);
  /** Session length for limits — kept in a ref so we never run store updates inside setState updaters */
  const sessionMsRef = useRef(0);

  const checkReason = useCallback((localSessionMs: number) => {
    const s = useAppStore.getState();
    return getRestReason(
      localSessionMs,
      s.todayUsageMs,
      s.sessionLengthMinutes * 60 * 1000,
      s.dailyLimitMinutes * 60 * 1000
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      sessionMsRef.current = 0;
      setRestReason(null);
      queueMicrotask(() => rolloverDayIfNeeded());
    }, [rolloverDayIfNeeded])
  );

  useEffect(() => {
    setActiveGame(gameId);
    return () => {
      setActiveGame(null);
    };
  }, [gameId, setActiveGame]);

  useEffect(() => {
    if (wrongGuessNoticePulse <= 0) return;
    setWrongNotice('Nice try! You can do it - take another guess.');
    const id = setTimeout(() => {
      setWrongNotice(null);
    }, 1600);
    return () => clearTimeout(id);
  }, [wrongGuessNoticePulse]);

  useEffect(() => {
    if (restReason) return undefined;
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      sessionMsRef.current += 1000;
      addPlaytime(gameId, 1000);
      const r = checkReason(sessionMsRef.current);
      if (r) setRestReason(r);
    }, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [addPlaytime, checkReason, gameId, restReason]);

  const showRest = restReason !== null;

  const restTitle =
    restReason === 'daily'
      ? 'That is enough for today'
      : 'Time to rest your eyes';
  const restMsg =
    restReason === 'daily'
      ? 'You reached the gentle daily play time a grown-up set. Come back another day!'
      : 'You had a steady play session. A short break is a kind choice.';

  const goHome = () => {
    navigation.navigate('Home');
  };

  const onBack = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View
        style={[styles.body, showRest && styles.dimmed]}
        pointerEvents={showRest ? 'none' : 'auto'}
      >
        <GameBody gameId={gameId} onBack={onBack} />
      </View>

      {wrongNotice ? (
        <View style={styles.noticeWrap} pointerEvents="none">
          <View style={styles.noticeBubble}>
            <Text style={styles.noticeText}>{wrongNotice}</Text>
          </View>
        </View>
      ) : null}

      <SoftModal
        visible={showRest}
        title={restTitle}
        message={restMsg}
        primaryLabel="Back to home"
        onPrimary={goHome}
      />
    </SafeAreaView>
  );
}

function GameBody({ gameId, onBack }: { gameId: GameId; onBack: () => void }) {
  switch (gameId) {
    case 'matching':
      return <ShapeMatchingGame onBack={onBack} />;
    case 'sorting':
      return <ColorSortingGame onBack={onBack} />;
    case 'patterns':
      return <PatternCompletionGame onBack={onBack} />;
    case 'emotions':
      return <EmotionMatchingGame onBack={onBack} />;
    case 'sounds':
      return <SoundMatchingGame onBack={onBack} />;
    case 'echo':
      return <EchoWordsGame onBack={onBack} />;
    case 'rhymes':
      return <RhymePickGame onBack={onBack} />;
    case 'reading':
      return <ReadAloudGame onBack={onBack} />;
    case 'clock':
      return <ClockGame onBack={onBack} />;
    case 'tagalogEcho':
      return <TagalogEchoGame onBack={onBack} />;
    case 'tagalogRead':
      return <TagalogReadAloudGame onBack={onBack} />;
    default: {
      const _exhaustive: never = gameId;
      return (
        <MissingGamePlaceholder id={String(_exhaustive)} onBack={onBack} />
      );
    }
  }
}

function MissingGamePlaceholder({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  return (
    <View style={missingStyles.wrap}>
      <SoftCard style={missingStyles.card}>
        <Text style={missingStyles.title}>This activity did not load</Text>
        <Text style={missingStyles.body}>
          Try fully closing the app and opening it again. If you are developing, stop Expo and run
          with a clear cache: npx expo start -c
        </Text>
        <Text style={missingStyles.hint}>({id})</Text>
        <CalmButton label="Back to games" variant="secondary" onPress={onBack} />
      </SoftCard>
    </View>
  );
}

const missingStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'center',
  },
  card: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  hint: { fontSize: 12, color: colors.textMuted },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, minHeight: 0, padding: spacing.lg },
  dimmed: { opacity: 0.35 },
  noticeWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xxl,
    alignItems: 'center',
    zIndex: 90,
    elevation: 10,
  },
  noticeBubble: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '96%',
  },
  noticeText: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});
