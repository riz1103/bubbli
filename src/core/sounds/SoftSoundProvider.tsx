import { Audio } from 'expo-av';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

const SUCCESS = require('../../../assets/sounds/soft-success.wav');
const SOFT = require('../../../assets/sounds/soft-soft.wav');

type SoftSoundApi = {
  playSuccess: () => Promise<void>;
  playSoft: () => Promise<void>;
};

const SoftSoundContext = createContext<SoftSoundApi | null>(null);

export function SoftSoundProvider({ children }: { children: ReactNode }) {
  const successRef = useRef<Audio.Sound | null>(null);
  const softRef = useRef<Audio.Sound | null>(null);
  const initRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const [a, b] = await Promise.all([
          Audio.Sound.createAsync(SUCCESS, {
            volume: 0.28,
            shouldPlay: false,
            isLooping: false,
          }),
          Audio.Sound.createAsync(SOFT, {
            volume: 0.18,
            shouldPlay: false,
            isLooping: false,
          }),
        ]);

        if (cancelled) {
          await a.sound.unloadAsync();
          await b.sound.unloadAsync();
          return;
        }

        successRef.current = a.sound;
        softRef.current = b.sound;
      } catch {
        /* missing asset / native */
      }
    })();

    initRef.current = init;

    return () => {
      cancelled = true;
      initRef.current = null;
      void successRef.current?.unloadAsync();
      void softRef.current?.unloadAsync();
      successRef.current = null;
      softRef.current = null;
    };
  }, []);

  const playSuccess = useCallback(async () => {
    try {
      await initRef.current;
      const s = successRef.current;
      if (!s) return;
      await s.replayAsync();
    } catch {
      /* ignore */
    }
  }, []);

  const playSoft = useCallback(async () => {
    try {
      await initRef.current;
      const s = softRef.current;
      if (!s) return;
      await s.replayAsync();
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ playSuccess, playSoft }),
    [playSuccess, playSoft]
  );

  return (
    <SoftSoundContext.Provider value={value}>{children}</SoftSoundContext.Provider>
  );
}

export function useSoftSound(): SoftSoundApi | null {
  return useContext(SoftSoundContext);
}
