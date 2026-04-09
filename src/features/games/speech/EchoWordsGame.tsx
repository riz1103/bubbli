import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { canUseNativeSpeechRecognition, listenOnceEn } from '../../../core/speech/listenOnceEn';
import { wordMatchesHeard } from '../../../core/speech/matchSpokenText';
import { colors } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';
import { useShuffledBag } from '../../../hooks/useShuffledBag';
import { ECHO_WORD_POOL } from './speechData';

const PROGRESS_STEPS = 10;

export function EchoWordsGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const muted = useAppStore((s) => s.muted);
  const level = useAppStore((s) => s.gameLevels.echo ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Listen & speak · Level ${level}`);

  const { initial, next } = useShuffledBag(ECHO_WORD_POOL, []);
  const [word, setWord] = useState(() => initial());
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const sttOk = canUseNativeSpeechRecognition();

  const speakWord = useCallback(
    (w: string) => {
      if (muted) return;
      Speech.stop();
      Speech.speak(w, {
        rate: 0.92,
        pitch: 1.0,
      });
    },
    [muted]
  );

  useEffect(() => {
    if (muted) return;
    const t = setTimeout(() => speakWord(word), 320);
    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [word, muted, speakWord]);

  const advanceAfterSuccess = useCallback(() => {
    void playSuccess();
    showCompliment();
    noteCorrect();
    bumpGameLevel('echo');
    setCorrectInBatch((s) => {
      const n = s + 1;
      return n > PROGRESS_STEPS ? 0 : n;
    });
    setWord(() => next());
    setHint(null);
  }, [bumpGameLevel, noteCorrect, playSuccess, showCompliment]);

  const onHeardIt = useCallback(() => {
    advanceAfterSuccess();
  }, [advanceAfterSuccess]);

  const onMicCheck = async () => {
    if (!sttOk || listening) return;
    setHint(null);
    setListening(true);
    try {
      const result = await listenOnceEn({
        contextualStrings: [word],
        preferOnDeviceRecognition: false,
        strictOfflineOnly: false,
        maxMs: 12000,
      });
      if (!result.ok) {
        if (result.reason === 'permission') {
          setHint('Microphone permission is needed to check your word.');
        } else if (result.reason === 'timeout') {
          setHint(
            'We did not catch that — speak a bit louder, or try a quieter room.'
          );
        } else if (result.reason === 'unavailable-module') {
          setHint(result.detail ?? 'Speech module unavailable.');
        } else {
          setHint(
            result.detail
              ? `Try again: ${result.detail}`
              : 'Try again — or tap We practiced this word!'
          );
        }
        return;
      }
      if (wordMatchesHeard(result.transcript, word)) {
        advanceAfterSuccess();
      } else {
        void playSoft();
        noteWrong();
        setHint(`Heard “${result.transcript.trim()}” — try once more.`);
      }
    } finally {
      setListening(false);
    }
  };

  return (
    <View style={[styles.root, { gap: g(16) }]}>
      <GameLevelBadge
        level={level}
        scale={scale}
        subtitle="Hear the word, then say it out loud"
      />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        Listen and say the word together
      </Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>
        {muted
          ? 'Sound is off — read the big word aloud. You can still use the mic check.'
          : 'Tap Play, say the word, then tap the microphone. Bubbli prefers on-device listening when your phone supports it.'}
      </Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard style={{ padding: g(20), alignItems: 'center' }}>
        <Text
          style={[styles.wordDisplay, { fontSize: fs(Math.min(40, 28 + (word.length > 10 ? 0 : 8))) }]}
        >
          {word}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play the word"
          onPress={() => speakWord(word)}
          style={({ pressed }) => [
            styles.playBtn,
            {
              marginTop: g(18),
              paddingVertical: g(14),
              paddingHorizontal: g(22),
              borderRadius: Math.max(12, g(16)),
              opacity: muted ? 0.45 : 1,
            },
            !muted && pressed && styles.playPressed,
          ]}
          disabled={muted}
        >
          <Text style={[styles.playLabel, { fontSize: fs(16) }]}>▶ Play word</Text>
        </Pressable>
      </SoftCard>

      {sttOk ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check pronunciation"
          disabled={listening}
          onPress={() => void onMicCheck()}
          style={({ pressed }) => [
            styles.micBtn,
            {
              paddingVertical: g(16),
              borderRadius: Math.max(12, g(16)),
              opacity: listening ? 0.65 : 1,
            },
            pressed && !listening && styles.micPressed,
          ]}
        >
          {listening ? (
            <View style={styles.micRow}>
              <ActivityIndicator color={colors.text} />
              <Text style={[styles.micLabel, { fontSize: fs(16), marginLeft: 10 }]}>
                Listening…
              </Text>
            </View>
          ) : (
            <Text style={[styles.micLabel, { fontSize: fs(17) }]}>🎤 Check my word</Text>
          )}
        </Pressable>
      ) : null}

      {hint ? (
        <Text style={[styles.hint, { fontSize: fs(14) }]}>{hint}</Text>
      ) : null}

      <CalmButton label="We practiced this word!" onPress={onHeardIt} />

      <Text style={[styles.footer, { fontSize: fs(12) }]}>
        The mic compares what it heard to the word on screen. It is okay to use the green button
        instead any time.
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
  wordDisplay: {
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  playBtn: {
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  playPressed: { opacity: 0.88 },
  playLabel: { fontWeight: '700', color: '#F8FCFB' },
  micBtn: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  micPressed: { opacity: 0.88 },
  micRow: { flexDirection: 'row', alignItems: 'center' },
  micLabel: { fontWeight: '700', color: colors.text },
  hint: { color: colors.text, textAlign: 'center' },
  footer: { color: colors.textMuted, textAlign: 'center' },
});
