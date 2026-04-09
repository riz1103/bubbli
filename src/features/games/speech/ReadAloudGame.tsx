import * as Speech from 'expo-speech';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { canUseNativeSpeechRecognition, listenOnceEn } from '../../../core/speech/listenOnceEn';
import { sentenceMatchesHeard } from '../../../core/speech/matchSpokenText';
import { colors } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';
import { useShuffledBag } from '../../../hooks/useShuffledBag';
import { maxTierForLevel, readSentencesForLevel } from './sentenceReadData';

const PROGRESS_STEPS = 8;

export function ReadAloudGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const muted = useAppStore((s) => s.muted);
  const level = useAppStore((s) => s.gameLevels.reading ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Read aloud · Level ${level}`);

  const maxTier = maxTierForLevel(level);
  const sentencePool = useMemo(() => readSentencesForLevel(level), [level]);
  const { initial, next } = useShuffledBag(sentencePool, [maxTier]);
  const [sentence, setSentence] = useState(() => initial());
  const prevReadTier = useRef(maxTier);
  useLayoutEffect(() => {
    if (prevReadTier.current !== maxTier) {
      prevReadTier.current = maxTier;
      setSentence(initial());
    }
  }, [maxTier, initial]);
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const sttOk = canUseNativeSpeechRecognition();

  const speakSentence = useCallback(
    (t: string) => {
      if (muted) return;
      Speech.stop();
      Speech.speak(t, { rate: 0.9, pitch: 1 });
    },
    [muted]
  );

  useEffect(() => {
    if (muted) return;
    const id = setTimeout(() => speakSentence(sentence), 400);
    return () => {
      clearTimeout(id);
      Speech.stop();
    };
  }, [sentence, muted, speakSentence]);

  const advance = useCallback(() => {
    setSentence(() => next());
    setHint(null);
  }, [next]);

  const onMicCheck = async () => {
    if (!sttOk || listening) return;
    setHint(null);
    setListening(true);
    try {
      const result = await listenOnceEn({
        contextualStrings: [sentence],
        preferOnDeviceRecognition: false,
        strictOfflineOnly: false,
        maxMs: 18000,
      });
      if (!result.ok) {
        if (result.reason === 'permission') {
          setHint('Microphone permission is needed for a listening check.');
        } else if (result.reason === 'timeout') {
          setHint(
            'No speech detected — wait for Listening…, speak clearly, then pause.'
          );
        } else if (result.reason === 'unavailable-offline') {
          setHint(
            'This device needs on-device English speech models in system settings for offline listening.'
          );
        } else {
          setHint(
            result.detail
              ? `Could not finish: ${result.detail}`
              : 'Could not hear that — try again or use the practice button.'
          );
        }
        return;
      }
      if (sentenceMatchesHeard(result.transcript, sentence)) {
        void playSuccess();
        showCompliment();
        noteCorrect();
        bumpGameLevel('reading');
        setCorrectInBatch((s) => {
          const n = s + 1;
          return n > PROGRESS_STEPS ? 0 : n;
        });
        setTimeout(advance, 800);
      } else {
        void playSoft();
        noteWrong();
        setHint('Almost — read the sentence again, then tap the mic.');
      }
    } finally {
      setListening(false);
    }
  };

  const onPracticeAnyway = () => {
    void playSuccess();
    showCompliment();
    noteCorrect();
    bumpGameLevel('reading');
    setCorrectInBatch((s) => {
      const n = s + 1;
      return n > PROGRESS_STEPS ? 0 : n;
    });
    setTimeout(advance, 600);
  };

  return (
    <View style={[styles.root, { gap: g(16) }]}>
      <GameLevelBadge
        level={level}
        scale={scale}
        subtitle="Bundled sentences — no internet needed"
      />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        Read the sentence out loud
      </Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>
        {muted
          ? 'Sound is off — read from the card. You can still use the mic check.'
          : 'Tap Hear sentence, then read with your voice. On many phones, recognition stays on-device when English offline models are installed.'}
      </Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard style={{ padding: g(18) }}>
        <Text
          style={[
            styles.sentence,
            { fontSize: fs(Math.min(22, 16 + sentence.length / 18)) },
          ]}
        >
          {sentence}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hear the sentence"
          onPress={() => speakSentence(sentence)}
          style={({ pressed }) => [
            styles.hearBtn,
            {
              marginTop: g(14),
              paddingVertical: g(12),
              paddingHorizontal: g(18),
              borderRadius: Math.max(10, g(14)),
              opacity: muted ? 0.45 : 1,
            },
            !muted && pressed && styles.hearPressed,
          ]}
          disabled={muted}
        >
          <Text style={[styles.hearLabel, { fontSize: fs(15) }]}>▶ Hear sentence</Text>
        </Pressable>
      </SoftCard>

      {sttOk ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Read to the device"
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
              <ActivityIndicator color="#F8FCFB" />
              <Text style={[styles.micLabel, { fontSize: fs(16), marginLeft: 10 }]}>
                Listening…
              </Text>
            </View>
          ) : (
            <Text style={[styles.micLabel, { fontSize: fs(17) }]}>🎤 Read to the device</Text>
          )}
        </Pressable>
      ) : (
        <Text style={[styles.warn, { fontSize: fs(14) }]}>
          Speech check needs the mobile app on a device with speech recognition.
        </Text>
      )}

      {hint ? (
        <Text style={[styles.hint, { fontSize: fs(14) }]}>{hint}</Text>
      ) : null}

      <CalmButton label="We read it together!" variant="secondary" onPress={onPracticeAnyway} />

      <Text style={[styles.footer, { fontSize: fs(12) }]}>
        Sentences live inside the app so reading works offline. Add more anytime in the sentence list
        in code.
      </Text>

      <CalmButton label="Back to games" variant="ghost" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  heading: { color: colors.text, textAlign: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  sentence: {
    color: colors.text,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },
  hearBtn: { backgroundColor: colors.primary, alignItems: 'center', alignSelf: 'center' },
  hearPressed: { opacity: 0.88 },
  hearLabel: { fontWeight: '700', color: '#F8FCFB' },
  micBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  micPressed: { opacity: 0.9 },
  micRow: { flexDirection: 'row', alignItems: 'center' },
  micLabel: { fontWeight: '700', color: colors.text },
  warn: { color: colors.textMuted, textAlign: 'center' },
  hint: { color: colors.text, textAlign: 'center' },
  footer: { color: colors.textMuted, textAlign: 'center' },
});
