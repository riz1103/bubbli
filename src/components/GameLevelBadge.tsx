import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../core/theme';

type Props = {
  level: number;
  /** Short line under the number, e.g. "Three shapes this level" */
  subtitle: string;
  /** From useResponsiveGameScale — shrinks on small screens */
  scale?: number;
};

export function GameLevelBadge({ level, subtitle, scale = 1 }: Props) {
  const padV = Math.max(8, Math.round(spacing.md * scale));
  const padH = Math.max(12, Math.round(spacing.xl * scale));
  const minW = Math.max(120, Math.round(160 * scale));
  const labelSize = Math.max(10, Math.round(12 * scale));
  const numSize = Math.max(26, Math.round(36 * scale));
  const subSize = Math.max(11, Math.round(13 * scale));
  const radius = Math.max(16, Math.round(22 * scale));

  return (
    <View
      style={[
        styles.badge,
        {
          paddingVertical: padV,
          paddingHorizontal: padH,
          minWidth: minW,
          borderRadius: radius,
        },
      ]}
      accessibilityRole="header"
    >
      <Text style={[styles.label, { fontSize: labelSize }]}>Level</Text>
      <Text style={[styles.number, { fontSize: numSize, lineHeight: numSize + 6 }]}>
        {level}
      </Text>
      <Text style={[styles.sub, { fontSize: subSize }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#2A4038',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  number: {
    fontWeight: '800',
    color: colors.text,
    marginVertical: 2,
  },
  sub: {
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
