# MusicPlayer

An Android-first music player for audio files stored on the device.

The project focuses on accessible controls, predictable navigation, and clear language for people with low vision and
limited experience with technology.

## Project status

The project includes playlist domain rules, a playlist creation use case, and an in-memory repository with unit and
integration tests.

OP-SQLite is integrated, and native storage persistence has been verified on Android. The initial playlist schema and migration
runner have automated SQLite integration tests.

Connecting storage initialization to the Android application and implementing the SQLite playlist repository are the next
steps.

Music playback and the user-facing application screens remain planned.

## Planned features

- Browse and search local audio files.
- Play music in the background.
- Control playback from the application, lock screen, and headphones.
- Create, rename, and edit playlists.
- Preserve the actual playback order in history, including repeated tracks.
- Restore the current track, queue, and playback position.
- Support system text scaling and TalkBack.

## Technology

- React Native 0.87.1
- React 19.2.3
- TypeScript
- React Native Community CLI 20.2.0
- npm
- Jest and ESLint

Android integration uses Kotlin where native platform functionality is required.

Application data is intended to remain on the device. The initial version requires no backend.

## Development requirements

- Node.js 22.x, version 22.13.0 or later
- npm
- JDK 21
- Android Studio with the required Android SDK packages
- An Android device or emulator

The current Android configuration specifies:

- Minimum Android API: 24
- Compile SDK: 37
- Target SDK: 36
- SDK Build-Tools: 37.0.0
- NDK: 27.1.12297006
- Gradle Wrapper: 9.4.1

Set `JAVA_HOME` to the JDK directory and `ANDROID_HOME` to the Android SDK directory.

Add the Android SDK `platform-tools` directory to `PATH`. Add the `emulator` directory when using an emulator.

Use the Gradle Wrapper included in the repository.

## Install dependencies

Run from the project root:

```powershell
npm ci
```

## Run on Android

Start an emulator or connect an Android device with USB debugging enabled.

Check the connection:

```powershell
adb devices
```

Start Metro from the project root:

```powershell
npm start
```

Keep Metro running. In another terminal, run:

```powershell
npm run android
```

## Development checks

Run from the project root:

```powershell
npm run format:check
npm test -- --runInBand
npm run lint
npx tsc --noEmit
```

JavaScript tests are used to verify application logic and component interactions. Native integrations and background playback
also require checks on Android.

## Continuous integration

GitHub Actions runs formatting, ESLint, TypeScript, and Jest checks on pushes to `main` and pull requests targeting `main`.
The workflow can also be started manually.

Checks run on Ubuntu 24.04 with Node.js 22.18.0. SQLite integration tests use `node:sqlite`.

Android builds and device verification are performed separately.

See the [CI workflow](.github/workflows/ci.yml).

## Architecture

The project follows a simplified Clean Architecture, organized by feature.

Each feature separates:

- `domain`: models and business rules
- `application`: use cases and dependency contracts
- `infrastructure`: storage and platform implementations
- `presentation`: screens, components, and UI state

See [ADR-0001](docs/adr/0001-architecture.md).

## Documentation

- [Contributing guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Architecture decisions](docs/adr)

Public documentation is written in English. Internal requirements and architecture decisions are written in Russian.

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
