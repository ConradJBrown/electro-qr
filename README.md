# Electro QR

A fast, offline desktop utility that generates styled QR codes from any URL or text.

## Features

- Instant local QR generation
- Multiple visual presets (Classic, Neon Midnight, Eco Warm)
- One-click PNG export
- Offline and private workflow

## Tech Stack

- Electron
- node-qrcode
- HTML/CSS/JavaScript

## Prerequisites

- Node.js 18+
- npm

## Run Locally

1. Clone and enter the repo:

```bash
git clone https://github.com/ConradJBrown/electro-qr.git
cd electro-qr
```

2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

## Debug Logging

Run with additional diagnostics and auto-opened DevTools:

```bash
npm run start:debug
```

When running in debug mode, the terminal shows:

- Renderer console logs and errors
- Failed page/resource loads
- Renderer crashes and child process exits
- Main process uncaught exceptions and unhandled promise rejections

## Build Installers

This project uses electron-builder and outputs artifacts to dist/.

- Build unpacked app only (no installer):

```bash
npm run pack
```

- Build Windows installer (NSIS):

```bash
npm run build:win
```

- Build macOS DMG:

```bash
npm run build:mac
```

- Build Linux packages (AppImage, deb, rpm):

```bash
npm run build:linux
```

- Attempt all targets:

```bash
npm run build:all
```

## Cross-Platform Notes

- For reliable production builds, run each target on its native OS:
   - Windows builds on Windows
   - macOS builds on macOS (required for proper signing/notarization)
   - Linux builds on Linux
- Unsigned builds are fine for local testing, but signed installers are recommended for distribution.

## Project Structure

- main.js: Electron main process
- preload.js: secure renderer bridge
- renderer.js: UI logic and QR generation
- index.html: app UI
