import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { CalmButton } from '../../../components/CalmButton';
import { CalmCompliment } from '../../../components/CalmCompliment';
import { GameLevelBadge } from '../../../components/GameLevelBadge';
import { ProgressDots } from '../../../components/ProgressDots';
import { SoftCard } from '../../../components/SoftCard';
import { colors } from '../../../core/theme';
import { useSoftFeedback } from '../../../core/sounds/useSoftFeedback';
import { useAdaptiveDifficulty } from '../../../hooks/useAdaptiveDifficulty';
import { useCalmCompliment } from '../../../hooks/useCalmCompliment';
import { useGameScreenTitle } from '../../../hooks/useGameScreenTitle';
import { useResponsiveGameScale } from '../../../hooks/useResponsiveGameScale';
import { useAppStore } from '../../../store/appStore';

export type BinColor = 'rose' | 'sky' | 'butter';

/**
 * Same hue per column: tray = very light wash, dot = clearly the same color, just deeper
 * so it stays visible on white — not two different “themes.”
 */
const SORT_PAIR: Record<BinColor, { bin: string; dot: string }> = {
  rose: { bin: '#F0D4D8', dot: '#E38FA3' },
  sky: { bin: '#D0E4F2', dot: '#6DB6E8' },
  butter: { bin: '#F2ECD0', dot: '#E5D48A' },
};

/** Tray backgrounds (kept for clarity + compatibility with older bundles referencing this name) */
const BIN_FILL: Record<BinColor, string> = {
  rose: SORT_PAIR.rose.bin,
  sky: SORT_PAIR.sky.bin,
  butter: SORT_PAIR.butter.bin,
};

const ITEM_DOT: Record<BinColor, string> = {
  rose: SORT_PAIR.rose.dot,
  sky: SORT_PAIR.sky.dot,
  butter: SORT_PAIR.butter.dot,
};

const BINS: BinColor[] = ['rose', 'sky', 'butter'];

type Item = { id: string; color: BinColor };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dotsPerColor(level: number): number {
  if (level >= 67) return 4;
  if (level >= 34) return 3;
  return 2;
}

function makeItems(level: number): Item[] {
  const n = dotsPerColor(level);
  const items: Item[] = [];
  BINS.forEach((c) => {
    for (let i = 1; i <= n; i++) {
      items.push({ id: `${c}-${i}`, color: c });
    }
  });
  return shuffle(items);
}

export function ColorSortingGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { tier, noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const level = useAppStore((s) => s.gameLevels.sorting ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Colors · Level ${level}`);

  const [items, setItems] = useState<Item[]>(() =>
    makeItems(useAppStore.getState().gameLevels.sorting ?? 1)
  );
  const [roundId, setRoundId] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const binLayouts = useRef<{ x: number; y: number; w: number; h: number }[]>(
    []
  );
  const binRefs = useRef<(View | null)[]>([]);

  const snapDist = useMemo(() => {
    const base = Math.max(50, 88 - tier * 10 - Math.min(level, 50) * 0.55);
    return Math.max(36, base * scale);
  }, [tier, level, scale]);

  const filled = doneIds.size;
  const perColor = dotsPerColor(level);

  const binOrder = useMemo(
    () => shuffle([...BINS] as BinColor[]),
    [level, roundId]
  );

  const resetRound = useCallback(() => {
    const lv = useAppStore.getState().gameLevels.sorting ?? 1;
    setDoneIds(new Set());
    setItems(makeItems(lv));
    setRoundId((n) => n + 1);
  }, []);

  const measureBins = useCallback(() => {
    binRefs.current.forEach((node, i) => {
      node?.measureInWindow((x, y, w, h) => {
        binLayouts.current[i] = { x, y, w, h };
      });
    });
  }, []);

  const hitBin = useCallback(
    (color: BinColor, pageX: number, pageY: number) => {
      const binIndex = binOrder.indexOf(color);
      const L = binLayouts.current[binIndex];
      if (!L) return false;
      const cx = L.x + L.w / 2;
      const cy = L.y + L.h / 2;
      return Math.hypot(pageX - cx, pageY - cy) < snapDist;
    },
    [binOrder, snapDist]
  );

  const onGoodDrop = useCallback(
    (item: Item) => {
      void playSuccess();
      showCompliment();
      noteCorrect();
      setDoneIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        if (next.size >= items.length) {
          setTimeout(() => {
            bumpGameLevel('sorting');
            resetRound();
          }, 1200);
        }
        return next;
      });
    },
    [bumpGameLevel, items.length, noteCorrect, playSuccess, resetRound, showCompliment]
  );

  const dotSize = Math.max(32, g(44));
  const dotR = dotSize / 2;
  const dotGap = Math.max(40, g(56));
  const binMinH = Math.max(64, g(100));
  const binRadius = Math.max(10, g(14));

  const DraggableDot = ({ item }: { item: Item }) => {
    const pan = useRef(new Animated.ValueXY()).current;

    const responder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            measureBins();
            pan.extractOffset();
          },
          onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          ),
          onPanResponderRelease: (_, g) => {
            pan.flattenOffset();
            const ok = hitBin(item.color, g.moveX, g.moveY);
            if (ok) {
              pan.setValue({ x: 0, y: 0 });
              onGoodDrop(item);
            } else {
              noteWrong();
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                friction: 7,
                tension: 80,
                useNativeDriver: false,
              }).start();
            }
          },
        }),
      [hitBin, item, measureBins, noteWrong, onGoodDrop, pan]
    );

    return (
      <Animated.View
        style={[
          styles.dotWrap,
          { padding: g(6), transform: pan.getTranslateTransform() },
        ]}
        {...responder.panHandlers}
      >
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotR,
              backgroundColor: ITEM_DOT[item.color],
            },
          ]}
        />
      </Animated.View>
    );
  };

  const levelSubtitle =
    perColor === 2
      ? 'Two dots per color'
      : perColor === 3
        ? 'Three dots per color'
        : 'Four dots per color';

  return (
    <View style={[styles.root, { gap: g(16) }]}>
      <GameLevelBadge level={level} scale={scale} subtitle={levelSubtitle} />
      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        Drag each dot into the matching bin
      </Text>
      <Text style={[styles.sub, { fontSize: fs(14) }]}>
        Clear all dots to go up a level. No timer. No penalties.
      </Text>
      <ProgressDots total={items.length} filled={filled} scale={scale} />

      <SoftCard style={{ padding: g(16) }}>
        <Text style={[styles.poolLabel, { fontSize: fs(14), marginBottom: g(12) }]}>
          Dots
        </Text>
        <View style={[styles.dotRow, { gap: g(16), minHeight: g(56) }]}>
          {items.map((item) =>
            doneIds.has(item.id) ? (
              <View key={`${item.id}-${roundId}`} style={{ width: dotGap, height: dotGap }} />
            ) : (
              <DraggableDot key={`${item.id}-${roundId}`} item={item} />
            )
          )}
        </View>
      </SoftCard>

      <View style={[styles.binRow, { gap: g(12), marginTop: g(16) }]}>
        {binOrder.map((b, i) => (
          <View
            key={`${b}-${roundId}`}
            ref={(r) => {
              binRefs.current[i] = r;
            }}
            onLayout={() => {
              binRefs.current[i]?.measureInWindow((x, y, w, h) => {
                binLayouts.current[i] = { x, y, w, h };
              });
            }}
            style={[
              styles.bin,
              {
                minHeight: binMinH,
                borderRadius: binRadius,
                backgroundColor: BIN_FILL[b],
              },
            ]}
            accessibilityLabel={`${b} bin`}
            collapsable={false}
          >
            <Text style={[styles.binHint, { fontSize: fs(14) }]}>Here</Text>
          </View>
        ))}
      </View>

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', position: 'relative' },
  heading: { color: colors.text, textAlign: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center' },
  poolLabel: { color: colors.textMuted },
  dotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dotWrap: {},
  dot: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  binRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bin: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  binHint: { color: colors.textMuted, fontWeight: '600' },
});
