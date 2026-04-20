import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalmButton } from '../components/CalmButton';
import { SoftCard } from '../components/SoftCard';
import { GAMES } from '../core/constants/games';
import { colors, spacing } from '../core/theme';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Parent'>;

const pad = (n: string) => n.replace(/\D/g, '').slice(0, 4);
const GAME_LABELS = Object.fromEntries(GAMES.map((g) => [g.id, g.title] as const));

type AnalyzerLine = {
  id: string;
  label: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  minutes: number;
  level: number;
  rapidRate: number;
  longestWrongStreak: number;
  guessingFlags: number;
};

type GraphPoint = {
  key: string;
  label: string;
  value: number;
  attempts: number;
};

type GraphMetric = 'accuracy' | 'attempts' | 'minutes' | 'focusRisk';
type GraphRange = '7d' | '30d' | 'all';

function getAnalyzerStatus(accuracy: number, attempts: number): string {
  if (attempts < 4) return 'Early check-in (needs more rounds)';
  if (accuracy >= 85) return 'Strong progress';
  if (accuracy >= 70) return 'Steady progress';
  if (accuracy >= 50) return 'Needs support';
  return 'Needs focused support';
}

function getAnalyzerSuggestion(label: string, accuracy: number): string {
  if (accuracy >= 85) {
    return `Keep ${label} sessions short and positive, then continue to the next level.`;
  }
  if (accuracy >= 70) {
    return `Repeat ${label} for a few more rounds and pause briefly after 2-3 mistakes.`;
  }
  if (accuracy >= 50) {
    return `Practice ${label} with easier prompts first, then return to regular rounds.`;
  }
  return `Spend extra guided time on ${label}, model one example, then let the child try again.`;
}

function isLikelyGuessing(line: AnalyzerLine): boolean {
  if (line.attempts < 8) return false;
  return (
    (line.accuracy <= 40 && line.rapidRate >= 45) ||
    line.longestWrongStreak >= 5 ||
    line.guessingFlags >= 3
  );
}

function shortDateLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function metricLabel(metric: GraphMetric): string {
  if (metric === 'accuracy') return 'Accuracy %';
  if (metric === 'attempts') return 'Attempts';
  if (metric === 'focusRisk') return 'Focus risk';
  return 'Play minutes';
}

function graphFillColor(metric: GraphMetric, value: number): string {
  if (metric !== 'focusRisk') return colors.primary;
  if (value <= 33) return colors.success;
  if (value <= 66) return '#E8C98F';
  return '#D38A8A';
}

export function ParentDashboard({ navigation }: Props) {
  const parentPin = useAppStore((s) => s.parentPin);
  const setParentPin = useAppStore((s) => s.setParentPin);
  const muted = useAppStore((s) => s.muted);
  const setMuted = useAppStore((s) => s.setMuted);
  const dailyLimitMinutes = useAppStore((s) => s.dailyLimitMinutes);
  const setDailyLimitMinutes = useAppStore((s) => s.setDailyLimitMinutes);
  const sessionLengthMinutes = useAppStore((s) => s.sessionLengthMinutes);
  const setSessionLengthMinutes = useAppStore((s) => s.setSessionLengthMinutes);
  const gameSeconds = useAppStore((s) => s.gameSeconds);
  const allTimeGameSeconds = useAppStore((s) => s.allTimeGameSeconds);
  const wrongGuessCounts = useAppStore((s) => s.wrongGuessCounts);
  const performanceStats = useAppStore((s) => s.performanceStats);
  const allTimePerformanceStats = useAppStore((s) => s.allTimePerformanceStats);
  const focusSignals = useAppStore((s) => s.focusSignals);
  const allTimeFocusSignals = useAppStore((s) => s.allTimeFocusSignals);
  const performanceHistory = useAppStore((s) => s.performanceHistory);
  const gameLevels = useAppStore((s) => s.gameLevels);
  const resetAllGameLevels = useAppStore((s) => s.resetAllGameLevels);
  const resetProgressData = useAppStore((s) => s.resetProgressData);

  const [pinInput, setPinInput] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupPin2, setSetupPin2] = useState('');
  const [unlocked, setUnlocked] = useState(!parentPin);
  const [selectedGraphGame, setSelectedGraphGame] = useState<'all' | string>('all');
  const [selectedGraphMetric, setSelectedGraphMetric] = useState<GraphMetric>('accuracy');
  const [selectedGraphRange, setSelectedGraphRange] = useState<GraphRange>('30d');

  useEffect(() => {
    setUnlocked(!parentPin);
  }, [parentPin]);

  const tryUnlock = () => {
    if (pad(pinInput) === (parentPin ?? '')) setUnlocked(true);
    setPinInput('');
  };

  const savePin = async () => {
    const a = pad(setupPin);
    const b = pad(setupPin2);
    if (a.length !== 4 || a !== b) return;
    await setParentPin(a);
    setSetupPin('');
    setSetupPin2('');
    setUnlocked(true);
  };

  const clearPin = async () => {
    await setParentPin('');
    setUnlocked(true);
  };

  const decDaily = () => void setDailyLimitMinutes(dailyLimitMinutes - 5);
  const incDaily = () => void setDailyLimitMinutes(dailyLimitMinutes + 5);
  const decSession = () =>
    void setSessionLengthMinutes(sessionLengthMinutes - 1);
  const incSession = () =>
    void setSessionLengthMinutes(sessionLengthMinutes + 1);

  if (!unlocked && parentPin) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.body}>This screen is for grown-ups.</Text>
          <TextInput
            value={pinInput}
            onChangeText={(t) => setPinInput(pad(t))}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="••••"
            style={styles.input}
            maxLength={4}
          />
          <CalmButton label="Unlock" onPress={tryUnlock} />
          <CalmButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const gameLines = Object.entries(gameSeconds).filter(([, s]) => s > 0);
  const allTimeGameLines = Object.entries(allTimeGameSeconds).filter(([, s]) => s > 0);
  const wrongLines = Object.entries(wrongGuessCounts).filter(([, count]) => count > 0);
  const totalWrongGuesses = wrongLines.reduce((sum, [, count]) => sum + count, 0);
  const totalTodayMinutes = Math.round(
    Object.values(gameSeconds).reduce((sum, sec) => sum + sec, 0) / 60
  );
  const totalAllTimeMinutes = Math.round(
    Object.values(allTimeGameSeconds).reduce((sum, sec) => sum + sec, 0) / 60
  );
  const analyzerLines: AnalyzerLine[] = Object.entries(allTimePerformanceStats)
    .map(([id, perf]) => {
      const attempts = perf.attempts ?? 0;
      const correct = perf.correct ?? 0;
      const wrong = perf.wrong ?? 0;
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const focus = allTimeFocusSignals[id];
      const rapidAnswers = focus?.rapidAnswers ?? 0;
      const rapidRate = attempts > 0 ? Math.round((rapidAnswers / attempts) * 100) : 0;
      return {
        id,
        label: GAME_LABELS[id as keyof typeof GAME_LABELS] ?? id,
        attempts,
        correct,
        wrong,
        accuracy,
        minutes: Math.round((allTimeGameSeconds[id] ?? 0) / 60),
        level: gameLevels[id as keyof typeof gameLevels] ?? 1,
        rapidRate,
        longestWrongStreak: focus?.longestWrongStreak ?? 0,
        guessingFlags: focus?.possibleGuessingFlags ?? 0,
      };
    })
    .filter((line) => line.attempts > 0)
    .sort((a, b) => b.attempts - a.attempts);
  const graphGameOptions = [
    { id: 'all', label: 'All games' },
    ...GAMES.map((g) => ({ id: g.id, label: g.title })),
  ];
  const weakest = [...analyzerLines].sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongest = [...analyzerLines].sort((a, b) => b.accuracy - a.accuracy)[0];
  const todayAttempts = Object.values(performanceStats).reduce(
    (sum, p) => sum + (p.attempts ?? 0),
    0
  );
  const todayCorrect = Object.values(performanceStats).reduce(
    (sum, p) => sum + (p.correct ?? 0),
    0
  );
  const todayAccuracy =
    todayAttempts > 0 ? Math.round((todayCorrect / todayAttempts) * 100) : 0;
  const todayRapid = Object.values(focusSignals).reduce(
    (sum, s) => sum + (s.rapidAnswers ?? 0),
    0
  );
  const todayGuessFlags = Object.values(focusSignals).reduce(
    (sum, s) => sum + (s.possibleGuessingFlags ?? 0),
    0
  );
  const todayFocusRisk =
    todayAttempts > 0
      ? Math.min(100, Math.round((todayRapid / todayAttempts) * 60 + todayGuessFlags * 6))
      : 0;
  const graphPoints = useMemo<GraphPoint[]>(() => {
    const historical = performanceHistory.map((h) => {
      const perGame = h.games?.[selectedGraphGame];
      const attempts = selectedGraphGame === 'all' ? h.attempts : (perGame?.attempts ?? 0);
      const accuracy = selectedGraphGame === 'all' ? h.accuracy : (perGame?.accuracy ?? 0);
      const focusRisk =
        selectedGraphGame === 'all' ? h.focusRisk ?? 0 : (perGame?.focusRisk ?? 0);
      const minutes = selectedGraphGame === 'all' ? h.playMinutes : (perGame?.playMinutes ?? 0);
      const value =
        selectedGraphMetric === 'accuracy'
          ? accuracy
          : selectedGraphMetric === 'attempts'
            ? attempts
            : selectedGraphMetric === 'focusRisk'
              ? focusRisk
            : minutes;
      return {
        key: h.dateKey,
        label: shortDateLabel(h.dateKey),
        value,
        attempts,
      };
    });

    const todayGamePerf =
      selectedGraphGame === 'all' ? null : performanceStats[selectedGraphGame];
    const todayGameFocus = selectedGraphGame === 'all' ? null : focusSignals[selectedGraphGame];
    const todayGameMinutes =
      selectedGraphGame === 'all'
        ? 0
        : Math.round((gameSeconds[selectedGraphGame] ?? 0) / 60);
    const todayGameAttempts = todayGamePerf?.attempts ?? 0;
    const todayGameAccuracy =
      todayGameAttempts > 0
        ? Math.round(((todayGamePerf?.correct ?? 0) / todayGameAttempts) * 100)
        : 0;
    const todayGameRapid = todayGameFocus?.rapidAnswers ?? 0;
    const todayGameFlags = todayGameFocus?.possibleGuessingFlags ?? 0;
    const todayGameFocusRisk =
      todayGameAttempts > 0
        ? Math.min(
            100,
            Math.round((todayGameRapid / todayGameAttempts) * 60 + todayGameFlags * 6)
          )
        : 0;
    const todayValue =
      selectedGraphMetric === 'accuracy'
        ? selectedGraphGame === 'all'
          ? todayAccuracy
          : todayGameAccuracy
        : selectedGraphMetric === 'attempts'
          ? selectedGraphGame === 'all'
            ? todayAttempts
            : todayGameAttempts
          : selectedGraphMetric === 'focusRisk'
            ? selectedGraphGame === 'all'
              ? todayFocusRisk
              : todayGameFocusRisk
          : selectedGraphGame === 'all'
            ? Math.round(Object.values(gameSeconds).reduce((sum, s) => sum + s, 0) / 60)
            : todayGameMinutes;
    const todayAttemptsForPoint =
      selectedGraphGame === 'all' ? todayAttempts : todayGameAttempts;

    const withToday =
      todayAttemptsForPoint > 0
        ? [
            ...historical,
            {
              key: `today-live-${selectedGraphGame}`,
              label: 'Today',
              value: todayValue,
              attempts: todayAttemptsForPoint,
            },
          ]
        : historical;

    const filteredNonZero = withToday.filter((p) =>
      selectedGraphMetric === 'accuracy' ? p.attempts > 0 : p.value > 0
    );
    if (selectedGraphRange === 'all') return filteredNonZero;
    if (selectedGraphRange === '7d') return filteredNonZero.slice(-7);
    return filteredNonZero.slice(-30);
  }, [
    performanceHistory,
    selectedGraphGame,
    selectedGraphMetric,
    selectedGraphRange,
    performanceStats,
    focusSignals,
    gameSeconds,
    todayAccuracy,
    todayAttempts,
    todayFocusRisk,
  ]);

  const graphMax = Math.max(
    1,
    ...graphPoints.map((p) =>
      selectedGraphMetric === 'accuracy' || selectedGraphMetric === 'focusRisk'
        ? 100
        : p.value
    )
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SoftCard>
          <Text style={styles.cardTitle}>Daily time limit</Text>
          <Text style={styles.body}>
            Current: {dailyLimitMinutes} minutes of gentle play per day.
          </Text>
          <View style={styles.stepRow}>
            <CalmButton
              label="−"
              variant="secondary"
              onPress={decDaily}
              style={styles.step}
            />
            <CalmButton
              label="+"
              variant="secondary"
              onPress={incDaily}
              style={styles.step}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Session length</Text>
          <Text style={styles.body}>
            A soft pause appears after about {sessionLengthMinutes} minutes in one visit.
          </Text>
          <View style={styles.stepRow}>
            <CalmButton
              label="−"
              variant="secondary"
              onPress={decSession}
              style={styles.step}
            />
            <CalmButton
              label="+"
              variant="secondary"
              onPress={incSession}
              style={styles.step}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Mute sound and haptics</Text>
              <Text style={styles.body}>Helpful in quiet spaces.</Text>
            </View>
            <Switch
              value={muted}
              onValueChange={(v) => void setMuted(v)}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={colors.surface}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>PIN lock</Text>
          <Text style={styles.body}>
            A simple PIN keeps this page private. Stored on this device only.
          </Text>
          {parentPin ? (
            <CalmButton label="Remove PIN" variant="secondary" onPress={() => void clearPin()} />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="New PIN (4 digits)"
                keyboardType="number-pad"
                secureTextEntry
                value={setupPin}
                onChangeText={(t) => setSetupPin(pad(t))}
                maxLength={4}
              />
              <TextInput
                style={styles.input}
                placeholder="Repeat PIN"
                keyboardType="number-pad"
                secureTextEntry
                value={setupPin2}
                onChangeText={(t) => setSetupPin2(pad(t))}
                maxLength={4}
              />
              <CalmButton label="Save PIN" onPress={() => void savePin()} />
            </>
          )}
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Saved game levels</Text>
          <Text style={styles.body}>
            Each activity remembers its level on this device (up to 100). Shapes:{' '}
            {gameLevels.matching}, Colors: {gameLevels.sorting}, Patterns:{' '}
            {gameLevels.patterns}, Feelings: {gameLevels.emotions}, Sounds:{' '}
            {gameLevels.sounds}, Listen & speak: {gameLevels.echo}, Rhymes:{' '}
            {gameLevels.rhymes}, Read aloud: {gameLevels.reading}, Clock:{' '}
            {gameLevels.clock}, Tagalog words: {gameLevels.tagalogEcho}, Tagalog read:{' '}
            {gameLevels.tagalogRead}.
          </Text>
          <CalmButton
            label="Reset all levels to 1"
            variant="secondary"
            onPress={() =>
              Alert.alert(
                'Reset all levels?',
                'Every activity will go back to level 1. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => void resetAllGameLevels(),
                  },
                ]
              )
            }
          />
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Reset tracked progress data</Text>
          <Text style={styles.body}>
            Clears playtime, guesses, focus signals, analyzer totals, and history graphs on this
            device.
          </Text>
          <CalmButton
            label="Reset progress data"
            variant="secondary"
            onPress={() =>
              Alert.alert(
                'Reset all tracked progress data?',
                'This will erase learning analytics, graph history, and guessing/focus signals. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset data',
                    style: 'destructive',
                    onPress: () => void resetProgressData(),
                  },
                ]
              )
            }
          />
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Today's gentle play</Text>
          {gameLines.length === 0 ? (
            <Text style={styles.body}>No play tracked yet today.</Text>
          ) : (
            gameLines.map(([id, sec]) => (
              <Text key={id} style={styles.statLine}>
                {GAME_LABELS[id as keyof typeof GAME_LABELS] ?? id}: {Math.round(sec / 60)} min
              </Text>
            ))
          )}
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Time spent by game (saved)</Text>
          <Text style={styles.body}>
            Today: {totalTodayMinutes} min | All time: {totalAllTimeMinutes} min
          </Text>
          {allTimeGameLines.length === 0 ? (
            <Text style={styles.body}>No playtime saved yet.</Text>
          ) : (
            allTimeGameLines
              .sort((a, b) => b[1] - a[1])
              .map(([id, sec]) => {
                const todayMin = Math.round((gameSeconds[id] ?? 0) / 60);
                const allTimeMin = Math.round(sec / 60);
                return (
                  <Text key={`alltime-${id}`} style={styles.statLine}>
                    {GAME_LABELS[id as keyof typeof GAME_LABELS] ?? id}: {todayMin} min today,{' '}
                    {allTimeMin} min all time
                  </Text>
                );
              })
          )}
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Wrong guesses today</Text>
          {totalWrongGuesses === 0 ? (
            <Text style={styles.body}>No wrong guesses tracked yet today.</Text>
          ) : (
            <>
              <Text style={styles.body}>
                Total wrong guesses: {totalWrongGuesses}
              </Text>
              {wrongLines.map(([id, count]) => (
                <Text key={id} style={styles.statLine}>
                  {GAME_LABELS[id as keyof typeof GAME_LABELS] ?? id}: {count}
                </Text>
              ))}
            </>
          )}
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>AI learning analyzer (overall)</Text>
          {analyzerLines.length === 0 ? (
            <Text style={styles.body}>
              Not enough answer data yet. Let your child complete a few rounds to generate analysis.
            </Text>
          ) : (
            <>
              <Text style={styles.body}>
                Current status:{' '}
                {weakest
                  ? `${weakest.label} needs the most support right now.`
                  : 'Learning is in progress.'}
              </Text>
              {strongest ? (
                <Text style={styles.body}>
                  Strongest area: {strongest.label} ({strongest.accuracy}% accuracy, all time).
                </Text>
              ) : null}
              {analyzerLines.map((line) => (
                <View key={`analysis-${line.id}`} style={styles.analysisRow}>
                  <Text style={styles.statLine}>
                    {line.label}: {line.correct}/{line.attempts} correct ({line.accuracy}%)
                  </Text>
                  {isLikelyGuessing(line) ? (
                    <Text style={styles.guessWarning}>
                      Possible guessing behavior detected: many rapid taps and repeated wrong streaks.
                    </Text>
                  ) : null}
                  <Text style={styles.analysisMeta}>
                    Status: {getAnalyzerStatus(line.accuracy, line.attempts)} | Level:{' '}
                    {line.level} | Play: {line.minutes} min (all time) | Wrong: {line.wrong}
                  </Text>
                  <Text style={styles.analysisMeta}>
                    Focus signals: rapid answers {line.rapidRate}% | longest wrong streak{' '}
                    {line.longestWrongStreak} | guessing flags {line.guessingFlags}
                  </Text>
                  <Text style={styles.analysisSuggestion}>
                    Suggestion:{' '}
                    {isLikelyGuessing(line)
                      ? `For ${line.label}, try supervised short rounds and ask the child to say the answer before tapping.`
                      : getAnalyzerSuggestion(line.label, line.accuracy)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Progress graph</Text>
          <Text style={styles.body}>
            View trends by game, metric, and date range.
          </Text>
          <View style={styles.filterRow}>
            {(['accuracy', 'attempts', 'minutes', 'focusRisk'] as GraphMetric[]).map((metric) => (
              <Pressable
                key={`metric-${metric}`}
                onPress={() => setSelectedGraphMetric(metric)}
                style={[
                  styles.chip,
                  selectedGraphMetric === metric && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGraphMetric === metric && styles.chipTextActive,
                  ]}
                >
                  {metricLabel(metric)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.filterRow}>
            {(['7d', '30d', 'all'] as GraphRange[]).map((range) => (
              <Pressable
                key={`range-${range}`}
                onPress={() => setSelectedGraphRange(range)}
                style={[
                  styles.chip,
                  selectedGraphRange === range && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGraphRange === range && styles.chipTextActive,
                  ]}
                >
                  {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All'}
                </Text>
              </Pressable>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {graphGameOptions.map((opt) => (
                <Pressable
                  key={`game-${opt.id}`}
                  onPress={() => setSelectedGraphGame(opt.id)}
                  style={[
                    styles.chip,
                    selectedGraphGame === opt.id && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedGraphGame === opt.id && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {graphPoints.length === 0 ? (
            <Text style={styles.body}>
              No history yet. Progress bars will appear after your child starts playing.
            </Text>
          ) : (
            <>
              <Text style={styles.body}>
                Showing {graphPoints.length} points for{' '}
                {selectedGraphGame === 'all'
                  ? 'all games'
                  : GAME_LABELS[selectedGraphGame as keyof typeof GAME_LABELS] ??
                    selectedGraphGame}
                .
              </Text>
              {graphPoints.map((point) => (
                <View key={point.key} style={styles.graphRow}>
                  <Text style={styles.graphLabel}>{point.label}</Text>
                  <View style={styles.graphTrack}>
                    <View
                      style={[
                        styles.graphFill,
                        {
                          backgroundColor: graphFillColor(selectedGraphMetric, point.value),
                          width: `${Math.max(
                            4,
                            Math.min(100, Math.round((point.value / graphMax) * 100))
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.graphValue}>
                    {selectedGraphMetric === 'accuracy' || selectedGraphMetric === 'focusRisk'
                      ? `${point.value}%`
                      : Math.round(point.value)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </SoftCard>

        <CalmButton label="Done" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 18,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  stepRow: { flexDirection: 'row', gap: spacing.sm },
  step: { minWidth: 56, paddingHorizontal: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  statLine: { fontSize: 16, color: colors.text, marginTop: 4 },
  analysisRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  analysisMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  analysisSuggestion: {
    fontSize: 14,
    color: colors.primaryDark,
    marginTop: 4,
    lineHeight: 20,
  },
  guessWarning: {
    marginTop: 6,
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '700',
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F8FCFB',
  },
  graphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  graphLabel: {
    width: 56,
    fontSize: 12,
    color: colors.textMuted,
  },
  graphTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  graphFill: {
    height: '100%',
    borderRadius: 999,
  },
  graphValue: {
    width: 76,
    textAlign: 'right',
    fontSize: 12,
    color: colors.text,
  },
});
