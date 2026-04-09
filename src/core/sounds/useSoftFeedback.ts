import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { useSoftSound } from './SoftSoundProvider';

/**
 * Gentle feedback: soft chimes + light haptics. Respects parent mute.
 * Sounds run through SoftSoundProvider (expo-av Audio.Sound).
 */
export function useSoftFeedback() {
  const muted = useAppStore((s) => s.muted);
  const sound = useSoftSound();

  const playSuccess = useCallback(async () => {
    if (muted) return;
    try {
      await sound?.playSuccess();
    } catch {
      /* ignore */
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* ignore */
    }
  }, [muted, sound]);

  const playSoft = useCallback(async () => {
    if (muted) return;
    try {
      await sound?.playSoft();
    } catch {
      /* ignore */
    }
    try {
      await Haptics.selectionAsync();
    } catch {
      /* ignore */
    }
  }, [muted, sound]);

  return { playSuccess, playSoft };
}
