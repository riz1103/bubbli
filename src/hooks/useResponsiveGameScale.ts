import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Baseline layout (~iPhone 12/13 logical points). Shorter/narrower screens scale down. */
const REF_H = 844;
const REF_W = 390;

export type ResponsiveGameScale = {
  /** 0.62–1 — multiply layout that should shrink on small devices */
  scale: number;
  /** Scaled spacing (rounded, min 0) */
  g: (n: number) => number;
  /** Scaled font/icon size with a readable floor */
  fs: (n: number) => number;
  width: number;
  height: number;
};

export function useResponsiveGameScale(): ResponsiveGameScale {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const sh = height / REF_H;
    const sw = width / REF_W;
    const scale = Math.min(1, Math.max(0.62, Math.min(sh, sw)));
    const g = (n: number) => Math.max(0, Math.round(n * scale));
    const fs = (n: number) => Math.max(11, Math.round(n * scale));
    return { scale, g, fs, width, height };
  }, [width, height]);
}
