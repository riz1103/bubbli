import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export type ListenOnceResult =
  | { ok: true; transcript: string }
  | {
      ok: false;
      reason:
        | 'web'
        | 'permission'
        | 'unavailable-offline'
        | 'unavailable-module'
        | 'error'
        | 'timeout'
        | 'empty';
      detail?: string;
    };

export type ListenOnceOptions = {
  /** BCP-47 locale, e.g. en-US, fil-PH */
  lang: string;
  contextualStrings?: string[];
  /**
   * Hint only — we do not force on-device recognition here because that often
   * yields no results when offline packs are missing (especially on Android).
   */
  preferOnDeviceRecognition: boolean;
  strictOfflineOnly: boolean;
  maxMs: number;
};

/** Lazy-loaded so the app runs in Expo Go / builds without native speech linked. */
type SpeechModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  supportsOnDeviceRecognition: () => boolean;
  isRecognitionAvailable: () => boolean;
  start: (options: Record<string, unknown>) => Promise<void>;
  stop: () => Promise<void>;
  abort: () => Promise<void>;
  addListener: (
    event: 'result' | 'error' | 'end' | 'nomatch',
    cb: (e: unknown) => void
  ) => { remove: () => void };
};

let speechModuleCache: SpeechModule | null | undefined;

function getSpeechModule(): SpeechModule | null {
  if (Platform.OS === 'web') return null;
  if (speechModuleCache !== undefined) return speechModuleCache;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule: SpeechModule;
    };
    speechModuleCache = ExpoSpeechRecognitionModule;
    return speechModuleCache;
  } catch {
    speechModuleCache = null;
    return null;
  }
}

function extractBestTranscript(event: unknown): string {
  const e = event as { results?: { transcript?: string }[] };
  const parts = e.results;
  if (!parts?.length) return '';
  let best = '';
  for (const p of parts) {
    const t = p?.transcript?.trim() ?? '';
    if (t.length > best.length) best = t;
  }
  const first = parts[0]?.transcript?.trim() ?? '';
  if (first.length > best.length) best = first;
  return best;
}

async function prepareAudioForRecognition(): Promise<void> {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    /* ignore */
  }
}

async function restoreAudioAfterRecognition(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    /* ignore */
  }
}

/** Avoid hanging forever if expo-av never settles (can strand the mic UI). */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Captures one utterance in the given locale.
 */
export async function listenOnce(options: ListenOnceOptions): Promise<ListenOnceResult> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'web' };
  }

  const ExpoSpeechRecognitionModule = getSpeechModule();
  if (!ExpoSpeechRecognitionModule) {
    return {
      ok: false,
      reason: 'unavailable-module',
      detail:
        'Speech recognition needs a dev build (expo run:android / expo run:ios), not Expo Go.',
    };
  }

  const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!perm.granted) {
    return { ok: false, reason: 'permission' };
  }

  let onDeviceOk = false;
  try {
    onDeviceOk = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  } catch {
    onDeviceOk = false;
  }

  if (options.strictOfflineOnly && !onDeviceOk) {
    return { ok: false, reason: 'unavailable-offline' };
  }

  // Some Android recognizers can tear down the next session if abort() is called right before start().
  try {
    if (Platform.OS === 'android') {
      await ExpoSpeechRecognitionModule.stop();
    } else {
      await ExpoSpeechRecognitionModule.abort();
    }
  } catch {
    /* ignore */
  }

  try {
    await withTimeout(prepareAudioForRecognition(), 5000, 'prepareAudioForRecognition');
  } catch {
    /* still try listening — mode may already be usable */
  }

  const useOnDeviceOnly =
    options.strictOfflineOnly && onDeviceOk;

  return new Promise((resolve) => {
    const subs: { remove: () => void }[] = [];
    let lastText = '';
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (r: ListenOnceResult) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      subs.forEach((s) => s.remove());
      void ExpoSpeechRecognitionModule.stop().catch(() => {});
      resolve(r);
      void withTimeout(restoreAudioAfterRecognition(), 4000, 'restoreAudioAfterRecognition').catch(
        () => {}
      );
    };

    const settle = (r: ListenOnceResult) => {
      finish(r);
    };

    timer = setTimeout(() => {
      const t = lastText.trim();
      if (t.length > 0) settle({ ok: true, transcript: t });
      else settle({ ok: false, reason: 'timeout' });
    }, options.maxMs);

    subs.push(
      ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const chunk = extractBestTranscript(event);
        if (chunk) {
          lastText = chunk;
        }
        const e = event as { isFinal?: boolean };
        if (e.isFinal === true && lastText.trim()) {
          settle({ ok: true, transcript: lastText.trim() });
        }
        if (e.isFinal === undefined && lastText.trim() && Platform.OS === 'android') {
          /* Some Android builds omit isFinal — timer / end will still close the session */
        }
      })
    );

    subs.push(
      ExpoSpeechRecognitionModule.addListener('error', (event) => {
        const err = event as { error?: string; message?: string };
        if (err.error === 'aborted') return;
        settle({
          ok: false,
          reason: 'error',
          detail: String(err.message ?? err.error ?? 'unknown'),
        });
      })
    );

    subs.push(
      ExpoSpeechRecognitionModule.addListener('nomatch', () => {
        /* wait for timer */
      })
    );

    subs.push(
      ExpoSpeechRecognitionModule.addListener('end', () => {
        const t = lastText.trim();
        if (t.length > 0) settle({ ok: true, transcript: t });
      })
    );

    const startPayload: Record<string, unknown> = {
      lang: options.lang,
      interimResults: true,
      continuous: false,
      maxAlternatives: 3,
      requiresOnDeviceRecognition: useOnDeviceOnly,
      contextualStrings: options.contextualStrings,
      iosTaskHint: 'dictation',
    };

    if (Platform.OS === 'android') {
      startPayload.androidIntentOptions = {
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2200,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2800,
      };
    }

    void ExpoSpeechRecognitionModule.start(startPayload).catch((firstErr: unknown) => {
      // Some devices reject richer payload options or need a tiny cooldown after stop/abort.
      const fallbackPayload: Record<string, unknown> = {
        lang: options.lang,
        interimResults: false,
        continuous: false,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: useOnDeviceOnly,
      };
      void sleep(220)
        .then(() => ExpoSpeechRecognitionModule.start(fallbackPayload))
        .catch((secondErr: unknown) => {
          const detail = String(
            (secondErr as { message?: string })?.message ??
              (firstErr as { message?: string })?.message ??
              'start-failed'
          );
          settle({ ok: false, reason: 'error', detail });
        });
    });
  });
}

/** English-only shorthand for existing screens. */
export async function listenOnceEn(
  options: Omit<ListenOnceOptions, 'lang'>
): Promise<ListenOnceResult> {
  return listenOnce({ ...options, lang: 'en-US' });
}

export function canUseNativeSpeechRecognition(): boolean {
  if (Platform.OS === 'web') return false;
  const M = getSpeechModule();
  if (!M) return false;
  try {
    return M.isRecognitionAvailable();
  } catch {
    return false;
  }
}
