import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
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

export type ShapeKind =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon';

const BASE_SHAPES: ShapeKind[] = ['circle', 'square', 'triangle'];

/** Calm ramp: level milestones add one new shape at a time. */
const DIAMOND_FROM_LEVEL = 3;
const PENTAGON_FROM_LEVEL = 6;
const HEXAGON_FROM_LEVEL = 9;

function shapesForLevel(level: number): ShapeKind[] {
  const shapes = [...BASE_SHAPES];
  if (level >= DIAMOND_FROM_LEVEL) {
    shapes.push('diamond');
  }
  if (level >= PENTAGON_FROM_LEVEL) {
    shapes.push('pentagon');
  }
  if (level >= HEXAGON_FROM_LEVEL) {
    shapes.push('hexagon');
  }
  return shapes;
}

function emptyPlaced(order: ShapeKind[]): Record<ShapeKind, boolean> {
  const o: Record<ShapeKind, boolean> = {
    circle: false,
    square: false,
    triangle: false,
    diamond: false,
    pentagon: false,
    hexagon: false,
  };
  order.forEach((k) => {
    o[k] = false;
  });
  return o;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SHAPE_COLOR = colors.primary;

function ShapeGlyph({
  kind,
  outline,
  size,
}: {
  kind: ShapeKind;
  outline: boolean;
  size: number;
}) {
  const s = size;
  const half = s / 2;
  const stroke = outline ? SHAPE_COLOR : 'none';
  const fill = outline ? 'transparent' : SHAPE_COLOR;
  const sw = Math.max(2, Math.round(3 * (size / 64)));
  if (kind === 'circle') {
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Circle
          cx={half}
          cy={half}
          r={half - 8}
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
          opacity={outline ? 1 : 0.85}
        />
      </Svg>
    );
  }
  if (kind === 'square') {
    const pad = 10;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Rect
          x={pad}
          y={pad}
          width={s - pad * 2}
          height={s - pad * 2}
          rx={4}
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
          opacity={outline ? 1 : 0.85}
        />
      </Svg>
    );
  }
  if (kind === 'diamond') {
    const pts = `${half},${10} ${s - 10},${half} ${half},${s - 10} ${10},${half}`;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Polygon
          points={pts}
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
          opacity={outline ? 1 : 0.85}
        />
      </Svg>
    );
  }
  if (kind === 'pentagon') {
    const pts = `${half},${9} ${s - 10},${s * 0.38} ${s * 0.78},${s - 10} ${s * 0.22},${s - 10} ${10},${s * 0.38}`;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Polygon
          points={pts}
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
          opacity={outline ? 1 : 0.85}
        />
      </Svg>
    );
  }
  if (kind === 'hexagon') {
    const pts = `${s * 0.28},${10} ${s * 0.72},${10} ${s - 10},${half} ${s * 0.72},${s - 10} ${s * 0.28},${s - 10} ${10},${half}`;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Polygon
          points={pts}
          stroke={stroke}
          strokeWidth={sw}
          fill={fill}
          opacity={outline ? 1 : 0.85}
        />
      </Svg>
    );
  }
  const points = `${half},${12} ${s - 10},${s - 10} ${10},${s - 10}`;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Polygon
        points={points}
        stroke={stroke}
        strokeWidth={sw}
        fill={fill}
        opacity={outline ? 1 : 0.85}
      />
    </Svg>
  );
}

function Slot({
  kind,
  filled,
  hint,
  shapeSize,
  slotPad,
  slotRadius,
}: {
  kind: ShapeKind;
  filled: boolean;
  hint: boolean;
  shapeSize: number;
  slotPad: number;
  slotRadius: number;
}) {
  const label = kind;
  const box = shapeSize + slotPad;
  return (
    <View
      style={[
        styles.slot,
        hint && styles.slotHint,
        { width: box, height: box, borderRadius: slotRadius },
      ]}
      accessibilityLabel={`Place the ${label} here`}
    >
      {filled ? (
        <ShapeGlyph kind={kind} outline={false} size={shapeSize} />
      ) : (
        <ShapeGlyph kind={kind} outline size={shapeSize} />
      )}
    </View>
  );
}

function initialMatchingState() {
  const lv = useAppStore.getState().gameLevels.matching ?? 1;
  const o = shapesForLevel(lv);
  return { pool: shuffle([...o]), placed: emptyPlaced(o) };
}

export function ShapeMatchingGame({ onBack }: { onBack: () => void }) {
  const { scale, g, fs } = useResponsiveGameScale();
  const { tier, noteCorrect, noteWrong } = useAdaptiveDifficulty();
  const { playSuccess } = useSoftFeedback();
  const { message: compliment, showCompliment } = useCalmCompliment();
  const level = useAppStore((s) => s.gameLevels.matching ?? 1);
  const bumpGameLevel = useAppStore((s) => s.bumpGameLevel);

  useGameScreenTitle(`Shapes · Level ${level}`);

  const shapeSize = Math.max(44, g(64));
  const slotPad = g(28);
  const slotRadius = Math.max(10, g(14));
  const ghost = shapeSize + g(16);

  const order = useMemo(() => shuffle([...shapesForLevel(level)]), [level]);

  const [pool, setPool] = useState<ShapeKind[]>(
    () => initialMatchingState().pool
  );
  const [roundId, setRoundId] = useState(0);
  const [placed, setPlaced] = useState<Record<ShapeKind, boolean>>(
    () => initialMatchingState().placed
  );
  const [hintKind, setHintKind] = useState<ShapeKind | null>(null);

  const slotLayouts = useRef<{ x: number; y: number; w: number; h: number }[]>(
    []
  );
  const slotRefs = useRef<(View | null)[]>([]);
  const placedRef = useRef(placed);
  placedRef.current = placed;

  /** Tighter drop zone as levels rise; adaptive tier still helps if it gets tricky */
  const snapDist = useMemo(() => {
    const base = 96 - tier * 11;
    const levelTighten = Math.min(level, 50) * 0.5 + Math.max(0, level - 50) * 0.2;
    return Math.max(36, (Math.max(44, base - levelTighten)) * scale);
  }, [tier, level, scale]);

  const placedCount = order.filter((k) => placed[k]).length;
  const totalShapes = order.length;

  useEffect(() => {
    setPlaced(emptyPlaced(order));
    setPool(shuffle([...order]));
    setRoundId((n) => n + 1);
    setHintKind(null);
  }, [order]);

  const measureSlots = useCallback(() => {
    slotRefs.current.forEach((node, i) => {
      node?.measureInWindow((x, y, w, h) => {
        slotLayouts.current[i] = { x, y, w, h };
      });
    });
  }, []);

  const hitTest = useCallback(
    (kind: ShapeKind, pageX: number, pageY: number) => {
      const p = placedRef.current;
      if (p[kind]) return false;
      for (let i = 0; i < order.length; i++) {
        const slotKind = order[i];
        if (slotKind !== kind || p[slotKind]) continue;
        const L = slotLayouts.current[i];
        if (!L) continue;
        const cx = L.x + L.w / 2;
        const cy = L.y + L.h / 2;
        if (Math.hypot(pageX - cx, pageY - cy) < snapDist) return true;
      }
      return false;
    },
    [order, snapDist]
  );

  const onGoodDrop = useCallback(
    (kind: ShapeKind) => {
      void playSuccess();
      showCompliment();
      noteCorrect();
      setPlaced((prev) => {
        const next = { ...prev, [kind]: true };
        if (order.every((k) => next[k])) {
          setTimeout(() => bumpGameLevel('matching'), 1400);
        }
        return next;
      });
    },
    [bumpGameLevel, noteCorrect, order, playSuccess, showCompliment]
  );

  const Draggable = ({ kind }: { kind: ShapeKind }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [lifting, setLifting] = useState(false);

    const responder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            setLifting(true);
            measureSlots();
            pan.extractOffset();
          },
          onPanResponderMove: Animated.event(
            [null, { dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          ),
          onPanResponderRelease: (_, g) => {
            setLifting(false);
            pan.flattenOffset();
            const ok = hitTest(kind, g.moveX, g.moveY);
            if (ok) {
              pan.setValue({ x: 0, y: 0 });
              onGoodDrop(kind);
            } else {
              noteWrong();
              setHintKind(kind);
              setTimeout(() => setHintKind(null), 1500);
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                friction: 7,
                tension: 80,
                useNativeDriver: false,
              }).start();
            }
          },
        }),
      [hitTest, kind, measureSlots, noteWrong, onGoodDrop, pan]
    );

    const liftStyle: ViewStyle = lifting
      ? { zIndex: 50, elevation: 50 }
      : { zIndex: 1, elevation: 1 };

    return (
      <Animated.View
        style={[
          styles.draggable,
          liftStyle,
          { padding: g(8), transform: pan.getTranslateTransform() },
        ]}
        {...responder.panHandlers}
      >
        <ShapeGlyph kind={kind} outline={false} size={shapeSize} />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.root, { gap: g(16) }]}>
      <GameLevelBadge
        level={level}
        scale={scale}
        subtitle={`${totalShapes} shapes this level`}
      />

      <Text style={[styles.heading, { fontSize: fs(18) }]}>
        Drag each shape to its outline
      </Text>
      <Text style={[styles.levelSub, { fontSize: fs(13) }]}>
        When every shape is matched, you move up one level. No timer.
      </Text>

      <ProgressDots total={totalShapes} filled={placedCount} scale={scale} />

      <SoftCard style={{ ...styles.poolCard, padding: g(16), marginTop: g(12) }}>
        <Text style={[styles.poolLabel, { fontSize: fs(14), marginBottom: g(12) }]}>
          Shapes
        </Text>
        <View style={[styles.poolRow, { minHeight: shapeSize + g(16), rowGap: g(12) }]}>
          {pool.map((k) =>
            placed[k] ? (
              <View
                key={`${k}-${roundId}`}
                style={{ width: ghost, height: ghost }}
              />
            ) : (
              <Draggable key={`${k}-${roundId}`} kind={k} />
            )
          )}
        </View>
      </SoftCard>

      <View style={[styles.slotRow, { marginTop: g(24), rowGap: g(12) }]} collapsable={false}>
        {order.map((k, i) => (
          <View
            key={k}
            ref={(r) => {
              slotRefs.current[i] = r;
            }}
            onLayout={() => {
              slotRefs.current[i]?.measureInWindow((x, y, w, h) => {
                slotLayouts.current[i] = { x, y, w, h };
              });
            }}
            collapsable={false}
          >
            <Slot
              kind={k}
              filled={!!placed[k]}
              hint={hintKind === k && !placed[k]}
              shapeSize={shapeSize}
              slotPad={slotPad}
              slotRadius={slotRadius}
            />
          </View>
        ))}
      </View>

      <Text style={[styles.encourage, { fontSize: fs(15), marginVertical: g(12) }]}>
        Take your time. There is no timer.
      </Text>

      <CalmButton label="Back to games" variant="secondary" onPress={onBack} />

      <CalmCompliment message={compliment} scale={scale} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  heading: { color: colors.text, textAlign: 'center' },
  levelSub: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -6,
  },
  poolCard: {
    overflow: 'visible',
    zIndex: 2,
    elevation: 6,
  },
  poolLabel: { color: colors.textMuted },
  poolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'visible',
    flexWrap: 'wrap',
  },
  draggable: {},
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    zIndex: 1,
    elevation: 1,
    flexWrap: 'wrap',
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotHint: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  encourage: {
    textAlign: 'center',
    color: colors.textMuted,
  },
});
