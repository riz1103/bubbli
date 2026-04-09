/**
 * npm package expo-speech-recognition@3.x may ship without Android Kotlin sources.
 * Those files are required for Gradle to compile ExpoSpeechRecognitionModule.
 * Fetches v3.1.2 sources from upstream when the main .kt file is missing.
 * @see https://github.com/jamsch/expo-speech-recognition
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TARGET_DIR = path.join(
  ROOT,
  'node_modules',
  'expo-speech-recognition',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'speechrecognition'
);

const TAG = 'v3.1.2';
const BASE = `https://raw.githubusercontent.com/jamsch/expo-speech-recognition/${TAG}/android/src/main/java/expo/modules/speechrecognition`;

const FILES = [
  'DelayedFileStreamer.kt',
  'ExpoAudioRecorder.kt',
  'ExpoSpeechRecognitionModule.kt',
  'ExpoSpeechRecognitionOptions.kt',
  'ExpoSpeechService.kt',
];

async function main() {
  const marker = path.join(TARGET_DIR, 'ExpoSpeechRecognitionModule.kt');
  if (fs.existsSync(marker)) {
    return;
  }

  const pkgDir = path.join(ROOT, 'node_modules', 'expo-speech-recognition');
  if (!fs.existsSync(pkgDir)) {
    console.warn(
      '[postinstall] expo-speech-recognition not installed; skip Android source fix.'
    );
    return;
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  for (const name of FILES) {
    const url = `${BASE}/${name}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`[postinstall] GET ${url} failed: ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(TARGET_DIR, name), buf);
  }

  console.log(
    `[postinstall] Restored ${FILES.length} Android Kotlin file(s) for expo-speech-recognition (${TAG}).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
