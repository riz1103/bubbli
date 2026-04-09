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

const PALETTE = ['#B8D4E8', '#E8B8C0', '#D8E4B0', '#D0C8E8'] as const;

type Pidx = 0 | 1 | 2 | 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickTwoDistinct(): [Pidx, Pidx] {
  const s = shuffle([0, 1, 2, 3] as Pidx[]);
  return [s[0], s[1]];
}

function pickThreeDistinct(): [Pidx, Pidx, Pidx] {
  const s = shuffle([0, 1, 2, 3] as Pidx[]);
  return [s[0], s[1], s[2]];
}

function pickFourPermutation(): [Pidx, Pidx, Pidx, Pidx] {
  const s = shuffle([0, 1, 2, 3] as Pidx[]);
  return [s[0], s[1], s[2], s[3]];
}

type PatternSpec =
  | { kind: 'alt2'; base: [Pidx, Pidx] }
  | { kind: 'alt3'; base: [Pidx, Pidx, Pidx] }
  /** A A B B A A B B … */
  | { kind: 'aabb'; base: [Pidx, Pidx] }
  /** All four colors in a fixed order, then repeat */
  | { kind: 'cycle4'; order: [Pidx, Pidx, Pidx, Pidx] };

/**
 * Higher game levels unlock harder pattern families. Level 1 is only simple A-B-A-B.
 */
function pickPatternSpec(gameLevel: number): PatternSpec {
  const r = Math.random();
  if (gameLevel <= 8) {
    return { kind: 'alt2', base: pickTwoDistinct() };
  }
  if (gameLevel <= 22) {
    return r < 0.52
      ? { kind: 'alt2', base: pickTwoDistinct() }
      : { kind: 'alt3', base: pickThreeDistinct() };
  }
  if (gameLevel <= 45) {
    if (r < 0.3) return { kind: 'alt2', base: pickTwoDistinct() };
    if (r < 0.65) return { kind: 'alt3', base: pickThreeDistinct() };
    return { kind: 'aabb', base: pickTwoDistinct() };
  }
  if (r < 0.2) return { kind: 'cycle4', order: pickFourPermutation() };
  if (r < 0.45) return { kind: 'aabb', base: pickTwoDistinct() };
  if (r < 0.78) return { kind: 'alt3', base: pickThreeDistinct() };
  return { kind: 'alt2', base: pickTwoDistinct() };
}

function beadAt(spec: PatternSpec, i: number): Pidx {
  switch (spec.kind) {
    case 'alt2':
      return spec.base[i % 2];
    case 'alt3':
      return spec.base[i % 3];
    case 'aabb':
      return spec.base[i % 4 < 2 ? 0 : 1];
    case 'cycle4':
      return spec.order[i % 4];
  }
}

function patternPeriod(spec: PatternSpec): number {
  switch (spec.kind) {
    case 'alt2':
      return 2;
    case 'alt3':
      return 3;
    case 'aabb':
    case 'cycle4':
      return 4;
  }
}

/** Deducible repeating rule; pattern family and row length both scale with level. */
function buildSequence(
  adaptiveTier: number,
  gameLevel: number
): { shown: Pidx[]; answer: Pidx } {
  const spec = pickPatternSpec(gameLevel);
  const period = patternPeriod(spec);
  const minShown = Math.max(period * 2, 4);
  const tierPart = Math.min(Math.max(adaptiveTier, 1), 4);
  const levelPart = Math.min(5, Math.floor((gameLevel - 1) / 7));
  let extra = tierPart + levelPart;
  if (gameLevel <= 4) extra = Math.min(extra, 0);
  else if (gameLevel <= 10) extra = Math.min(extra, 1);
  else if (gameLevel <= 20) extra = Math.min(extra, 2);
  else if (gameLevel <= 35) extra = Math.min(extra, 4);
  else extra = Math.min(extra, 6);
  let shownCount = Math.min(minShown + extra, 12);
  const slack = 12 - shownCount;
  if (slack > 0) {
    shownCount += Math.floor(Math.random() * Math.min(4, slack + 1));
  }

  const total = shownCount + 1;
  const seq: Pidx[] = [];
  for (let i = 0; i < total; i++) {
    seq.push(beadAt(spec, i));
  }

  return {
    shown: seq.slice(0, -1),
    answer: seq[seq.length - 1]!,
  };
}

/** How many correct answers fill the progress row before it starts again */
const PROGRESS_STEPS = 10;

function Dot({ idx, size, borderR }: { idx: Pidx; size: number; borderR: number }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: borderR,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: PALETTE[idx],
        },
      ]}
      accessibilityLabel="pattern bead"
    />
  );
}

export function PatternCompletionGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { tier, noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const level = useAppStore((s) => s.gameLevels.patterns ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Patterns · Level ${level}`);

  const [{ shown, answer }, setPuzzle] = useState(() =>
    buildSequence(1, useAppStore.getState().gameLevels.patterns ?? 1)
  );
  const [round, setRound] = useState(0);
  const [correctInBatch, setCorrectInBatch] = useState(0);

  const choices = useMemo(() => shuffle([0, 1, 2, 3] as Pidx[]), [shown, answer, round]);

  const nextPuzzle = useCallback(() => {
    const lv = useAppStore.getState().gameLevels.patterns ?? 1;
    setPuzzle(buildSequence(tier, lv));
    setRound((r) => r + 1);
  }, [tier]);

  const onPick = (idx: Pidx) => {
    if (idx === answer) {
      void playSuccess();
      showCompliment();
      noteCorrect();
      bumpGameLevel('patterns');
      setCorrectInBatch((s) => {
        const n = s + 1;
        return n > PROGRESS_STEPS ? 0 : n;
      });
      setTimeout(nextPuzzle, 600);
    } else {
      noteWrong();
    }
  };

  const bead = Math.max(28, g(40));
  const beadR = bead / 2;
  const choice = Math.max(40, g(56));
  const choiceR = choice / 2;

  const patternSubtitle =
    level <= 8
      ? 'Level 1–8: only two colors taking turns'
      : level <= 22
        ? 'Levels 9–22: three-color loops can appear'
        : level <= 45
          ? 'Levels 23–45: pairs (A A B B) too'
          : 'Higher levels: four-color cycles — still calm, no timer';

  const patternHint =
    level <= 8
      ? 'Two colors go back and forth (A B A B…). Which color comes next?'
      : level <= 22
        ? 'The rule might use two colors or three in a repeating loop. What fits next?'
        : 'The rule can be two colors, three, pairs, or four in a loop. What fits next?';

  return (
    <View style={[styles.root, { gap: g(16) }]}>
      <GameLevelBadge level={level} scale={scale} subtitle={patternSubtitle} />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>What comes next?</Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>{patternHint}</Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard style={{ ...styles.patternCard, padding: g(16) }}>
        <View style={[styles.row, { gap: g(12) }]}>
          {shown.map((i, k) => (
            <Dot key={`${k}-${round}`} idx={i} size={bead} borderR={beadR} />
          ))}
          <View
            style={[
              styles.q,
              {
                width: bead,
                height: bead,
                borderRadius: beadR,
                borderWidth: Math.max(1, g(2)),
              },
            ]}
          >
            <Text style={[styles.qText, { fontSize: fs(18) }]}>?</Text>
          </View>
        </View>
      </SoftCard>

      <Text style={[styles.pickLabel, { fontSize: fs(15), marginTop: g(12) }]}>
        Tap your guess
      </Text>
      <View style={[styles.choices, { gap: g(16) }]}>
        {choices.map((idx) => (
          <Pressable
            key={idx}
            accessibilityRole="button"
            onPress={() => onPick(idx)}
            style={({ pressed }) => [
              styles.choice,
              {
                width: choice,
                height: choice,
                borderRadius: choiceR,
                backgroundColor: PALETTE[idx],
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.choicePressed,
            ]}
          />
        ))}
      </View>

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  heading: { color: colors.text, textAlign: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  patternCard: { alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  q: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: colors.outline,
    backgroundColor: colors.surfaceMuted,
  },
  qText: { fontWeight: '700', color: colors.textMuted },
  pickLabel: { textAlign: 'center', color: colors.text },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  choice: {},
  choicePressed: { opacity: 0.85 },
});
