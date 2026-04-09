# Bubbli

Calm learning games for kids — built with [Expo](https://expo.dev) and React Native. Includes matching, patterns, sorting, sounds, and speech practice (English and Tagalog).

**Repository:** [github.com/riz1103/bubbli](https://github.com/riz1103/bubbli)

## Requirements

- Node.js (LTS recommended)
- For device builds: Xcode (iOS) or Android Studio (Android)
- **Android native builds (`expo run:android`):** use **JDK 17 or JDK 21** (LTS). Do **not** use JDK 25 for Gradle yet — it triggers `Unsupported class file major version 69` during the Gradle build.

### Fix: `Unsupported class file major version 69` (Windows)

Your `java` on `PATH` is probably **JDK 25**. Install [Eclipse Temurin 17 or 21](https://adoptium.net/), then point the shell at that JDK before building:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
npx expo run:android
```

Adjust `JAVA_HOME` to match the folder name under `C:\Program Files\Eclipse Adoptium\` (version numbers differ). For a permanent fix, set **JAVA_HOME** in Windows *Environment Variables* and put `%JAVA_HOME%\bin` **before** any other `java` entries in **Path**.

## Quick start

```bash
npm install
npx expo start
```

Then open in **Expo Go** or run a native build:

```bash
npm run android
npm run ios
```

Speech recognition uses `expo-speech-recognition`; for full native behavior, use a **development build** or production build rather than relying on Expo Go alone.

After `npm install`, a **postinstall** script may download the upstream Android Kotlin sources for `expo-speech-recognition` (v3.1.2) if they are missing from the npm package, so Gradle can compile `ExpoSpeechRecognitionModule`. If an Android build still fails after updating dependencies, run `npm install` again or `node scripts/ensure-expo-speech-recognition-android.mjs`, then clean with `cd android && .\gradlew.bat clean` and rebuild.

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Start web (if configured) |
| `npm run eas:build:android` | EAS Android build (preview profile) |

## License

Private project unless stated otherwise.
