import * as Speech from 'expo-speech';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { canUseNativeSpeechRecognition, listenOnce } from '../../../core/speech/listenOnceEn';
import { sentenceMatchesHeardFilipino } from '../../../core/speech/matchSpokenText';
import { colors } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';
import { useShuffledBag } from '../../../hooks/useShuffledBag';
import {
  flairLabel,
  maxReadTierForLevel,
  tagalogReadPoolForLevel,
  TAGALOG_READ_ROTATORS,
  TAGALOG_SPEECH_LOCALE,
  type TagalogReadSentence,
} from './tagalogSpeechData';

const PROGRESS_STEPS = 8;

export function TagalogReadAloudGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const muted = useAppStore((s) => s.muted);
  const level = useAppStore((s) => s.gameLevels.tagalogRead ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Tagalog basahan · Level ${level}`);

  const maxReadTier = maxReadTierForLevel(level);
  const readPool = useMemo(() => tagalogReadPoolForLevel(level), [level]);
  const { initial, next } = useShuffledBag(readPool, [maxReadTier], (s) => s.text);
  const [item, setItem] = useState<TagalogReadSentence>(() => initial());
  const prevTagalogReadTier = useRef(maxReadTier);
  useLayoutEffect(() => {
    if (prevTagalogReadTier.current !== maxReadTier) {
      prevTagalogReadTier.current = maxReadTier;
      setItem(initial());
    }
  }, [maxReadTier, initial]);
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const sttOk = canUseNativeSpeechRecognition();

  const rotator = useMemo(() => {
    return TAGALOG_READ_ROTATORS[correctInBatch % TAGALOG_READ_ROTATORS.length]!;
  }, [correctInBatch]);

  const flair = flairLabel(item.flair);

  const speakSentence = useCallback(
    (t: string) => {
      if (muted) return;
      Speech.stop();
      Speech.speak(t, {
        language: TAGALOG_SPEECH_LOCALE,
        rate: 0.88,
        pitch: 1,
      });
    },
    [muted]
  );

  useEffect(() => {
    if (muted) return;
    const id = setTimeout(() => speakSentence(item.text), 420);
    return () => {
      clearTimeout(id);
      Speech.stop();
    };
  }, [item.text, muted, speakSentence]);

  const advance = useCallback(() => {
    setItem(() => next());
    setHint(null);
  }, [next]);

  const onMicCheck = async () => {
    if (!sttOk || listening) return;
    setHint(null);
    setListening(true);
    try {
      const result = await listenOnce({
        contextualStrings: [item.text],
        lang: TAGALOG_SPEECH_LOCALE,
        preferOnDeviceRecognition: false,
        strictOfflineOnly: false,
        maxMs: 20000,
      });
      if (!result.ok) {
        if (result.reason === 'permission') {
          setHint('Kailangan ang pahintulot sa mikropono. / Microphone permission needed.');
        } else if (result.reason === 'timeout') {
          setHint(
            'Walang natanggap — basahin nang malakas habang nakikinig ang app. / Speak clearly while Listening is on.'
          );
        } else if (result.reason === 'unavailable-offline') {
          setHint(
            'Mag-install ng offline na Filipino speech model sa settings kung kaya. / Install offline Filipino speech if available.'
          );
        } else {
          setHint(
            result.detail
              ? `Subukan muli: ${result.detail}`
              : 'Subukan muli — o gamitin ang practice button. / Try again or use practice.'
          );
        }
        return;
      }
      if (sentenceMatchesHeardFilipino(result.transcript, item.text)) {
        void playSuccess();
        showCompliment();
        noteCorrect();
        bumpGameLevel('tagalogRead');
        setCorrectInBatch((s) => {
          const n = s + 1;
          return n > PROGRESS_STEPS ? 0 : n;
        });
        setTimeout(advance, 820);
      } else {
        void playSoft();
        noteWrong();
        setHint('Halos na! Basahin muli nang malinaw, tapos mikropono. / Almost — read clearly again.');
      }
    } finally {
      setListening(false);
    }
  };

  const onPracticeTogether = () => {
    void playSuccess();
    showCompliment();
    noteCorrect();
    bumpGameLevel('tagalogRead');
    setCorrectInBatch((s) => {
      const n = s + 1;
      return n > PROGRESS_STEPS ? 0 : n;
    });
    setTimeout(advance, 620);
  };

  return (
    <View style={[styles.root, { gap: g(14) }]}>
      <GameLevelBadge
        level={level}
        scale={scale}
        subtitle="Mga pangungusap sa app — walang internet"
      />

      <Text style={[styles.rotator, { fontSize: fs(14) }]}>{rotator}</Text>

      <Text style={[styles.heading, { fontSize: fs(17) }]}>
        Basahin nang malakas / Read out loud
      </Text>
      <Text style={[styles.sub, { fontSize: fs(13) }]}>
        {muted
          ? 'Naka-mute — basa mula sa kard. Puwede pa ring suriin ang mikropono.'
          : 'May maliit na uri (tanong, kuwento…). Pakinggan muna kung gusto mo.'}
      </Text>

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard
        style={{
          padding: g(16),
          borderTopWidth: 3,
          borderTopColor: colors.accentSoft,
        }}
      >
        <View style={[styles.flairRow, { marginBottom: g(10), gap: g(8) }]}>
          <View style={[styles.flairPill, { paddingVertical: g(4), paddingHorizontal: g(10), borderRadius: g(20) }]}>
            <Text style={[styles.flairTl, { fontSize: fs(12) }]}>{flair.tl}</Text>
          </View>
          <Text style={[styles.flairEn, { fontSize: fs(11) }]}>{flair.en}</Text>
        </View>
        <Text
          style={[
            styles.sentence,
            { fontSize: fs(Math.min(21, 15 + item.text.length / 22)) },
          ]}
        >
          {item.text}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hear sentence"
          onPress={() => speakSentence(item.text)}
          style={({ pressed }) => [
            styles.hearBtn,
            {
              marginTop: g(12),
              paddingVertical: g(11),
              paddingHorizontal: g(16),
              borderRadius: Math.max(10, g(14)),
              opacity: muted ? 0.45 : 1,
            },
            !muted && pressed && styles.hearPressed,
          ]}
          disabled={muted}
        >
          <Text style={[styles.hearLabel, { fontSize: fs(14) }]}>
            ▶ Pakinggan / Hear sentence
          </Text>
        </Pressable>
      </SoftCard>

      {sttOk ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Read to device"
          disabled={listening}
          onPress={() => void onMicCheck()}
          style={({ pressed }) => [
            styles.micBtn,
            {
              paddingVertical: g(15),
              borderRadius: Math.max(12, g(16)),
              opacity: listening ? 0.65 : 1,
            },
            pressed && !listening && styles.micPressed,
          ]}
        >
          {listening ? (
            <View style={styles.micRow}>
              <ActivityIndicator color="#F8FCFB" />
              <Text style={[styles.micLabel, { fontSize: fs(15), marginLeft: 10 }]}>
                Nakikinig… / Listening…
              </Text>
            </View>
          ) : (
            <Text style={[styles.micLabel, { fontSize: fs(16) }]}>
              🎤 Basahin sa telepono / Read to device
            </Text>
          )}
        </Pressable>
      ) : (
        <Text style={[styles.warn, { fontSize: fs(13) }]}>
          Kailangan ng app sa telepono na may speech recognition. / Needs a device with speech recognition.
        </Text>
      )}

      {hint ? <Text style={[styles.hint, { fontSize: fs(13) }]}>{hint}</Text> : null}

      <CalmButton
        label="Magkasama tayong nagbasa! / We read together!"
        variant="secondary"
        onPress={onPracticeTogether}
      />

      <CalmButton label="Back to games" variant="ghost" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  rotator: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  heading: { color: colors.text, textAlign: 'center', fontWeight: '700' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  flairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  flairPill: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  flairTl: { fontWeight: '800', color: colors.text, textAlign: 'center' },
  flairEn: { color: colors.textMuted },
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
});
