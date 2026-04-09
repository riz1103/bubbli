import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { canUseNativeSpeechRecognition, listenOnce } from '../../../core/speech/listenOnceEn';
import { wordMatchesHeardFilipino } from '../../../core/speech/matchSpokenText';
import { colors } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';
import { useShuffledBag } from '../../../hooks/useShuffledBag';
import {
  TAGALOG_ECHO_CHALLENGES,
  TAGALOG_ECHO_TIPS,
  TAGALOG_SPEECH_LOCALE,
  TAGALOG_WORD_ROUNDS,
} from './tagalogSpeechData';

const PROGRESS_STEPS = 10;

export function TagalogEchoGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess, playSoft } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const muted = useAppStore((s) => s.muted);
  const level = useAppStore((s) => s.gameLevels.tagalogEcho ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Tagalog salita · Level ${level}`);

  const { initial, next } = useShuffledBag(TAGALOG_WORD_ROUNDS, [], (r) => r.word);
  const [round, setRound] = useState(() => initial());
  const { word, theme } = round;
  const [correctInBatch, setCorrectInBatch] = useState(0);
  const [streak, setStreak] = useState(0);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const sttOk = canUseNativeSpeechRecognition();

  const challengeLine = useMemo(() => {
    const i = (correctInBatch + word.length) % TAGALOG_ECHO_CHALLENGES.length;
    return TAGALOG_ECHO_CHALLENGES[i]!;
  }, [correctInBatch, word]);

  const tipLine = useMemo(() => {
    return TAGALOG_ECHO_TIPS[correctInBatch % TAGALOG_ECHO_TIPS.length]!;
  }, [correctInBatch]);

  const speakWord = useCallback(
    (w: string) => {
      if (muted) return;
      Speech.stop();
      Speech.speak(w, {
        language: TAGALOG_SPEECH_LOCALE,
        rate: 0.9,
        pitch: 1,
      });
    },
    [muted]
  );

  useEffect(() => {
    if (muted) return;
    const t = setTimeout(() => speakWord(word), 360);
    return () => {
      clearTimeout(t);
      Speech.stop();
    };
  }, [word, muted, speakWord]);

  const advanceAfterSuccess = useCallback(() => {
    void playSuccess();
    showCompliment();
    noteCorrect();
    bumpGameLevel('tagalogEcho');
    setCorrectInBatch((s) => {
      const n = s + 1;
      return n > PROGRESS_STEPS ? 0 : n;
    });
    setStreak((s) => s + 1);
    setRound(() => next());
    setHint(null);
  }, [bumpGameLevel, next, noteCorrect, playSuccess, showCompliment]);

  const onHeardIt = useCallback(() => {
    advanceAfterSuccess();
  }, [advanceAfterSuccess]);

  const onMicCheck = async () => {
    if (!sttOk || listening) return;
    setHint(null);
    setListening(true);
    try {
      const result = await listenOnce({
        contextualStrings: [word],
        lang: TAGALOG_SPEECH_LOCALE,
        preferOnDeviceRecognition: false,
        strictOfflineOnly: false,
        maxMs: 14000,
      });
      if (!result.ok) {
        if (result.reason === 'permission') {
          setHint('Kailangan ang mikropono. / Microphone permission is needed.');
        } else if (result.reason === 'timeout') {
          setHint(
            'Walang narinig — magsalita nang malakas pag “Nakikinig…”. / Speak while it says Listening.'
          );
        } else {
          setHint(
            result.detail
              ? `Subukan muli: ${result.detail}`
              : 'Subukan muli — o pindutin ang berdeng button. / Try again or tap the green button.'
          );
        }
        return;
      }
      if (wordMatchesHeardFilipino(result.transcript, word)) {
        advanceAfterSuccess();
      } else {
        void playSoft();
        noteWrong();
        setStreak(0);
        setHint(`Narinig: “${result.transcript.trim()}” — isa pang subok!`);
      }
    } finally {
      setListening(false);
    }
  };

  return (
    <View style={[styles.root, { gap: g(14) }]}>
      <GameLevelBadge
        level={level}
        scale={scale}
        subtitle="Themed words — laro ang boses"
      />

      <View style={[styles.challengeBanner, { paddingVertical: g(10), paddingHorizontal: g(12), borderRadius: g(12) }]}>
        <Text style={[styles.challengeText, { fontSize: fs(15) }]}>{challengeLine}</Text>
      </View>

      <Text style={[styles.heading, { fontSize: fs(17) }]}>
        Pakinggan, sabihin, magsaya / Listen, say, enjoy
      </Text>
      <Text style={[styles.sub, { fontSize: fs(13) }]}>
        {muted
          ? 'Naka-mute — basahin ang salita. Puwede pa ring gamitin ang mikropono.'
          : 'May tema bawat round. I-tap ang Play, sabihin ang salita, o gamitin ang mikropono.'}
      </Text>

      {streak >= 3 ? (
        <Text style={[styles.streak, { fontSize: fs(14) }]}>
          Sunod-sunod: {streak} — ang galing! / On a roll!
        </Text>
      ) : null}

      <ProgressDots total={PROGRESS_STEPS} filled={correctInBatch} scale={scale} />

      <SoftCard
        style={{
          padding: g(18),
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}
      >
        <View style={[styles.themeRow, { gap: g(8), marginBottom: g(10) }]}>
          <Text style={{ fontSize: fs(20) }}>{theme.emoji}</Text>
          <View>
            <Text style={[styles.themeTl, { fontSize: fs(13) }]}>{theme.labelTl}</Text>
            <Text style={[styles.themeEn, { fontSize: fs(12) }]}>{theme.labelEn}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.wordDisplay,
            { fontSize: fs(Math.min(38, 26 + (word.length > 12 ? 0 : 6))) },
          ]}
        >
          {word}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play Tagalog word"
          onPress={() => speakWord(word)}
          style={({ pressed }) => [
            styles.playBtn,
            {
              marginTop: g(16),
              paddingVertical: g(12),
              paddingHorizontal: g(20),
              borderRadius: Math.max(12, g(14)),
              opacity: muted ? 0.45 : 1,
            },
            !muted && pressed && styles.playPressed,
          ]}
          disabled={muted}
        >
          <Text style={[styles.playLabel, { fontSize: fs(15) }]}>▶ Pakinggan / Play</Text>
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
              paddingVertical: g(15),
              borderRadius: Math.max(12, g(16)),
              opacity: listening ? 0.65 : 1,
            },
            pressed && !listening && styles.micPressed,
          ]}
        >
          {listening ? (
            <View style={styles.micRow}>
              <ActivityIndicator color={colors.text} />
              <Text style={[styles.micLabel, { fontSize: fs(15), marginLeft: 10 }]}>
                Nakikinig… / Listening…
              </Text>
            </View>
          ) : (
            <Text style={[styles.micLabel, { fontSize: fs(16) }]}>
              🎤 Suriin ang salita / Check word
            </Text>
          )}
        </Pressable>
      ) : null}

      {hint ? <Text style={[styles.hint, { fontSize: fs(13) }]}>{hint}</Text> : null}

      <CalmButton label="Nasabi ko na! / We practiced!" onPress={onHeardIt} />

      <Text style={[styles.tipFooter, { fontSize: fs(12) }]}>{tipLine}</Text>

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  challengeBanner: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeText: { color: colors.text, textAlign: 'center', fontWeight: '600' },
  heading: { color: colors.text, textAlign: 'center', fontWeight: '700' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  streak: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  themeTl: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  themeEn: { color: colors.textMuted, textAlign: 'center' },
  wordDisplay: {
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  playBtn: { backgroundColor: colors.primary, alignItems: 'center' },
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
  tipFooter: { color: colors.textMuted, textAlign: 'center' },
});
