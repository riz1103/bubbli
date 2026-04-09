import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../core/theme';

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  onPress: () => void;
  disabled?: boolean;
};

export function GameCard({
  title,
  subtitle,
  emoji,
  onPress,
  disabled,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrap,
        pressed && !disabled && styles.pressed,
        disabled && styles.muted,
      ]}
    >
      <Text style={styles.emoji} accessible={false}>
        {emoji}
      </Text>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  pressed: { opacity: 0.9 },
  muted: { opacity: 0.45 },
  emoji: { fontSize: 28, width: 40, textAlign: 'center' },
  textCol: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
