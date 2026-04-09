import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalmButton } from '../components/CalmButton';
import { SoftCard } from '../components/SoftCard';
import { colors, spacing } from '../core/theme';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Parent'>;

const pad = (n: string) => n.replace(/\D/g, '').slice(0, 4);

export function ParentDashboard({ navigation }: Props) {
  const parentPin = useAppStore((s) => s.parentPin);
  const setParentPin = useAppStore((s) => s.setParentPin);
  const muted = useAppStore((s) => s.muted);
  const setMuted = useAppStore((s) => s.setMuted);
  const dailyLimitMinutes = useAppStore((s) => s.dailyLimitMinutes);
  const setDailyLimitMinutes = useAppStore((s) => s.setDailyLimitMinutes);
  const sessionLengthMinutes = useAppStore((s) => s.sessionLengthMinutes);
  const setSessionLengthMinutes = useAppStore((s) => s.setSessionLengthMinutes);
  const gameSeconds = useAppStore((s) => s.gameSeconds);
  const gameLevels = useAppStore((s) => s.gameLevels);
  const resetAllGameLevels = useAppStore((s) => s.resetAllGameLevels);

  const [pinInput, setPinInput] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupPin2, setSetupPin2] = useState('');
  const [unlocked, setUnlocked] = useState(!parentPin);

  useEffect(() => {
    setUnlocked(!parentPin);
  }, [parentPin]);

  const tryUnlock = () => {
    if (pad(pinInput) === (parentPin ?? '')) setUnlocked(true);
    setPinInput('');
  };

  const savePin = async () => {
    const a = pad(setupPin);
    const b = pad(setupPin2);
    if (a.length !== 4 || a !== b) return;
    await setParentPin(a);
    setSetupPin('');
    setSetupPin2('');
    setUnlocked(true);
  };

  const clearPin = async () => {
    await setParentPin('');
    setUnlocked(true);
  };

  const decDaily = () => void setDailyLimitMinutes(dailyLimitMinutes - 5);
  const incDaily = () => void setDailyLimitMinutes(dailyLimitMinutes + 5);
  const decSession = () =>
    void setSessionLengthMinutes(sessionLengthMinutes - 1);
  const incSession = () =>
    void setSessionLengthMinutes(sessionLengthMinutes + 1);

  if (!unlocked && parentPin) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.body}>This screen is for grown-ups.</Text>
          <TextInput
            value={pinInput}
            onChangeText={(t) => setPinInput(pad(t))}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="••••"
            style={styles.input}
            maxLength={4}
          />
          <CalmButton label="Unlock" onPress={tryUnlock} />
          <CalmButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const gameLines = Object.entries(gameSeconds).filter(([, s]) => s > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SoftCard>
          <Text style={styles.cardTitle}>Daily time limit</Text>
          <Text style={styles.body}>
            Current: {dailyLimitMinutes} minutes of gentle play per day.
          </Text>
          <View style={styles.stepRow}>
            <CalmButton
              label="−"
              variant="secondary"
              onPress={decDaily}
              style={styles.step}
            />
            <CalmButton
              label="+"
              variant="secondary"
              onPress={incDaily}
              style={styles.step}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Session length</Text>
          <Text style={styles.body}>
            A soft pause appears after about {sessionLengthMinutes} minutes in one visit.
          </Text>
          <View style={styles.stepRow}>
            <CalmButton
              label="−"
              variant="secondary"
              onPress={decSession}
              style={styles.step}
            />
            <CalmButton
              label="+"
              variant="secondary"
              onPress={incSession}
              style={styles.step}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Mute sound and haptics</Text>
              <Text style={styles.body}>Helpful in quiet spaces.</Text>
            </View>
            <Switch
              value={muted}
              onValueChange={(v) => void setMuted(v)}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={colors.surface}
            />
          </View>
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>PIN lock</Text>
          <Text style={styles.body}>
            A simple PIN keeps this page private. Stored on this device only.
          </Text>
          {parentPin ? (
            <CalmButton label="Remove PIN" variant="secondary" onPress={() => void clearPin()} />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="New PIN (4 digits)"
                keyboardType="number-pad"
                secureTextEntry
                value={setupPin}
                onChangeText={(t) => setSetupPin(pad(t))}
                maxLength={4}
              />
              <TextInput
                style={styles.input}
                placeholder="Repeat PIN"
                keyboardType="number-pad"
                secureTextEntry
                value={setupPin2}
                onChangeText={(t) => setSetupPin2(pad(t))}
                maxLength={4}
              />
              <CalmButton label="Save PIN" onPress={() => void savePin()} />
            </>
          )}
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Saved game levels</Text>
          <Text style={styles.body}>
            Each activity remembers its level on this device (up to 100). Shapes:{' '}
            {gameLevels.matching}, Colors: {gameLevels.sorting}, Patterns:{' '}
            {gameLevels.patterns}, Feelings: {gameLevels.emotions}, Sounds:{' '}
            {gameLevels.sounds}, Listen & speak: {gameLevels.echo}, Rhymes:{' '}
            {gameLevels.rhymes}, Read aloud: {gameLevels.reading}, Tagalog words:{' '}
            {gameLevels.tagalogEcho}, Tagalog read: {gameLevels.tagalogRead}.
          </Text>
          <CalmButton
            label="Reset all levels to 1"
            variant="secondary"
            onPress={() =>
              Alert.alert(
                'Reset all levels?',
                'Every activity will go back to level 1. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => void resetAllGameLevels(),
                  },
                ]
              )
            }
          />
        </SoftCard>

        <SoftCard>
          <Text style={styles.cardTitle}>Today's gentle play</Text>
          {gameLines.length === 0 ? (
            <Text style={styles.body}>No play tracked yet today.</Text>
          ) : (
            gameLines.map(([id, sec]) => (
              <Text key={id} style={styles.statLine}>
                {id}: {Math.round(sec / 60)} min
              </Text>
            ))
          )}
        </SoftCard>

        <CalmButton label="Done" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 18,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  stepRow: { flexDirection: 'row', gap: spacing.sm },
  step: { minWidth: 56, paddingHorizontal: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  statLine: { fontSize: 16, color: colors.text, marginTop: 4 },
});
