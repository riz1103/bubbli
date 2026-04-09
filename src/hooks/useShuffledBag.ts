import { useCallback, useRef } from 'react';

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/**
 * Full random permutation per cycle — every item appears once before any repeats.
 * On reshuffle, tries not to start with the same item as the last one shown.
 */
export class ShuffledBag<T> {
  private order: T[] = [];
  private index = 0;
  private last: T | null = null;
  private lastKey: string | null = null;
  private initialDone = false;

  constructor(
    private readonly pool: readonly T[],
    private readonly keyOf: (item: T) => string = (item) => String(item)
  ) {
    if (pool.length === 0) {
      throw new Error('ShuffledBag: empty pool');
    }
  }

  /** Safe for React Strict Mode: repeated calls return the same first item. */
  pullInitial(): T {
    if (!this.initialDone) {
      this.initialDone = true;
      return this.next();
    }
    return this.last as T;
  }

  next(): T {
    if (this.pool.length === 1) {
      const only = this.pool[0]!;
      this.last = only;
      this.lastKey = this.keyOf(only);
      return only;
    }

    if (this.index >= this.order.length) {
      let nextOrder = shuffle(this.pool);
      if (this.lastKey != null) {
        let guard = 0;
        while (
          this.keyOf(nextOrder[0]!) === this.lastKey &&
          this.pool.length > 1 &&
          guard < 48
        ) {
          nextOrder = shuffle(this.pool);
          guard++;
        }
      }
      this.order = nextOrder;
      this.index = 0;
    }

    const item = this.order[this.index]!;
    this.index += 1;
    this.last = item;
    this.lastKey = this.keyOf(item);
    return item;
  }
}

export function useShuffledBag<T>(
  pool: readonly T[],
  resetDeps: unknown[],
  keyOf?: (item: T) => string
): { initial: () => T; next: () => T } {
  const bagRef = useRef<ShuffledBag<T> | null>(null);
  const resetKeyRef = useRef<string | null>(null);
  const key = JSON.stringify(resetDeps);

  if (resetKeyRef.current !== key || !bagRef.current) {
    bagRef.current = new ShuffledBag(pool, keyOf);
    resetKeyRef.current = key;
  }

  const initial = useCallback(() => bagRef.current!.pullInitial(), []);
  const next = useCallback(() => bagRef.current!.next(), []);

  return { initial, next };
}
