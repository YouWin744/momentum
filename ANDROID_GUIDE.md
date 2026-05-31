# Momentum Android Build Guide

Momentum uses Capacitor to package the React/Vite application as an Android app.

## Prerequisites

- Node.js and npm
- Android Studio with an installed Android SDK
- JDK 21

Use JDK 21 for both command-line and Android Studio builds. Gradle 8.11.1 in this project does not build correctly with JDK 25.

## Build a Debug APK

Run these commands from the project root:

```bash
npm install
npm run build
npx cap sync android
export JAVA_HOME=/path/to/jdk-21
./android/gradlew -p android :app:assembleDebug
```

Adjust `JAVA_HOME` if JDK 21 is installed in a different directory.

The generated APK is located at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Open the Project in Android Studio

Build and sync the web assets first:

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio, configure the Gradle JDK:

```text
Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK
```

Select an installed JDK 21 distribution. Android Studio performs its own Gradle sync and incremental build when the project opens or runs. This is expected even if an APK was already built from the command line.

## Workflow After Web Changes

After changing React, TypeScript, CSS, or web assets, rebuild and sync before running the Android app:

```bash
npm run build
npx cap sync android
```

Then run the app from Android Studio or rebuild the APK:

```bash
export JAVA_HOME=/path/to/jdk-21
./android/gradlew -p android :app:assembleDebug
```

## Notifications

The Android app uses `@capacitor/local-notifications` for task reminders. Android may ask the user to allow notifications when the app starts. Future task reminders are scheduled locally on the device and do not require a remote server.

## Troubleshooting

### Unsupported Class File Major Version 69

This error means the Android build is running with JDK 25. Set `JAVA_HOME` to JDK 21 and configure Android Studio to use the same JDK.

### Android App Shows Old Web Content

Run both commands before rebuilding or launching the Android app:

```bash
npm run build
npx cap sync android
```

`npm run build` updates `dist/`. `npx cap sync android` copies the generated web assets into the Android project and updates Capacitor plugins.
