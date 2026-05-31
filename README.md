# Momentum

Momentum is an offline-first task management app built with React, Vite, Capacitor, and Dexie.js. It supports short-term and long-term tasks, health-based task status tracking, completion history, and local task reminders on Android.

## Features

- Short-term and long-term task lists grouped by scheduled date
- Local task data stored in IndexedDB through Dexie.js
- Completed-task history with restore and permanent-delete actions
- Local Android notifications scheduled for future task target times
- Capacitor Android app with a native launch screen

## Prerequisites

- Node.js
- npm

For Android builds, see [ANDROID_GUIDE.md](./ANDROID_GUIDE.md).

## Run Locally

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Create a production web build:

```bash
npm run build
```

## Project Structure

```text
components/      Shared React UI components
pages/           Short-term, long-term, and completed-task pages
src/services/    Task persistence and notification services
android/         Capacitor Android project
dist/            Generated production web assets
```

## Data Storage

Momentum stores task data locally in the device WebView database using Dexie.js and IndexedDB. The core task workflow does not require a remote backend or an internet connection.
