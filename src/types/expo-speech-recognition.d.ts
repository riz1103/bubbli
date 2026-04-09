/**
 * Minimal typings until node_modules resolves (see expo-speech-recognition).
 */
declare module 'expo-speech-recognition' {
  export type SpeechPermissionResult = {
    granted: boolean;
    status?: string;
    canAskAgain?: boolean;
  };

  export type SpeechResultEvent = {
    isFinal?: boolean;
    results: { transcript: string; confidence?: number }[];
  };

  export type SpeechErrorEvent = {
    error: string;
    message?: string;
  };

  export const ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: () => Promise<SpeechPermissionResult>;
    isRecognitionAvailable: () => boolean;
    supportsOnDeviceRecognition: () => boolean;
    start: (options: Record<string, unknown>) => Promise<void>;
    stop: () => Promise<void>;
    abort: () => Promise<void>;
    addListener: (
      event: 'result' | 'error' | 'end' | 'start' | 'nomatch',
      cb: (e: SpeechResultEvent | SpeechErrorEvent) => void
    ) => { remove: () => void };
  };
}
