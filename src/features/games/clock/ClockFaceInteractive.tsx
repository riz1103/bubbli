import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { ClockFace } from './ClockFace';

type Props = {
  hour: number;
  minute: number;
  size: number;
  allowedMinutes: number[];
  numberLabels?: 'none' | 'quarter' | 'full';
  onTimeChange: (next: { h: number; m: number }) => void;
};

function angleFrom12(dx: number, dy: number): number {
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

function circDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function snapHour(deg: number): number {
  let h = Math.round(deg / 30) % 12;
  if (h === 0) h = 12;
  return h;
}

function snapMinute(deg: number, allowed: number[]): number {
  const raw = ((Math.round(deg / 6) % 60) + 60) % 60;
  let best = allowed[0] ?? 0;
  let bestD = 999;
  for (const a of allowed) {
    const d = Math.min((raw - a + 60) % 60, (a - raw + 60) % 60);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

function touchAngle(e: { nativeEvent: { locationX: number; locationY: number } }, size: number) {
  const { locationX, locationY } = e.nativeEvent;
  const dx = locationX - size / 2;
  const dy = locationY - size / 2;
  return angleFrom12(dx, dy);
}

/**
 * Drag layer on top of ClockFace: pick the nearer hand at touch start; drag to set time (no number keys).
 */
export function ClockFaceInteractive({
  hour,
  minute,
  size,
  allowedMinutes,
  numberLabels = 'none',
  onTimeChange,
}: Props) {
  const wrapRef = useRef<View>(null);
  const dragKindRef = useRef<'hour' | 'minute' | null>(null);
  const lastEmitRef = useRef<{ h: number; m: number } | null>(null);

  const stateRef = useRef({
    hour,
    minute,
    size,
    allowedMinutes,
    onTimeChange,
  });
  stateRef.current = { hour, minute, size, allowedMinutes, onTimeChange };

  useEffect(() => {
    lastEmitRef.current = null;
  }, [hour, minute]);

  const emit = (next: { h: number; m: number }) => {
    const prev = lastEmitRef.current;
    if (prev && prev.h === next.h && prev.m === next.m) return;
    lastEmitRef.current = next;
    stateRef.current.onTimeChange(next);
    void Haptics.selectionAsync().catch(() => {});
  };

  const panRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (e) => {
        const { hour: h0, minute: m0, allowedMinutes: allowed, size: sz } = stateRef.current;
        const T = touchAngle(e, sz);
        const hourDeg = ((h0 % 12) + m0 / 60) * 30;
        const minDeg = m0 * 6;
        dragKindRef.current = circDist(T, hourDeg) <= circDist(T, minDeg) ? 'hour' : 'minute';

        const wholeHourOnly = allowed.length === 1 && allowed[0] === 0;

        if (dragKindRef.current === 'hour') {
          const h = snapHour(T);
          emit({ h, m: wholeHourOnly ? 0 : m0 });
        } else {
          emit({ h: h0, m: snapMinute(T, allowed) });
        }
      },

      onPanResponderMove: (e) => {
        const T = touchAngle(e, stateRef.current.size);
        const { hour: h0, minute: m0, allowedMinutes: allowed } = stateRef.current;
        const wholeHourOnly = allowed.length === 1 && allowed[0] === 0;
        const kind = dragKindRef.current;
        if (kind === 'hour') {
          const h = snapHour(T);
          emit({ h, m: wholeHourOnly ? 0 : m0 });
        } else if (kind === 'minute') {
          emit({ h: h0, m: snapMinute(T, allowed) });
        }
      },

      onPanResponderRelease: () => {
        dragKindRef.current = null;
      },
      onPanResponderTerminate: () => {
        dragKindRef.current = null;
      },
    })
  );

  return (
    <View
      ref={wrapRef}
      style={[styles.wrap, { width: size, height: size }]}
      collapsable={false}
    >
      <ClockFace
        hour={hour}
        minute={minute}
        size={size}
        numberLabels={numberLabels}
      />
      <View
        style={[StyleSheet.absoluteFill, styles.dragLayer]}
        accessibilityLabel="Drag the short hand to set the hour or the long hand to set the minutes"
        accessibilityRole="adjustable"
        {...panRef.current.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  dragLayer: {
    zIndex: 10,
    backgroundColor: 'transparent',
  },
});

