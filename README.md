# Opo Tracker

A lightweight mobile app to track preparation for public exams (Spanish “oposiciones”). Organize topics into folders, mark per-category progress, manage reviews, and keep personal notes.

- **Platform**: iOS, Android, Web (Expo)
- **UI**: React Native Paper (Material 3)
- **Navigation**: React Navigation (native stack)
- **State**: Zustand + Async Storage
- **Updates**: Expo Updates / EAS Update

## Features

- **Opposition selection**: Choose your opposition on first launch; change later by resetting data.
- **Topics tracking**: Per-category checks per topic; topic-level progress and review counters.
- **Folders**: Group topics into folders. Each folder shows global progress and category bars.
- **Per-category progress bars**:
  - Global card: one labeled bar per category (percentage calculated per category over the visible set).
  - Folder card: the same, computed only with topics in the folder.
- **Notes**: Add/read a note per topic directly from the table.
- **Bulk actions**: Speed up common review and category toggles.
- **Persistent storage**: All data stored locally.

## Screens

- `src/screens/TableScreen.tsx`
  - Dashboard with global progress.
  - All folders (always shown, even when empty) as cards with per-category progress.
  - “No folder” section listing unassigned topics.
- `src/screens/FolderScreen.tsx`
  - Focused view for a folder (or “No folder”), mirroring category bars.
- `src/screens/TopicDetailScreen.tsx`
  - Detailed per-topic checks, reviews, and notes.
- `src/screens/CategoriesScreen.tsx`
  - Manage categories and their order.
- `App.tsx`
  - Opposition selection screen rendered with Cards that grow to fit long titles.

## Data Model

- `src/data/titles.ts`
  - `TOPIC_TITLES`: map of opposition name → array of topic titles.
  - Included examples:
    - `Profesor de Secundaria: Física y Química`
    - `Maestro de Audición y Lenguaje`
- `src/store/useStore.ts`
  - Zustand store for `topics`, `folders`, `categories`, selected opposition, and actions.

## Tech Stack

- Expo `~54`
- React Native `0.81`
- React `19`
- React Native Paper `^5.14`
- React Navigation `^7`
- Zustand `^4.5`
- Async Storage `^2.2`

See `package.json` for exact versions.

## Getting Started

### Prerequisites

- Node LTS
- Xcode (iOS) and/or Android Studio (Android)
- Expo account (optional for OTA updates)

### Install

```bash
npm install
```

### Run

```bash
# start bundler
npm start

# run platforms
npm run ios
npm run android
npm run web
```

### First launch

- Select your opposition on the “Opposition Select” screen.
- You can reset data later to choose a different opposition.

## Project Structure

```
/ (root)
├─ App.tsx                 # Navigation, theming, opposition selection
├─ assets/                 # App icons, splash
├─ src/
│  ├─ data/
│  │  └─ titles.ts         # Opposition → topics map
│  ├─ screens/
│  │  ├─ TableScreen.tsx   # Dashboard with folders and topics
│  │  ├─ FolderScreen.tsx  # Per-folder view
│  │  ├─ TopicDetailScreen.tsx
│  │  └─ CategoriesScreen.tsx
│  ├─ store/
│  │  └─ useStore.ts       # Zustand store and actions
│  └─ utils/
│     └─ progress.ts       # Progress helpers
└─ app.json                # Expo config
```

## Key UI Details

- **Opposition selection**
  - Cards expand to wrap long titles; icon and text aligned horizontally.
- **Differentiation of sections**
  - Folder sections and the “No folder” topics section use subtle background panels.
- **Progress semantics**
  - Category bars compute percentage per category over the current set:
    - Global: all topics.
    - Folder: only topics in that folder.
  - Bars include a visible track so 0% is still visible.

## OTA Updates (EAS Update)

- Ensure `app.json` includes `runtimeVersion` and `updates.url`.
- Publish an update:

```bash
npx eas-cli update --branch <branch> --message "<message>"
```

Devices fetch updates on start based on the Expo Updates policy.

## Adding/Editing Oppositions

- Edit `src/data/titles.ts` under `TOPIC_TITLES`.
- Long names are supported on the selection screen (cards grow in height).

## Contributing

- Create a feature branch and keep changes focused.
- Update relevant screens and styles in-place.
- Open a PR with a clear description and screenshots when UI changes.

## License

See `package.json` for the license field (0BSD by default).
