import { useCallback, useEffect, useRef, useState } from 'react';
import { randomCompliment } from '../core/constants/compliments';

const DISPLAY_MS = 2600;

/** Shows a rotating calm line briefly after success — no points, no streaks */
export function useCalmCompliment() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const show = useCallback(() => {
    setMessage(randomCompliment());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, DISPLAY_MS);
  }, []);

  return { message, showCompliment: show };
}
