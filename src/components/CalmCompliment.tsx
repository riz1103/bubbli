import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../core/theme';

type Props = {
  message: string | null;
  /**
   * overlay: floats above the bottom so it does not push the board (default in games).
   * inline: takes space in the layout (legacy).
   */
  layout?: 'overlay' | 'inline';
  /** From useResponsiveGameScale — keeps the banner readable on small screens */
  scale?: number;
};

/** Soft acknowledgment — not a popup, no flash animation */
export function CalmCompliment({
  message,
  layout = 'overlay',
  scale = 1,
}: Props) {
  if (!message) return null;

  const padV = Math.max(4, Math.round(spacing.sm * scale));
  const padH = Math.max(8, Math.round(spacing.md * scale));
  const fontSize = Math.max(12, Math.round(16 * scale));
  const radius = Math.max(10, Math.round(radii.md * scale));

  const bubble = (
    <View
      style={[
        styles.wrap,
        {
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: radius,
        },
      ]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { fontSize }]}>{message}</Text>
    </View>
  );

  if (layout === 'inline') {
    return bubble;
  }

  return (
    <View
      style={[styles.overlay, { bottom: Math.max(48, Math.round(54 * scale)) }]}
      pointerEvents="none"
    >
      {bubble}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '96%',
  },
  text: {
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    elevation: 12,
    alignItems: 'center',
  },
});
