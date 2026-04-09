# Bubbli

Calm learning games for kids — built with [Expo](https://expo.dev) and React Native. Includes matching, patterns, sorting, sounds, and speech practice (English and Tagalog).

**Repository:** [github.com/riz1103/bubbli](https://github.com/riz1103/bubbli)

## Requirements

- Node.js (LTS recommended)
- For device builds: Xcode (iOS) or Android Studio (Android)

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
