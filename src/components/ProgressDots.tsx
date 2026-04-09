import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../core/theme';

type Props = {
  total: number;
  filled: number;
  scale?: number;
};

/** Non-numeric progress — calm, predictable */
export function ProgressDots({ total, filled, scale = 1 }: Props) {
  const gap = Math.max(4, Math.round(spacing.sm * scale));
  const d = Math.max(7, Math.round(12 * scale));
  const r = d / 2;
  return (
    <View style={[styles.row, { gap }]} accessibilityRole="progressbar">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            {
              width: d,
              height: d,
              borderRadius: r,
              backgroundColor: i < filled ? colors.primary : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
