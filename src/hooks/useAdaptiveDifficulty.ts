import { useCallback, useRef, useState } from 'react';

const MAX_TIER = 4;
const MIN_TIER = 1;

/**
 * Increases complexity slowly; drops tier after mistakes (not stressful).
 */
export function useAdaptiveDifficulty() {
  const [tier, setTier] = useState(MIN_TIER);
  const correctStreak = useRef(0);

  const noteWrong = useCallback(() => {
    correctStreak.current = 0;
    setTier((t) => Math.max(MIN_TIER, t - 1));
  }, []);

  const noteCorrect = useCallback(() => {
    correctStreak.current += 1;
    if (correctStreak.current >= 2) {
      correctStreak.current = 0;
      setTier((t) => Math.min(MAX_TIER, t + 1));
    }
  }, []);

  return { tier, noteWrong, noteCorrect };
}
