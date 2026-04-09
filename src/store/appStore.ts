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
  gameLevels: '@bubbli/gameLevels',
} as const;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

type Stats = Record<string, number>;

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
  /** Saved level per activity (1–100), persisted */
  gameLevels: Record<LevelGameId, number>;

  hydrate: () => Promise<void>;
  setMuted: (v: boolean) => Promise<void>;
  setParentPin: (pin: string) => Promise<void>;
  setDailyLimitMinutes: (m: number) => Promise<void>;
  setSessionLengthMinutes: (m: number) => Promise<void>;
  addPlaytime: (gameId: string, deltaMs: number) => void;
  /** Call when calendar day changes */
  rolloverDayIfNeeded: () => void;
  bumpGameLevel: (gameId: LevelGameId) => void;
  resetAllGameLevels: () => Promise<void>;
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
  gameLevels: defaultGameLevels(),

  hydrate: async () => {
    try {
      const [pin, muted, dailyMin, sessionMin, usageDate, usageMs, statsJson, levelsJson] =
        await Promise.all([
          AsyncStorage.getItem(K.pin),
          AsyncStorage.getItem(K.muted),
          AsyncStorage.getItem(K.dailyMin),
          AsyncStorage.getItem(K.sessionMin),
          AsyncStorage.getItem(K.usageDate),
          AsyncStorage.getItem(K.usageMs),
          AsyncStorage.getItem(K.stats),
          AsyncStorage.getItem(K.gameLevels),
        ]);
      const key = todayKey();
      const storedDate = usageDate ?? key;
      const sameDay = storedDate === key;
      let todayMs = 0;
      let stats: Stats = {};
      if (sameDay) {
        todayMs = usageMs ? parseInt(usageMs, 10) || 0 : 0;
        stats = statsJson ? (JSON.parse(statsJson) as Stats) : {};
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
    const { todayUsageMs, gameSeconds } = get();
    const nextStats = { ...gameSeconds };
    nextStats[gameId] = (nextStats[gameId] ?? 0) + deltaMs / 1000;
    set({
      todayUsageMs: todayUsageMs + deltaMs,
      gameSeconds: nextStats,
    });
    const key = get().usageDateKey;
    void AsyncStorage.setItem(K.usageMs, String(get().todayUsageMs));
    void AsyncStorage.setItem(K.usageDate, key);
    void AsyncStorage.setItem(K.stats, JSON.stringify(get().gameSeconds));
  },

  rolloverDayIfNeeded: () => {
    const key = todayKey();
    if (get().usageDateKey !== key) {
      set({
        usageDateKey: key,
        todayUsageMs: 0,
        gameSeconds: {},
      });
      void AsyncStorage.setItem(K.usageDate, key);
      void AsyncStorage.setItem(K.usageMs, '0');
      void AsyncStorage.setItem(K.stats, '{}');
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
