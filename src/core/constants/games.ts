export type GameId =
  | 'matching'
  | 'sorting'
  | 'patterns'
  | 'emotions'
  | 'sounds'
  | 'echo'
  | 'rhymes'
  | 'reading'
  | 'clock'
  | 'tagalogEcho'
  | 'tagalogRead';

export type GameMeta = {
  id: GameId;
  title: string;
  subtitle: string;
  emoji: string;
  available: boolean;
};

export const GAMES: GameMeta[] = [
  {
    id: 'matching',
    title: 'Shape matching',
    subtitle: 'Drag each shape to its outline',
    emoji: '◇',
    available: true,
  },
  {
    id: 'sorting',
    title: 'Color sorting',
    subtitle: 'Place items in matching bins',
    emoji: '◐',
    available: true,
  },
  {
    id: 'patterns',
    title: 'Patterns',
    subtitle: 'What comes next?',
    emoji: '◎',
    available: true,
  },
  {
    id: 'emotions',
    title: 'Feelings',
    subtitle: 'Match faces to words',
    emoji: '☺',
    available: true,
  },
  {
    id: 'sounds',
    title: 'Sounds',
    subtitle: 'Compare chimes from a pool of 50',
    emoji: '♪',
    available: true,
  },
  {
    id: 'echo',
    title: 'Listen & speak',
    subtitle: 'Hear a word, then say it out loud',
    emoji: '✦',
    available: true,
  },
  {
    id: 'rhymes',
    title: 'Rhyme time',
    subtitle: 'Find the word that rhymes',
    emoji: '※',
    available: true,
  },
  {
    id: 'reading',
    title: 'Read aloud',
    subtitle: 'Read sentences — mic listens when you want',
    emoji: '◈',
    available: true,
  },
  {
    id: 'clock',
    title: 'Clock fun',
    subtitle: 'Read the time — then set the hands',
    emoji: '🕐',
    available: true,
  },
  {
    id: 'tagalogEcho',
    title: 'Tagalog salita',
    subtitle: 'Themed words — listen, say, play',
    emoji: '✳',
    available: true,
  },
  {
    id: 'tagalogRead',
    title: 'Tagalog basahan',
    subtitle: 'Read Filipino sentences aloud',
    emoji: '▤',
    available: true,
  },
];
