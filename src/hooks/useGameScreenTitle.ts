import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';

export function useGameScreenTitle(title: string) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);
}
