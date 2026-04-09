import { GameId } from '../core/constants/games';

export type RootStackParamList = {
  Home: undefined;
  Game: { gameId: GameId };
  Parent: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
