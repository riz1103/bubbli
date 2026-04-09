import type { GameId } from './games';

export const MAX_GAME_LEVEL = 100;

/** Games that track a saved level */
export const LEVEL_GAME_IDS: readonly GameId[] = [
  'matching',
  'sorting',
  'patterns',
  'emotions',
  'sounds',
  'echo',
  'rhymes',
  'reading',
  'clock',
  'tagalogEcho',
  'tagalogRead',
] as const;

export type LevelGameId = (typeof LEVEL_GAME_IDS)[number];

export function defaultGameLevels(): Record<LevelGameId, number> {
  return {
    matching: 1,
    sorting: 1,
    patterns: 1,
    emotions: 1,
    sounds: 1,
    echo: 1,
    rhymes: 1,
    reading: 1,
    clock: 1,
    tagalogEcho: 1,
    tagalogRead: 1,
  };
}

export function parseStoredGameLevels(
  json: string | null
): Record<LevelGameId, number> {
  const base = defaultGameLevels();
  if (!json) return base;
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    for (const id of LEVEL_GAME_IDS) {
      const v = o[id];
      if (typeof v === 'number' && Number.isFinite(v)) {
        const n = Math.floor(v);
        if (n >= 1 && n <= MAX_GAME_LEVEL) base[id] = n;
      }
    }
  } catch {
    /* keep defaults */
  }
  return base;
}
