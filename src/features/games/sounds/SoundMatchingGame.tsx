import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { TONE_POOL_COUNT, TONE_POOL_SOURCES } from './tonePoolSources.generated';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
const PROGRESS_STEPS = 10;
const HAPTIC_BUCKETS = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomPoolIndex(): number {
  return Math.floor(Math.random() * TONE_POOL_COUNT);
}

/** Four distinct pool indices including `correct`, shuffled for display. */
function pickDisplayOrder(correct: number, muted: boolean): number[] {
  if (!muted) {
    const rest = shuffle(
      Array.from({ length: TONE_POOL_COUNT }, (_, i) => i).filter((i) => i !== correct)
    );
    return shuffle([correct, rest[0], rest[1], rest[2]]);
  }

  const correctBucket = correct % HAPTIC_BUCKETS;
  const byBucket: number[][] = Array.from({ length: HAPTIC_BUCKETS }, () => []);
  for (let i = 0; i < TONE_POOL_COUNT; i++) {
    if (i === correct) continue;
    byBucket[i % HAPTIC_BUCKETS].push(i);
  }

  const picked: number[] = [correct];
  const otherBuckets = shuffle(
    Array.from({ length: HAPTIC_BUCKETS }, (_, b) => b).filter((b) => b !== correctBucket)
  );

  for (const b of otherBuckets) {
    if (picked.length >= 4) break;
    const pool = byBucket[b];
    if (pool.length === 0) continue;
    picked.push(shuffle([...pool])[0]);
  }

  while (picked.length < 4) {
    const rest = Array.from({ length: TONE_POOL_COUNT }, (_, i) => i).filter(
      (i) => !picked.includes(i)
    );
    if (rest.length === 0) break;
    picked.push(rest[Math.floor(Math.random() * rest.length)]);
  }

  return shuffle(picked.slice(0, 4));
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

type RoundSeed = { correctPoolIdx: number; displayOrder: number[] };

function initialRound(muted: boolean): RoundSeed {
  const correctPoolIdx = randomPoolIndex();
  return {
    correctPoolIdx,
    displayOrder: pickDisplayOrder(correctPoolIdx, muted),
  };
}

export function SoundMatchingGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const muted = useAppStore((s) => s.muted);
  const level = useAppStore((s) => s.gameLevels.sounds ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Sounds · Level ${level}`);

  const roundSeedRef = useRef<RoundSeed | null>(null);
  if (roundSeedRef.current === null) {
    roundSeedRef.current = initialRound(useAppStore.getState().muted);
  }

  const soundsRef = useRef<(Audio.Sound | null)[]>([]);
  /** Dedicated instance for the target chime (same asset as one option, avoids slot/index mix-ups). */
  const targetSoundRef = useRef<Audio.Sound | null>(null);
  const [avReady, setAvReady] = useState(false);
  const [soundsReady, setSoundsReady] = useState(false);
  const [correctPoolIdx, setCorrectPoolIdx] = useState(
    () => roundSeedRef.current!.correctPoolIdx
  );
  const [displayOrder, setDisplayOrder] = useState(
    () => roundSeedRef.current!.displayOrder
  );
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const [roundKey, setRoundKey] = useState(0);

  const playHapticForPool = useCallback(async (poolIdx: number) => {
    const pulses = (poolIdx % HAPTIC_BUCKETS) + 1;
    for (let i = 0; i < pulses; i++) {
      void Haptics.selectionAsync();
      await sleep(115);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch {
        /* ignore */
      }
      if (!cancelled) setAvReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unloadRoundSounds = useCallback(async () => {
    await Promise.all(
      soundsRef.current.map((s) => s?.unloadAsync() ?? Promise.resolve())
    );
    soundsRef.current = [];
    const t = targetSoundRef.current;
    targetSoundRef.current = null;
    if (t) await t.unloadAsync().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSoundsReady(false);

    void (async () => {
      await unloadRoundSounds();
      if (cancelled) return;

      if (muted) {
        if (!cancelled) setSoundsReady(true);
        return;
      }

      if (!avReady) return;

      try {
        const loaded = await Promise.all(
          displayOrder.map((poolIdx) =>
            Audio.Sound.createAsync(TONE_POOL_SOURCES[poolIdx], {
              shouldPlay: false,
              volume: 0.82,
              isLooping: false,
            })
          )
        );
        const targetLoaded = await Audio.Sound.createAsync(
          TONE_POOL_SOURCES[correctPoolIdx],
          {
            shouldPlay: false,
            volume: 0.82,
            isLooping: false,
          }
        );
        if (cancelled) {
          await Promise.all(loaded.map((l) => l.sound.unloadAsync()));
          await targetLoaded.sound.unloadAsync().catch(() => {});
          return;
        }
        soundsRef.current = loaded.map((l) => l.sound);
        targetSoundRef.current = targetLoaded.sound;
        setSoundsReady(true);
      } catch {
        if (!cancelled) setSoundsReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roundKey, displayOrder, correctPoolIdx, muted, unloadRoundSounds, avReady]);

  const playTargetSound = useCallback(async () => {
    if (muted) {
      await playHapticForPool(correctPoolIdx);
      return;
    }
    const s = targetSoundRef.current;
    if (!s) return;
    try {
      await s.replayAsync();
    } catch {
      /* ignore */
    }
  }, [correctPoolIdx, muted, playHapticForPool]);

  const playOptionPreview = useCallback(
    async (slotIdx: number) => {
      const poolIdx = displayOrder[slotIdx];
      if (poolIdx === undefined) return;
      if (muted) {
        await playHapticForPool(poolIdx);
        return;
      }
      const s = soundsRef.current[slotIdx];
      if (!s) return;
      try {
        await s.replayAsync();
      } catch {
        /* ignore */
      }
    },
    [displayOrder, muted, playHapticForPool]
  );

  useEffect(() => {
    if (!soundsReady) return;
    const id = setTimeout(() => {
      void playTargetSound();
    }, 380);
    return () => clearTimeout(id);
  }, [soundsReady, roundKey, playTargetSound]);

  const startNewRound = useCallback(() => {
    const correct = randomPoolIndex();
    const order = pickDisplayOrder(correct, muted);
    setCorrectPoolIdx(correct);
    setDisplayOrder(order);
    setRoundKey((k) => k + 1);
  }, [muted]);

  const onPickSlot = (slotIdx: number) => {
    if (!soundsReady) return;
    const picked = displayOrder[slotIdx];
    if (picked === undefined) return;
    if (picked === correctPoolIdx) {
      void playSuccess();
      showCompliment();
      noteCorrect();
      bumpGameLevel('sounds');
      setCorrectInBatch((s) => {
        const n = s + 1;
        return n > PROGRESS_STEPS ? 0 : n;
      });
      setTimeout(startNewRound, 700);
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
        subtitle="Compare previews to the first chime"
      />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        Which option is the same sound?
      </Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>
        {muted
          ? 'Sound is off — light taps count 1–8; each option has a different count. Match the target taps to one option.'
          : 'Tap “Play target” for the chime to match. Use ▶ on each row to compare, then tap the row to choose.'}
      </Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard style={{ padding: g(16), alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play the target chime"
          disabled={!soundsReady}
          onPress={() => void playTargetSound()}
          style={({ pressed }) => [
            styles.playBtn,
            {
              paddingVertical: g(14),
              paddingHorizontal: g(24),
              borderRadius: Math.max(12, g(16)),
              opacity: soundsReady ? 1 : 0.45,
            },
            pressed && soundsReady && styles.playBtnPressed,
          ]}
        >
          <Text style={[styles.playLabel, { fontSize: fs(17) }]}>▶ Play target</Text>
        </Pressable>
        {!soundsReady ? (
          <Text style={[styles.loading, { fontSize: fs(13), marginTop: g(12) }]}>
            Loading round…
          </Text>
        ) : null}
      </SoftCard>

      <View style={[styles.choices, { gap: g(10) }]}>
        {OPTION_LETTERS.map((letter, slotIdx) => (
          <View
            key={`${roundKey}-${letter}`}
            style={[
              styles.choiceRow,
              {
                borderRadius: Math.max(10, g(14)),
                paddingVertical: g(10),
                paddingHorizontal: g(12),
                gap: g(10),
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Listen to option ${letter}`}
              disabled={!soundsReady}
              onPress={() => void playOptionPreview(slotIdx)}
              style={({ pressed }) => [
                styles.previewBtn,
                {
                  paddingVertical: g(12),
                  paddingHorizontal: g(14),
                  borderRadius: Math.max(8, g(12)),
                  opacity: soundsReady ? 1 : 0.45,
                },
                pressed && soundsReady && styles.previewBtnPressed,
              ]}
            >
              <Text style={[styles.previewBtnText, { fontSize: fs(15) }]}>▶</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose option ${letter} as the same sound`}
              disabled={!soundsReady}
              onPress={() => onPickSlot(slotIdx)}
              style={({ pressed }) => [
                styles.choiceMain,
                {
                  paddingVertical: g(12),
                  paddingHorizontal: g(14),
                  borderRadius: Math.max(8, g(12)),
                  opacity: soundsReady ? 1 : 0.45,
                },
                pressed && soundsReady && styles.choicePressed,
              ]}
            >
              <Text style={[styles.choiceText, { fontSize: fs(16) }]}>
                Option {letter} — tap here if it matches
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={[styles.hint, { fontSize: fs(13) }]}>
        {muted
          ? 'Each new level picks random chimes from a set of 50.'
          : 'Every round uses four random chimes from 50 gentle tones.'}
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
  playBtn: {
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  playBtnPressed: { opacity: 0.88 },
  playLabel: { fontWeight: '700', color: '#F8FCFB' },
  loading: { color: colors.textMuted, textAlign: 'center' },
  choices: {},
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnPressed: { opacity: 0.88 },
  previewBtnText: { color: colors.primary, fontWeight: '800' },
  choiceMain: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  choicePressed: { opacity: 0.88 },
  choiceText: { color: colors.text, fontWeight: '600', textAlign: 'left' },
  hint: { color: colors.textMuted, textAlign: 'center' },
});
