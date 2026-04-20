import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  defaultGameLevels,
  MAX_GAME_LEVEL,
  parseStoredGameLevels,
  type LevelGameId,
} from '../core/constants/gameLevels';
import {
  DEFAULT_DAILY_LIMIT_MINUTES,
  DEFAULT_SESSION_MINUTES,
} from '../core/constants/session';

const K = {
  pin: '@bubbli/pin',
  muted: '@bubbli/muted',
  dailyMin: '@bubbli/dailyMin',
  sessionMin: '@bubbli/sessionMin',
  usageDate: '@bubbli/usageDate',
  usageMs: '@bubbli/usageMs',
  stats: '@bubbli/stats',
  allTimeStats: '@bubbli/allTimeStats',
  wrongStats: '@bubbli/wrongStats',
  focusSignals: '@bubbli/focusSignals',
  performanceStats: '@bubbli/performanceStats',
  allTimePerformanceStats: '@bubbli/allTimePerformanceStats',
  allTimeFocusSignals: '@bubbli/allTimeFocusSignals',
  performanceHistory: '@bubbli/performanceHistory',
  gameLevels: '@bubbli/gameLevels',
} as const;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

type Stats = Record<string, number>;
export type GamePerformance = {
  attempts: number;
  correct: number;
  wrong: number;
  lastPlayedAt: number;
};
type PerformanceStats = Record<string, GamePerformance>;
export type GameFocusSignals = {
  rapidAnswers: number;
  wrongStreakCurrent: number;
  longestWrongStreak: number;
  possibleGuessingFlags: number;
  lastAnswerAt: number;
};
type FocusSignals = Record<string, GameFocusSignals>;
export type PerformanceHistoryPoint = {
  dateKey: string;
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  focusRisk: number;
  playMinutes: number;
  games: Record<
    string,
    {
      attempts: number;
      correct: number;
      wrong: number;
      accuracy: number;
      focusRisk: number;
      playMinutes: number;
    }
  >;
};

function emptyPerf(): GamePerformance {
  return { attempts: 0, correct: 0, wrong: 0, lastPlayedAt: 0 };
}

function emptyFocus(): GameFocusSignals {
  return {
    rapidAnswers: 0,
    wrongStreakCurrent: 0,
    longestWrongStreak: 0,
    possibleGuessingFlags: 0,
    lastAnswerAt: 0,
  };
}

function rollupPerformance(perf: PerformanceStats): {
  attempts: number;
  correct: number;
  wrong: number;
} {
  return Object.values(perf).reduce(
    (acc, p) => ({
      attempts: acc.attempts + (p.attempts ?? 0),
      correct: acc.correct + (p.correct ?? 0),
      wrong: acc.wrong + (p.wrong ?? 0),
    }),
    { attempts: 0, correct: 0, wrong: 0 }
  );
}

function makeHistoryPoint(
  dateKey: string,
  perf: PerformanceStats,
  gameSeconds: Stats,
  focusSignals: FocusSignals
): PerformanceHistoryPoint {
  const totals = rollupPerformance(perf);
  const totalSeconds = Object.values(gameSeconds).reduce((sum, s) => sum + (s ?? 0), 0);
  const accuracy =
    totals.attempts > 0 ? Math.round((totals.correct / totals.attempts) * 100) : 0;
  const totalRapid = Object.values(focusSignals).reduce(
    (sum, s) => sum + (s.rapidAnswers ?? 0),
    0
  );
  const totalFlags = Object.values(focusSignals).reduce(
    (sum, s) => sum + (s.possibleGuessingFlags ?? 0),
    0
  );
  const focusRisk = totals.attempts > 0
    ? Math.min(100, Math.round((totalRapid / totals.attempts) * 60 + (totalFlags * 6)))
    : 0;
  const games = Object.keys({ ...perf, ...gameSeconds }).reduce<
    PerformanceHistoryPoint['games']
  >((acc, gameId) => {
    const p = perf[gameId] ?? emptyPerf();
    const f = focusSignals[gameId] ?? emptyFocus();
    const attempts = p.attempts ?? 0;
    const correct = p.correct ?? 0;
    const wrong = p.wrong ?? 0;
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    const rapidRate = attempts > 0 ? (f.rapidAnswers / attempts) * 100 : 0;
    const focusRisk = Math.min(100, Math.round(rapidRate * 0.6 + (f.possibleGuessingFlags ?? 0) * 6));
    const playMinutes = Math.round((gameSeconds[gameId] ?? 0) / 60);
    if (attempts > 0 || playMinutes > 0) {
      acc[gameId] = { attempts, correct, wrong, accuracy, focusRisk, playMinutes };
    }
    return acc;
  }, {});

  return {
    dateKey,
    attempts: totals.attempts,
    correct: totals.correct,
    wrong: totals.wrong,
    accuracy,
    focusRisk,
    playMinutes: Math.round(totalSeconds / 60),
    games,
  };
}

function upsertHistory(
  history: PerformanceHistoryPoint[],
  point: PerformanceHistoryPoint
): PerformanceHistoryPoint[] {
  const filtered = history.filter((h) => h.dateKey !== point.dateKey);
  const next = [...filtered, point].sort(
    (a, b) =>
      new Date(`${a.dateKey}T00:00:00`).getTime() -
      new Date(`${b.dateKey}T00:00:00`).getTime()
  );
  return next.slice(-180);
}

export type RestReason = 'session' | 'daily' | null;

interface AppState {
  hydrated: boolean;
  parentPin: string | null;
  muted: boolean;
  dailyLimitMinutes: number;
  sessionLengthMinutes: number;
  /** Total ms in games today (resets when date changes) */
  todayUsageMs: number;
  usageDateKey: string;
  /** Seconds per game id for parent report */
  gameSeconds: Stats;
  /** Cumulative seconds per game id across all sessions */
  allTimeGameSeconds: Stats;
  /** Wrong guesses per game id for parent report (resets daily) */
  wrongGuessCounts: Stats;
  /** Currently active game for wrong-guess attribution */
  activeGameId: string | null;
  /** Pulse value increments whenever a wrong-guess notice should be shown */
  wrongGuessNoticePulse: number;
  /** Per-game learning performance stats (resets daily) */
  performanceStats: PerformanceStats;
  /** Per-game focus signals (resets daily) */
  focusSignals: FocusSignals;
  /** Per-game learning performance stats across all sessions */
  allTimePerformanceStats: PerformanceStats;
  /** Per-game focus signals across all sessions */
  allTimeFocusSignals: FocusSignals;
  /** Daily snapshots for progress trend graph */
  performanceHistory: PerformanceHistoryPoint[];
  /** Saved level per activity (1–100), persisted */
  gameLevels: Record<LevelGameId, number>;

  hydrate: () => Promise<void>;
  setMuted: (v: boolean) => Promise<void>;
  setParentPin: (pin: string) => Promise<void>;
  setDailyLimitMinutes: (m: number) => Promise<void>;
  setSessionLengthMinutes: (m: number) => Promise<void>;
  addPlaytime: (gameId: string, deltaMs: number) => void;
  setActiveGame: (gameId: string | null) => void;
  recordCorrectAnswer: () => void;
  recordWrongGuess: () => void;
  /** Call when calendar day changes */
  rolloverDayIfNeeded: () => void;
  bumpGameLevel: (gameId: LevelGameId) => void;
  resetAllGameLevels: () => Promise<void>;
  resetProgressData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  parentPin: null,
  muted: false,
  dailyLimitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
  sessionLengthMinutes: DEFAULT_SESSION_MINUTES,
  todayUsageMs: 0,
  usageDateKey: todayKey(),
  gameSeconds: {},
  allTimeGameSeconds: {},
  wrongGuessCounts: {},
  activeGameId: null,
  wrongGuessNoticePulse: 0,
  performanceStats: {},
  focusSignals: {},
  allTimePerformanceStats: {},
  allTimeFocusSignals: {},
  performanceHistory: [],
  gameLevels: defaultGameLevels(),

  hydrate: async () => {
    try {
      const [
        pin,
        muted,
        dailyMin,
        sessionMin,
        usageDate,
        usageMs,
        statsJson,
        allTimeStatsJson,
        wrongStatsJson,
        focusSignalsJson,
        performanceStatsJson,
        allTimePerformanceStatsJson,
        allTimeFocusSignalsJson,
        performanceHistoryJson,
        levelsJson,
      ] =
        await Promise.all([
          AsyncStorage.getItem(K.pin),
          AsyncStorage.getItem(K.muted),
          AsyncStorage.getItem(K.dailyMin),
          AsyncStorage.getItem(K.sessionMin),
          AsyncStorage.getItem(K.usageDate),
          AsyncStorage.getItem(K.usageMs),
          AsyncStorage.getItem(K.stats),
          AsyncStorage.getItem(K.allTimeStats),
          AsyncStorage.getItem(K.wrongStats),
          AsyncStorage.getItem(K.focusSignals),
          AsyncStorage.getItem(K.performanceStats),
          AsyncStorage.getItem(K.allTimePerformanceStats),
          AsyncStorage.getItem(K.allTimeFocusSignals),
          AsyncStorage.getItem(K.performanceHistory),
          AsyncStorage.getItem(K.gameLevels),
        ]);
      const key = todayKey();
      const storedDate = usageDate ?? key;
      const sameDay = storedDate === key;
      let todayMs = 0;
      let stats: Stats = {};
      let allTimeStats: Stats = allTimeStatsJson
        ? (JSON.parse(allTimeStatsJson) as Stats)
        : {};
      let wrongStats: Stats = {};
      let focusSignals: FocusSignals = {};
      let performanceStats: PerformanceStats = {};
      let allTimePerformanceStats: PerformanceStats = allTimePerformanceStatsJson
        ? (JSON.parse(allTimePerformanceStatsJson) as PerformanceStats)
        : {};
      let allTimeFocusSignals: FocusSignals = allTimeFocusSignalsJson
        ? (JSON.parse(allTimeFocusSignalsJson) as FocusSignals)
        : {};
      let performanceHistory: PerformanceHistoryPoint[] = performanceHistoryJson
        ? (JSON.parse(performanceHistoryJson) as PerformanceHistoryPoint[]).map((h) => ({
            ...h,
            focusRisk: h.focusRisk ?? 0,
            games: h.games ?? {},
          }))
        : [];
      if (sameDay) {
        todayMs = usageMs ? parseInt(usageMs, 10) || 0 : 0;
        stats = statsJson ? (JSON.parse(statsJson) as Stats) : {};
        wrongStats = wrongStatsJson ? (JSON.parse(wrongStatsJson) as Stats) : {};
        focusSignals = focusSignalsJson
          ? (JSON.parse(focusSignalsJson) as FocusSignals)
          : {};
        performanceStats = performanceStatsJson
          ? (JSON.parse(performanceStatsJson) as PerformanceStats)
          : {};
      } else {
        const staleStats = statsJson ? (JSON.parse(statsJson) as Stats) : {};
        const stalePerformanceStats = performanceStatsJson
          ? (JSON.parse(performanceStatsJson) as PerformanceStats)
          : {};
        const staleFocusSignals = focusSignalsJson
          ? (JSON.parse(focusSignalsJson) as FocusSignals)
          : {};
        const stalePoint = makeHistoryPoint(
          storedDate,
          stalePerformanceStats,
          staleStats,
          staleFocusSignals
        );
        if (stalePoint.attempts > 0 || stalePoint.playMinutes > 0) {
          performanceHistory = upsertHistory(performanceHistory, stalePoint);
          void AsyncStorage.setItem(K.performanceHistory, JSON.stringify(performanceHistory));
        }
        void AsyncStorage.setItem(K.usageDate, key);
        void AsyncStorage.setItem(K.usageMs, '0');
        void AsyncStorage.setItem(K.stats, '{}');
        void AsyncStorage.setItem(K.wrongStats, '{}');
        void AsyncStorage.setItem(K.focusSignals, '{}');
        void AsyncStorage.setItem(K.performanceStats, '{}');
      }
      set({
        hydrated: true,
        parentPin: pin,
        muted: muted === '1',
        dailyLimitMinutes: dailyMin
          ? Math.max(5, parseInt(dailyMin, 10))
          : DEFAULT_DAILY_LIMIT_MINUTES,
        sessionLengthMinutes: sessionMin
          ? Math.max(5, parseInt(sessionMin, 10))
          : DEFAULT_SESSION_MINUTES,
        todayUsageMs: todayMs,
        usageDateKey: key,
        gameSeconds: stats,
        allTimeGameSeconds: allTimeStats,
        wrongGuessCounts: wrongStats,
        performanceStats,
        focusSignals,
        allTimePerformanceStats,
        allTimeFocusSignals,
        performanceHistory,
        gameLevels: parseStoredGameLevels(levelsJson),
      });
    } catch {
      set({
        hydrated: true,
        usageDateKey: todayKey(),
        gameLevels: defaultGameLevels(),
      });
    }
  },

  setMuted: async (v) => {
    set({ muted: v });
    await AsyncStorage.setItem(K.muted, v ? '1' : '0');
  },

  setParentPin: async (pin) => {
    if (!pin) {
      set({ parentPin: null });
      await AsyncStorage.removeItem(K.pin);
      return;
    }
    set({ parentPin: pin });
    await AsyncStorage.setItem(K.pin, pin);
  },

  setDailyLimitMinutes: async (m) => {
    const v = Math.max(5, Math.min(180, m));
    set({ dailyLimitMinutes: v });
    await AsyncStorage.setItem(K.dailyMin, String(v));
  },

  setSessionLengthMinutes: async (m) => {
    const v = Math.max(5, Math.min(45, m));
    set({ sessionLengthMinutes: v });
    await AsyncStorage.setItem(K.sessionMin, String(v));
  },

  addPlaytime: (gameId, deltaMs) => {
    get().rolloverDayIfNeeded();
    const { todayUsageMs, gameSeconds, allTimeGameSeconds } = get();
    const nextStats = { ...gameSeconds };
    const nextAllTimeStats = { ...allTimeGameSeconds };
    nextStats[gameId] = (nextStats[gameId] ?? 0) + deltaMs / 1000;
    nextAllTimeStats[gameId] = (nextAllTimeStats[gameId] ?? 0) + deltaMs / 1000;
    set({
      todayUsageMs: todayUsageMs + deltaMs,
      gameSeconds: nextStats,
      allTimeGameSeconds: nextAllTimeStats,
    });
    const key = get().usageDateKey;
    void AsyncStorage.setItem(K.usageMs, String(get().todayUsageMs));
    void AsyncStorage.setItem(K.usageDate, key);
    void AsyncStorage.setItem(K.stats, JSON.stringify(get().gameSeconds));
    void AsyncStorage.setItem(K.allTimeStats, JSON.stringify(get().allTimeGameSeconds));
  },

  setActiveGame: (gameId) => {
    set({ activeGameId: gameId });
  },

  recordCorrectAnswer: () => {
    get().rolloverDayIfNeeded();
    const {
      activeGameId,
      performanceStats,
      allTimePerformanceStats,
      focusSignals,
      allTimeFocusSignals,
    } = get();
    if (!activeGameId) return;
    const now = Date.now();
    const RAPID_ANSWER_MS = 1800;
    const cur = performanceStats[activeGameId] ?? emptyPerf();
    const allTimeCur = allTimePerformanceStats[activeGameId] ?? emptyPerf();
    const focusCur = focusSignals[activeGameId] ?? emptyFocus();
    const focusAllTimeCur = allTimeFocusSignals[activeGameId] ?? emptyFocus();
    const isRapid =
      focusCur.lastAnswerAt > 0 && now - focusCur.lastAnswerAt <= RAPID_ANSWER_MS ? 1 : 0;
    const nextStats = {
      ...performanceStats,
      [activeGameId]: {
        attempts: cur.attempts + 1,
        correct: cur.correct + 1,
        wrong: cur.wrong,
        lastPlayedAt: now,
      },
    };
    const nextAllTimeStats = {
      ...allTimePerformanceStats,
      [activeGameId]: {
        attempts: allTimeCur.attempts + 1,
        correct: allTimeCur.correct + 1,
        wrong: allTimeCur.wrong,
        lastPlayedAt: now,
      },
    };
    const nextFocusSignals = {
      ...focusSignals,
      [activeGameId]: {
        rapidAnswers: focusCur.rapidAnswers + isRapid,
        wrongStreakCurrent: 0,
        longestWrongStreak: focusCur.longestWrongStreak,
        possibleGuessingFlags:
          focusCur.possibleGuessingFlags +
          (isRapid && focusCur.wrongStreakCurrent >= 3 ? 1 : 0),
        lastAnswerAt: now,
      },
    };
    const nextAllTimeFocusSignals = {
      ...allTimeFocusSignals,
      [activeGameId]: {
        rapidAnswers: focusAllTimeCur.rapidAnswers + isRapid,
        wrongStreakCurrent: 0,
        longestWrongStreak: Math.max(
          focusAllTimeCur.longestWrongStreak,
          focusCur.wrongStreakCurrent
        ),
        possibleGuessingFlags:
          focusAllTimeCur.possibleGuessingFlags +
          (isRapid && focusCur.wrongStreakCurrent >= 3 ? 1 : 0),
        lastAnswerAt: now,
      },
    };
    set({
      performanceStats: nextStats,
      allTimePerformanceStats: nextAllTimeStats,
      focusSignals: nextFocusSignals,
      allTimeFocusSignals: nextAllTimeFocusSignals,
    });
    void AsyncStorage.setItem(K.performanceStats, JSON.stringify(nextStats));
    void AsyncStorage.setItem(K.allTimePerformanceStats, JSON.stringify(nextAllTimeStats));
    void AsyncStorage.setItem(K.focusSignals, JSON.stringify(nextFocusSignals));
    void AsyncStorage.setItem(K.allTimeFocusSignals, JSON.stringify(nextAllTimeFocusSignals));
  },

  recordWrongGuess: () => {
    get().rolloverDayIfNeeded();
    const {
      activeGameId,
      wrongGuessCounts,
      wrongGuessNoticePulse,
      performanceStats,
      allTimePerformanceStats,
      focusSignals,
      allTimeFocusSignals,
    } = get();
    if (!activeGameId) return;
    const now = Date.now();
    const RAPID_ANSWER_MS = 1800;
    const nextWrongGuessCounts = {
      ...wrongGuessCounts,
      [activeGameId]: (wrongGuessCounts[activeGameId] ?? 0) + 1,
    };
    const cur = performanceStats[activeGameId] ?? emptyPerf();
    const allTimeCur = allTimePerformanceStats[activeGameId] ?? emptyPerf();
    const focusCur = focusSignals[activeGameId] ?? emptyFocus();
    const focusAllTimeCur = allTimeFocusSignals[activeGameId] ?? emptyFocus();
    const nextWrongStreak = focusCur.wrongStreakCurrent + 1;
    const isRapid =
      focusCur.lastAnswerAt > 0 && now - focusCur.lastAnswerAt <= RAPID_ANSWER_MS ? 1 : 0;
    const nextPerformanceStats = {
      ...performanceStats,
      [activeGameId]: {
        attempts: cur.attempts + 1,
        correct: cur.correct,
        wrong: cur.wrong + 1,
        lastPlayedAt: now,
      },
    };
    const nextAllTimePerformanceStats = {
      ...allTimePerformanceStats,
      [activeGameId]: {
        attempts: allTimeCur.attempts + 1,
        correct: allTimeCur.correct,
        wrong: allTimeCur.wrong + 1,
        lastPlayedAt: now,
      },
    };
    const nextFocusSignals = {
      ...focusSignals,
      [activeGameId]: {
        rapidAnswers: focusCur.rapidAnswers + isRapid,
        wrongStreakCurrent: nextWrongStreak,
        longestWrongStreak: Math.max(focusCur.longestWrongStreak, nextWrongStreak),
        possibleGuessingFlags:
          focusCur.possibleGuessingFlags + (isRapid && nextWrongStreak >= 3 ? 1 : 0),
        lastAnswerAt: now,
      },
    };
    const nextAllTimeFocusSignals = {
      ...allTimeFocusSignals,
      [activeGameId]: {
        rapidAnswers: focusAllTimeCur.rapidAnswers + isRapid,
        wrongStreakCurrent: nextWrongStreak,
        longestWrongStreak: Math.max(focusAllTimeCur.longestWrongStreak, nextWrongStreak),
        possibleGuessingFlags:
          focusAllTimeCur.possibleGuessingFlags + (isRapid && nextWrongStreak >= 3 ? 1 : 0),
        lastAnswerAt: now,
      },
    };
    set({
      wrongGuessCounts: nextWrongGuessCounts,
      wrongGuessNoticePulse: wrongGuessNoticePulse + 1,
      performanceStats: nextPerformanceStats,
      allTimePerformanceStats: nextAllTimePerformanceStats,
      focusSignals: nextFocusSignals,
      allTimeFocusSignals: nextAllTimeFocusSignals,
    });
    void AsyncStorage.setItem(K.wrongStats, JSON.stringify(nextWrongGuessCounts));
    void AsyncStorage.setItem(K.performanceStats, JSON.stringify(nextPerformanceStats));
    void AsyncStorage.setItem(
      K.allTimePerformanceStats,
      JSON.stringify(nextAllTimePerformanceStats)
    );
    void AsyncStorage.setItem(K.focusSignals, JSON.stringify(nextFocusSignals));
    void AsyncStorage.setItem(K.allTimeFocusSignals, JSON.stringify(nextAllTimeFocusSignals));
  },

  rolloverDayIfNeeded: () => {
    const key = todayKey();
    if (get().usageDateKey !== key) {
      const prevDateKey = get().usageDateKey;
      const point = makeHistoryPoint(
        prevDateKey,
        get().performanceStats,
        get().gameSeconds,
        get().focusSignals
      );
      const history = get().performanceHistory;
      const nextHistory =
        point.attempts > 0 || point.playMinutes > 0
          ? upsertHistory(history, point)
          : history;
      set({
        usageDateKey: key,
        todayUsageMs: 0,
        gameSeconds: {},
        wrongGuessCounts: {},
        performanceStats: {},
        focusSignals: {},
        performanceHistory: nextHistory,
      });
      void AsyncStorage.setItem(K.usageDate, key);
      void AsyncStorage.setItem(K.usageMs, '0');
      void AsyncStorage.setItem(K.stats, '{}');
      void AsyncStorage.setItem(K.wrongStats, '{}');
      void AsyncStorage.setItem(K.performanceStats, '{}');
      void AsyncStorage.setItem(K.focusSignals, '{}');
      void AsyncStorage.setItem(K.performanceHistory, JSON.stringify(nextHistory));
    }
  },

  bumpGameLevel: (gameId) => {
    const cur = get().gameLevels[gameId] ?? 1;
    if (cur >= MAX_GAME_LEVEL) return;
    const next = cur + 1;
    const gameLevels = { ...get().gameLevels, [gameId]: next };
    set({ gameLevels });
    void AsyncStorage.setItem(K.gameLevels, JSON.stringify(gameLevels));
  },

  resetAllGameLevels: async () => {
    const gameLevels = defaultGameLevels();
    set({ gameLevels });
    await AsyncStorage.setItem(K.gameLevels, JSON.stringify(gameLevels));
  },

  resetProgressData: async () => {
    const key = todayKey();
    set({
      usageDateKey: key,
      todayUsageMs: 0,
      gameSeconds: {},
      allTimeGameSeconds: {},
      wrongGuessCounts: {},
      performanceStats: {},
      focusSignals: {},
      allTimePerformanceStats: {},
      allTimeFocusSignals: {},
      performanceHistory: [],
    });
    await Promise.all([
      AsyncStorage.setItem(K.usageDate, key),
      AsyncStorage.setItem(K.usageMs, '0'),
      AsyncStorage.setItem(K.stats, '{}'),
      AsyncStorage.setItem(K.allTimeStats, '{}'),
      AsyncStorage.setItem(K.wrongStats, '{}'),
      AsyncStorage.setItem(K.focusSignals, '{}'),
      AsyncStorage.setItem(K.performanceStats, '{}'),
      AsyncStorage.setItem(K.allTimePerformanceStats, '{}'),
      AsyncStorage.setItem(K.allTimeFocusSignals, '{}'),
      AsyncStorage.setItem(K.performanceHistory, '[]'),
    ]);
  },
}));

export function getRestReason(
  sessionElapsedMs: number,
  todayUsageMs: number,
  sessionLimitMs: number,
  dailyLimitMs: number
): RestReason {
  if (todayUsageMs >= dailyLimitMs) return 'daily';
  if (sessionElapsedMs >= sessionLimitMs) return 'session';
  return null;
}
