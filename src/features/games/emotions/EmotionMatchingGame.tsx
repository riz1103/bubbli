import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { colors } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';
import {
  EMOTION_ROUND_DEFS,
  EMOTION_WORD_POOL,
} from './emotionRoundsData';

const ROUND_COUNT = EMOTION_ROUND_DEFS.length;
const PROGRESS_STEPS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function threeChoices(correct: string): string[] {
  const others = EMOTION_WORD_POOL.filter((w) => w !== correct);
  const pair = shuffle([...others]).slice(0, 2);
  return shuffle([correct, pair[0]!, pair[1]!]);
}

export function EmotionMatchingGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const level = useAppStore((s) => s.gameLevels.emotions ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Feelings · Level ${level}`);

  const [roundIndex, setRoundIndex] = useState(() =>
    Math.floor(Math.random() * ROUND_COUNT)
  );
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const round = EMOTION_ROUND_DEFS[roundIndex]!;
  const labels = useMemo(
    () => threeChoices(round.correct),
    [roundIndex, round.correct]
  );

  const advance = useCallback(() => {
    setRoundIndex((prev) => {
      if (ROUND_COUNT <= 1) return 0;
      let next = Math.floor(Math.random() * ROUND_COUNT);
      let guard = 0;
      while (next === prev && guard++ < 12) {
        next = Math.floor(Math.random() * ROUND_COUNT);
      }
      return next;
    });
  }, []);

  const onPick = (label: string) => {
    if (label === round.correct) {
      void playSuccess();
      showCompliment();
      noteCorrect();
      bumpGameLevel('emotions');
      setCorrectInBatch((s) => {
        const n = s + 1;
        return n > PROGRESS_STEPS ? 0 : n;
      });
      setTimeout(advance, 700);
    } else {
      void playSoft();
      noteWrong();
    }
  };

  return (
    <View style={[styles.root, { gap: g(16) }]}>
      <GameLevelBadge level={level} scale={scale} subtitle="Each match raises your level" />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>Match the feeling word</Text>
      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />
      <SoftCard style={{ alignItems: 'center', paddingVertical: g(32), paddingHorizontal: g(16) }}>
        <Text
          style={{ fontSize: fs(80), textAlign: 'center' }}
          accessibilityLabel="Feeling face"
        >
          {round.face}
        </Text>
      </SoftCard>

      <View style={[styles.choices, { gap: g(12) }]}>
        {labels.map((label) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => onPick(label)}
            style={({ pressed }) => [
              styles.wordBtn,
              {
                paddingVertical: g(16),
                paddingHorizontal: g(24),
                borderRadius: Math.max(10, g(14)),
              },
              pressed && styles.wordBtnPressed,
            ]}
          >
            <Text style={[styles.wordText, { fontSize: fs(18) }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.hint, { fontSize: fs(14), marginTop: g(12) }]}>
        Tap the word that fits best. Any guess is okay to try again.
      </Text>

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  heading: { color: colors.text, textAlign: 'center' },
  choices: {},
  wordBtn: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wordBtnPressed: { opacity: 0.88 },
  wordText: { color: colors.text, textAlign: 'center', fontWeight: '600' },
  hint: { color: colors.textMuted, textAlign: 'center' },
});
