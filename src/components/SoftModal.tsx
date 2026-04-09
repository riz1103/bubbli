import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../core/theme';
import { CalmButton } from './CalmButton';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/** No harsh popups — soft card over dimmed backdrop */
export function SoftModal({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onPrimary}
    >
      <Pressable style={styles.backdrop} onPress={onPrimary}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>
          <View style={styles.actions}>
            {secondaryLabel && onSecondary ? (
              <CalmButton
                label={secondaryLabel}
                variant="secondary"
                onPress={onSecondary}
                style={styles.btn}
              />
            ) : null}
            <CalmButton label={primaryLabel} onPress={onPrimary} style={styles.btn} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61, 79, 76, 0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  msg: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  actions: { gap: spacing.sm },
  btn: { alignSelf: 'stretch' },
});
