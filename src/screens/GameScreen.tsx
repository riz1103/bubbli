import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { ColorSortingGame } from '../features/games/sorting/ColorSortingGame';
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

  const [restReason, setRestReason] = useState<RestReason>(null);
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
        {gameId === 'matching' ? (
          <ShapeMatchingGame onBack={onBack} />
        ) : null}
        {gameId === 'sorting' ? (
          <ColorSortingGame onBack={onBack} />
        ) : null}
        {gameId === 'patterns' ? (
          <PatternCompletionGame onBack={onBack} />
        ) : null}
        {gameId === 'emotions' ? (
          <EmotionMatchingGame onBack={onBack} />
        ) : null}
        {gameId === 'sounds' ? <SoundMatchingGame onBack={onBack} /> : null}
        {gameId === 'echo' ? <EchoWordsGame onBack={onBack} /> : null}
        {gameId === 'rhymes' ? <RhymePickGame onBack={onBack} /> : null}
        {gameId === 'reading' ? <ReadAloudGame onBack={onBack} /> : null}
        {gameId === 'tagalogEcho' ? <TagalogEchoGame onBack={onBack} /> : null}
        {gameId === 'tagalogRead' ? <TagalogReadAloudGame onBack={onBack} /> : null}
      </View>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  dimmed: { opacity: 0.35 },
});
