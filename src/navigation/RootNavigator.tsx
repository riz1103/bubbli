import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GAMES } from '../core/constants/games';
import { colors } from '../core/theme';
import { GameScreen } from '../screens/GameScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ParentDashboard } from '../screens/ParentDashboard';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: 18, fontWeight: '600', color: colors.text },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="Home"
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Bubbli' }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={({ route }) => ({
            title:
              GAMES.find((g) => g.id === route.params.gameId)?.title ?? 'Activity',
          })}
        />
        <Stack.Screen
          name="Parent"
          component={ParentDashboard}
          options={{ title: 'Grown-up settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
