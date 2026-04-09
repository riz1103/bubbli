import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { RHYME_ROUNDS } from './speechData';

const ROUND_COUNT = RHYME_ROUNDS.length;
const PROGRESS_STEPS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function threeChoices(correct: string, d1: string, d2: string): string[] {
  return shuffle([correct, d1, d2]);
}

export function RhymePickGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const muted = useAppStore((s) => s.muted);
  const level = useAppStore((s) => s.gameLevels.rhymes ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Rhymes · Level ${level}`);

  const [roundIndex, setRoundIndex] = useState(() =>
    Math.floor(Math.random() * ROUND_COUNT)
  );
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const round = RHYME_ROUNDS[roundIndex]!;
  const labels = useMemo(() => {
    const r = RHYME_ROUNDS[roundIndex]!;
    return threeChoices(r.correct, r.distractors[0]!, r.distractors[1]!);
  }, [roundIndex]);

  const speakPrompt = useCallback(() => {
    if (muted) return;
    Speech.stop();
    Speech.speak(`Which word rhymes with ${round.prompt}?`, {
      rate: 0.9,
      pitch: 1,
    });
  }, [muted, round.prompt]);

  useEffect(() => {
    if (muted) return;
    const t = setTimeout(() => speakPrompt(), 400);
    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [roundIndex, muted, speakPrompt]);

  const advance = useCallback(() => {
    setRoundIndex((prev) => {
      if (ROUND_COUNT <= 1) return 0;
      let next = Math.floor(Math.random() * ROUND_COUNT);
      let guard = 0;
      while (next === prev && guard++ < 14) {
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
      bumpGameLevel('rhymes');
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
      <GameLevelBadge
        level={level}
        scale={scale}
        subtitle="Say the words — tap the rhyme"
      />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        Which word rhymes?
      </Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>
        {muted
          ? 'Sound is off — read the bold word, say each choice, then tap the one that rhymes.'
          : 'Tap Hear question, then say each word out loud before you choose.'}
      </Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard style={{ padding: g(16), alignItems: 'center' }}>
        <Text style={[styles.promptLabel, { fontSize: fs(14) }]}>Rhymes with</Text>
        <Text style={[styles.promptWord, { fontSize: fs(36) }]}>{round.prompt}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hear the question"
          onPress={() => speakPrompt()}
          style={({ pressed }) => [
            styles.hearBtn,
            {
              marginTop: g(12),
              paddingVertical: g(12),
              paddingHorizontal: g(20),
              borderRadius: Math.max(10, g(14)),
              opacity: muted ? 0.45 : 1,
            },
            !muted && pressed && styles.hearPressed,
          ]}
          disabled={muted}
        >
          <Text style={[styles.hearLabel, { fontSize: fs(15) }]}>▶ Hear question</Text>
        </Pressable>
      </SoftCard>

      <View style={[styles.choices, { gap: g(10) }]}>
        {labels.map((label) => (
          <Pressable
            key={`${roundIndex}-${label}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => onPick(label)}
            style={({ pressed }) => [
              styles.choice,
              {
                paddingVertical: g(16),
                paddingHorizontal: g(18),
                borderRadius: Math.max(10, g(14)),
              },
              pressed && styles.choicePressed,
            ]}
          >
            <Text style={[styles.choiceText, { fontSize: fs(18) }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.hint, { fontSize: fs(13) }]}>
        Saying words aloud helps ears and mouth work together.
      </Text>

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  heading: { color: colors.text, textAlign: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  promptLabel: { color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  promptWord: { fontWeight: '800', color: colors.primary, marginTop: 4 },
  hearBtn: { backgroundColor: colors.primary, alignItems: 'center' },
  hearPressed: { opacity: 0.88 },
  hearLabel: { fontWeight: '700', color: '#F8FCFB' },
  choices: {},
  choice: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  choicePressed: { opacity: 0.88 },
  choiceText: { color: colors.text, fontWeight: '600' },
  hint: { color: colors.textMuted, textAlign: 'center' },
});
