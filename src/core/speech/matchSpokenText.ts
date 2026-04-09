function stripLatinDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Normalize STT output for comparison (English, kid-friendly). */
export function normalizeSpeechText(s: string): string {
  return stripLatinDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tagalog / Filipino text — keeps ñ and common letters. */
export function normalizeSpeechTextFilipino(s: string): string {
  return stripLatinDiacritics(s)
    .toLowerCase()
    .replace(/[^a-zñ0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        row[j - 1]! + 1,
        row[j]! + 1,
        prev + cost
      );
      prev = tmp;
    }
  }
  return row[n]!;
}

function similarityRatio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length, 1);
}

function wordMatchesWithNormalize(
  heardRaw: string,
  targetWord: string,
  normalize: (s: string) => string
): boolean {
  const heard = normalize(heardRaw);
  const word = normalize(targetWord);
  if (!word.length) return false;
  if (heard === word) return true;
  if (word.includes(' ') && heard.includes(word)) return true;
  const parts = heard.split(' ').filter(Boolean);
  if (parts.includes(word)) return true;
  if (heard.endsWith(word) && word.length >= 3) return true;
  return similarityRatio(heard, word) >= 0.82;
}

/** Single-word listen & repeat (Echo game). */
export function wordMatchesHeard(heardRaw: string, targetWord: string): boolean {
  return wordMatchesWithNormalize(heardRaw, targetWord, normalizeSpeechText);
}

export function wordMatchesHeardFilipino(
  heardRaw: string,
  targetWord: string
): boolean {
  return wordMatchesWithNormalize(heardRaw, targetWord, normalizeSpeechTextFilipino);
}

/** Full-sentence reading — forgiving for kids / STT drops. */
export function sentenceMatchesHeard(heardRaw: string, targetSentence: string): boolean {
  const heard = normalizeSpeechText(heardRaw);
  const target = normalizeSpeechText(targetSentence);
  if (!target.length) return false;
  const fullSim = similarityRatio(heard, target);
  if (fullSim >= 0.86) return true;

  const tWords = target.split(' ').filter((w) => w.length > 1);
  if (tWords.length === 0) return fullSim >= 0.75;

  let hits = 0;
  for (const w of tWords) {
    if (heard.includes(w)) hits++;
  }
  const need = tWords.length;
  return hits / need >= 0.72;
}

export function sentenceMatchesHeardFilipino(
  heardRaw: string,
  targetSentence: string
): boolean {
  const heard = normalizeSpeechTextFilipino(heardRaw);
  const target = normalizeSpeechTextFilipino(targetSentence);
  if (!target.length) return false;
  const fullSim = similarityRatio(heard, target);
  if (fullSim >= 0.84) return true;

  const tWords = target.split(' ').filter((w) => w.length > 1);
  if (tWords.length === 0) return fullSim >= 0.72;

  let hits = 0;
  for (const w of tWords) {
    if (heard.includes(w)) hits++;
  }
  return hits / tWords.length >= 0.68;
}
