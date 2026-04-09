import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { colors, spacing } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';
import { ClockFace } from './ClockFace';
import { ClockFaceInteractive } from './ClockFaceInteractive';

const PROGRESS_STEPS = 10;

export type ClockTime = { h: number; m: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Minutes shown on the clock for this level band */
function allowedMinutes(level: number): number[] {
  if (level <= 25) return [0];
  if (level <= 60) return [0, 30];
  return [0, 15, 30, 45];
}

function formatDigital(t: ClockTime): string {
  return `${t.h}:${String(t.m).padStart(2, '0')}`;
}

/** All valid times for this level (for multiple-choice pool) */
function timePool(level: number): ClockTime[] {
  const mins = allowedMinutes(level);
  const out: ClockTime[] = [];
  for (let h = 1; h <= 12; h++) {
    for (const m of mins) {
      out.push({ h, m });
    }
  }
  return out;
}

function randomTime(level: number, avoid?: ClockTime): ClockTime {
  const pool = timePool(level);
  const filtered =
    avoid && pool.length > 1
      ? pool.filter((t) => t.h !== avoid.h || t.m !== avoid.m)
      : pool;
  return filtered[Math.floor(Math.random() * filtered.length)]!;
}

function fourReadChoices(target: ClockTime, level: number): ClockTime[] {
  const wrong = shuffle(
    timePool(level).filter((t) => t.h !== target.h || t.m !== target.m)
  );
  return shuffle([target, ...wrong.slice(0, 3)]);
}

function initialWrongGuess(target: ClockTime, level: number): ClockTime {
  const pool = timePool(level).filter((t) => t.h !== target.h || t.m !== target.m);
  return pool[Math.floor(Math.random() * pool.length)] ?? { h: 1, m: 0 };
}

type RoundMode = 'read' | 'set';

export function ClockGame({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { scale, g, fs } = useResponsiveGameScale();
  const { tier, noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const level = useAppStore((s) => s.gameLevels.clock ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Clock fun · Level ${level}`);

  const [mode, setMode] = useState<RoundMode>(() =>
    Math.random() < 0.5 ? 'read' : 'set'
  );
  const [target, setTarget] = useState<ClockTime>(() => randomTime(level));
  const readChoices = useMemo(
    () => fourReadChoices(target, level),
    [target, level]
  );
  const [guess, setGuess] = useState<ClockTime>(() => initialWrongGuess(target, level));
  const [roundKey, setRoundKey] = useState(0);
  const [correctInBatch, setCorrectInBatch] = useState(0);

  const clockSize = Math.max(160, Math.min(280, g(280)));

  const levelHint =
    level <= 25
      ? 'Level 1–25: whole hours only (the long hand on 12)'
      : level <= 60
        ? 'Levels 26–60: half hours too (:00 and :30)'
        : 'Higher levels: quarter hours — still calm, no timer';

  const nextRound = useCallback(() => {
    const lv = useAppStore.getState().gameLevels.clock ?? 1;
    const nextMode: RoundMode =
      tier >= 2 && Math.random() < 0.55
        ? 'set'
        : Math.random() < 0.5
          ? 'read'
          : 'set';
    const t = randomTime(lv);
    setMode(nextMode);
    setTarget(t);
    setGuess(initialWrongGuess(t, lv));
    setRoundKey((k) => k + 1);
  }, [tier]);

  const onReadPick = (picked: ClockTime) => {
    if (picked.h === target.h && picked.m === target.m) {
      void playSuccess();
      showCompliment();
      noteCorrect();
      bumpGameLevel('clock');
      setCorrectInBatch((s) => {
        const n = s + 1;
        return n > PROGRESS_STEPS ? 0 : n;
      });
      setTimeout(nextRound, 650);
    } else {
      void playSoft();
      noteWrong();
    }
  };

  const onSetCheck = () => {
    if (guess.h === target.h && guess.m === target.m) {
      void playSuccess();
      showCompliment();
      noteCorrect();
      bumpGameLevel('clock');
      setCorrectInBatch((s) => {
        const n = s + 1;
        return n > PROGRESS_STEPS ? 0 : n;
      });
      setTimeout(nextRound, 650);
    } else {
      void playSoft();
      noteWrong();
    }
  };

  const mins = allowedMinutes(level);

  /** Extra space below last controls so taps clear gesture / 3-button nav (avoid flexGrow — blank layout bug). */
  const bottomPad = insets.bottom + spacing.xxl + spacing.sm;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { gap: g(16), paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <GameLevelBadge level={level} scale={scale} subtitle={levelHint} />

      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        {mode === 'read' ? 'What time is it?' : 'Your turn — set the clock'}
      </Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>
        {mode === 'read'
          ? 'Read the hands, then tap the matching time.'
          : `Make the clock show ${formatDigital(target)}. Drag the short hand for the hour and the long hand for minutes.`}
      </Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard style={{ padding: g(16), alignItems: 'center' }}>
        {mode === 'read' ? (
          <ClockFace hour={target.h} minute={target.m} size={clockSize} />
        ) : (
          <>
            <Text style={[styles.goalPill, { fontSize: fs(15), marginBottom: g(10) }]}>
              Goal: {formatDigital(target)}
            </Text>
            <ClockFaceInteractive
              hour={guess.h}
              minute={guess.m}
              size={clockSize}
              allowedMinutes={mins}
              onTimeChange={(next) => setGuess(next)}
            />
          </>
        )}
      </SoftCard>

      {mode === 'read' ? (
        <View style={[styles.choiceGrid, { gap: g(10) }]}>
          {readChoices.map((t, i) => (
            <Pressable
              key={`${roundKey}-${i}-${t.h}-${t.m}`}
              accessibilityRole="button"
              accessibilityLabel={`${formatDigital(t)}`}
              onPress={() => onReadPick(t)}
              style={({ pressed }) => [
                styles.choiceBtn,
                { paddingVertical: g(14), borderRadius: g(14) },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.choiceText, { fontSize: fs(20) }]}>
                {formatDigital(t)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <CalmButton label="That matches!" onPress={onSetCheck} />
      )}

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />
      <CalmCompliment message={compliment} scale={scale} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  content: {
    width: '100%',
    alignItems: 'stretch',
    position: 'relative',
  },
  heading: { color: colors.text, textAlign: 'center', fontWeight: '600' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  goalPill: {
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  choiceGrid: { width: '100%' },
  choiceBtn: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceText: { fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.88 },
});
