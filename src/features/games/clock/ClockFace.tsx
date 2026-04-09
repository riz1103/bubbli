import { StyleSheet, View } from 'react-native';
import { colors } from '../../../core/theme';

type Props = {
  hour: number; // 1–12
  minute: number; // 0–59
  size: number;
};

/**
 * Analog face with Views only. Each hand’s pivot is the bottom-center of the hand (clock center).
 */
export function ClockFace({ hour, minute, size }: Props) {
  const r = size / 2;
  const minLen = r * 0.78;
  const hourLen = r * 0.52;
  const h = hour % 12;
  const hourDeg = (h + minute / 60) * 30;
  const minDeg = minute * 6;
  const handW = Math.max(4, size * 0.028);
  const minW = Math.max(2.5, size * 0.018);
  const dot = Math.max(8, size * 0.07);

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityLabel="Analog clock face"
    >
      <View style={[styles.face, { width: size, height: size, borderRadius: r }]} />

      <View
        style={[
          styles.hand,
          {
            left: r - handW / 2,
            top: r - hourLen,
            width: handW,
            height: hourLen,
            backgroundColor: colors.primary,
            transform: [{ rotate: `${hourDeg}deg` }],
            transformOrigin: '50% 100%',
          },
        ]}
      />

      <View
        style={[
          styles.hand,
          {
            left: r - minW / 2,
            top: r - minLen,
            width: minW,
            height: minLen,
            backgroundColor: colors.text,
            transform: [{ rotate: `${minDeg}deg` }],
            transformOrigin: '50% 100%',
          },
        ]}
      />

      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            left: r - dot / 2,
            top: r - dot / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  face: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  hand: {
    position: 'absolute',
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    backgroundColor: colors.text,
  },
});
