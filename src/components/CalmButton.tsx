import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../core/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
};

export function CalmButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: Props) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surface
        : 'transparent';
  const border =
    variant === 'secondary' ? { borderWidth: 1, borderColor: colors.border } : {};
  const textColor =
    variant === 'primary' ? '#F8FCFB' : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg },
        border,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 17, fontWeight: '600' },
});
