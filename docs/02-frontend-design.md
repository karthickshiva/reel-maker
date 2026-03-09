# Reel Maker — Frontend Design Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Overview

The Reel Maker mobile app is built with React Native targeting iOS and Android. This document defines the screen hierarchy, component architecture, state management, navigation, and design system.

---

## 2. Navigation Architecture

### 2.1 Navigator Structure

```
RootNavigator (Stack)
├── AuthNavigator (Stack)
│   ├── WelcomeScreen
│   ├── LoginScreen
│   └── SignUpScreen
│
├── MainNavigator (Bottom Tab)
│   ├── HomeTab (Stack)
│   │   ├── HomeScreen
│   │   ├── TemplatePickerScreen
│   │   └── ProjectDetailScreen
│   │
│   ├── CreateTab (Stack)
│   │   ├── MediaPickerScreen
│   │   ├── TemplateApplyScreen
│   │   ├── EditorScreen
│   │   ├── CaptionScreen
│   │   ├── SubtitleScreen
│   │   ├── MusicScreen
│   │   └── ExportScreen
│   │
│   ├── LibraryTab (Stack)
│   │   ├── ProjectListScreen
│   │   └── ProjectDetailScreen
│   │
│   └── ProfileTab (Stack)
│       ├── ProfileScreen
│       └── SettingsScreen
│
└── FullScreenModals
    ├── VideoPreviewModal
    ├── CaptionEditModal
    └── ExportProgressModal
```

### 2.2 Navigation Library

- **React Navigation v7** with native stack
- Deep linking support for shared reel URLs
- Gesture-based navigation (swipe back on iOS)

---

## 3. Screen Specifications

### 3.1 Home Screen

| Element | Description |
|---------|-------------|
| Header | App logo, notification bell, profile avatar |
| Hero Section | "Create New Reel" CTA button |
| Recent Projects | Horizontal scroll of recent drafts/exports |
| Templates | Grid of featured templates with preview thumbnails |
| Trending Music | Horizontal list of trending audio clips |

### 3.2 Media Picker Screen

| Element | Description |
|---------|-------------|
| Gallery Grid | Device photos/videos in a masonry grid |
| Camera Button | Launch camera for capture |
| Selection Counter | Badge showing count of selected items (max 10) |
| Continue Button | Proceed with selected media |
| Filters | Tab bar: All / Photos / Videos |

**Validation Rules:**
- Max 10 media items per reel
- Supported formats: JPG, PNG, MP4, MOV
- Max file size: 200MB per file
- Total project size: 1GB

### 3.3 Template Apply Screen

| Element | Description |
|---------|-------------|
| Template List | Vertical scrollable cards with animated previews |
| Preview Pane | Full-screen preview of template applied to user media |
| Category Tabs | Travel, Makeup, Promo, Story, Product |
| Apply Button | Confirm template selection |

### 3.4 Editor Screen

| Element | Description |
|---------|-------------|
| Video Preview | Top 60% — live preview with play/pause |
| Timeline | Horizontal scrollable timeline with thumbnails |
| Tool Bar | Bottom row: Trim, Split, Speed, Filter, Text |
| Undo/Redo | Top-right action buttons |

**Editor Tools Detail:**

| Tool | UI Component | Behavior |
|------|-------------|----------|
| Trim | Draggable start/end handles on timeline | Sets in/out points |
| Split | Tap position marker + split button | Divides clip at playhead |
| Speed | Slider (0.25x – 4x) | Adjusts playback speed |
| Filter | Horizontal filter strip with previews | Applies visual filter |
| Text | Draggable text box + style panel | Overlay text on video |

### 3.5 Caption Screen

| Element | Description |
|---------|-------------|
| Topic Input | Text field with placeholder "What's your reel about?" |
| Tone Picker | Chip group: Cinematic, Funny, Professional, Casual, Inspiring |
| Generate Button | Triggers AI caption generation |
| Caption Output | Editable text area with generated caption |
| Hashtag Chips | Auto-generated hashtags, tap to remove |
| Copy Button | Copy caption + hashtags to clipboard |

### 3.6 Subtitle Screen

| Element | Description |
|---------|-------------|
| Generate Button | "Auto-generate subtitles" CTA |
| Progress Indicator | Audio extraction → Transcription → Formatting |
| Subtitle List | Editable list of timestamped subtitle entries |
| Style Picker | Font, size, color, background options |
| Preview | Video preview with subtitle overlay |

### 3.7 Music Screen

| Element | Description |
|---------|-------------|
| Search Bar | Search music by name/genre |
| Category Tabs | Trending, Royalty Free, My Uploads |
| Track List | Waveform preview, duration, play button |
| Upload Button | Upload custom audio file |
| Apply Button | Attach selected track to project |

### 3.8 Export Screen

| Element | Description |
|---------|-------------|
| Platform Selector | Instagram, YouTube Shorts, TikTok |
| Quality Toggle | Standard (720p) / HD (1080p) |
| Preview | Final reel preview with all overlays |
| Export Button | Begin render and export |
| Progress Bar | Encoding progress with cancel option |
| Share Sheet | Native OS share sheet on completion |

---

## 4. Component Architecture

### 4.1 Directory Structure

```
src/
├── app/
│   └── App.tsx
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── MainTabNavigator.tsx
│   └── linking.ts
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── SignUpScreen.tsx
│   ├── home/
│   │   └── HomeScreen.tsx
│   ├── create/
│   │   ├── MediaPickerScreen.tsx
│   │   ├── TemplateApplyScreen.tsx
│   │   ├── EditorScreen.tsx
│   │   ├── CaptionScreen.tsx
│   │   ├── SubtitleScreen.tsx
│   │   ├── MusicScreen.tsx
│   │   └── ExportScreen.tsx
│   ├── library/
│   │   ├── ProjectListScreen.tsx
│   │   └── ProjectDetailScreen.tsx
│   └── profile/
│       ├── ProfileScreen.tsx
│       └── SettingsScreen.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   ├── Header.tsx
│   │   ├── IconButton.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── Modal.tsx
│   │   └── ProgressBar.tsx
│   ├── media/
│   │   ├── MediaGrid.tsx
│   │   ├── MediaThumbnail.tsx
│   │   └── MediaPreview.tsx
│   ├── editor/
│   │   ├── Timeline.tsx
│   │   ├── TimelineClip.tsx
│   │   ├── TrimHandles.tsx
│   │   ├── FilterStrip.tsx
│   │   ├── TextOverlay.tsx
│   │   ├── SpeedSlider.tsx
│   │   └── EditorToolbar.tsx
│   ├── template/
│   │   ├── TemplateCard.tsx
│   │   ├── TemplatePreview.tsx
│   │   └── TemplateCategoryTabs.tsx
│   ├── caption/
│   │   ├── CaptionInput.tsx
│   │   ├── CaptionOutput.tsx
│   │   ├── TonePicker.tsx
│   │   └── HashtagList.tsx
│   ├── subtitle/
│   │   ├── SubtitleList.tsx
│   │   ├── SubtitleEntry.tsx
│   │   └── SubtitleStylePicker.tsx
│   ├── music/
│   │   ├── TrackList.tsx
│   │   ├── TrackItem.tsx
│   │   └── WaveformPreview.tsx
│   └── export/
│       ├── PlatformSelector.tsx
│       ├── ExportProgress.tsx
│       └── ShareSheet.tsx
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── captionApi.ts
│   │   ├── subtitleApi.ts
│   │   ├── exportApi.ts
│   │   └── authApi.ts
│   ├── ffmpeg/
│   │   ├── ffmpegService.ts
│   │   ├── trimService.ts
│   │   ├── filterService.ts
│   │   └── exportService.ts
│   ├── media/
│   │   ├── mediaService.ts
│   │   └── permissions.ts
│   └── storage/
│       ├── asyncStorage.ts
│       └── secureStorage.ts
├── store/
│   ├── useAuthStore.ts
│   ├── useProjectStore.ts
│   ├── useEditorStore.ts
│   ├── useMediaStore.ts
│   └── useCaptionStore.ts
├── hooks/
│   ├── useFFmpeg.ts
│   ├── useMediaPicker.ts
│   ├── useDebounce.ts
│   └── useNetworkStatus.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
├── types/
│   ├── project.ts
│   ├── media.ts
│   ├── template.ts
│   ├── caption.ts
│   └── navigation.ts
├── utils/
│   ├── formatDuration.ts
│   ├── fileValidation.ts
│   └── uuid.ts
└── constants/
    ├── templates.ts
    ├── filters.ts
    └── config.ts
```

### 4.2 Key Component Hierarchy

```
App
└── RootNavigator
    └── MainTabNavigator
        └── CreateTab
            └── EditorScreen
                ├── VideoPreview
                │   ├── react-native-video Player
                │   ├── TextOverlay[]
                │   └── SubtitleOverlay
                ├── Timeline
                │   ├── TimelineClip[]
                │   │   └── TrimHandles
                │   └── Playhead
                └── EditorToolbar
                    ├── TrimTool
                    ├── SplitTool
                    ├── SpeedSlider
                    ├── FilterStrip
                    │   └── FilterPreview[]
                    └── TextTool
```

---

## 5. State Management

### 5.1 Store Architecture (Zustand)

#### Project Store

```typescript
interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  
  createProject: () => void;
  loadProject: (id: string) => void;
  updateProject: (updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}
```

#### Editor Store

```typescript
interface EditorState {
  clips: Clip[];
  selectedClipIndex: number;
  playbackPosition: number;
  isPlaying: boolean;
  activeFilter: string | null;
  textOverlays: TextOverlay[];
  speed: number;
  undoStack: EditorAction[];
  redoStack: EditorAction[];

  addClip: (clip: Clip) => void;
  trimClip: (index: number, start: number, end: number) => void;
  splitClip: (index: number, position: number) => void;
  setSpeed: (speed: number) => void;
  applyFilter: (filterId: string) => void;
  addTextOverlay: (overlay: TextOverlay) => void;
  undo: () => void;
  redo: () => void;
}
```

#### Media Store

```typescript
interface MediaState {
  selectedAssets: MediaAsset[];
  isLoading: boolean;

  addAsset: (asset: MediaAsset) => void;
  removeAsset: (id: string) => void;
  reorderAssets: (fromIndex: number, toIndex: number) => void;
  clearSelection: () => void;
}
```

#### Caption Store

```typescript
interface CaptionState {
  caption: string;
  hashtags: string[];
  isGenerating: boolean;
  error: string | null;

  generateCaption: (topic: string, tone?: string) => Promise<void>;
  updateCaption: (caption: string) => void;
  removeHashtag: (tag: string) => void;
}
```

### 5.2 Data Persistence

| Data | Storage | Sync |
|------|---------|------|
| Auth tokens | Secure Storage (Keychain/Keystore) | — |
| User preferences | AsyncStorage | — |
| Project metadata | SQLite (via WatermelonDB) | Backend on save |
| Media files | Device filesystem | — |
| Templates | Bundled assets + remote fetch | On app launch |

---

## 6. Design System

### 6.1 Color Palette

```typescript
const colors = {
  primary: '#6C5CE7',      // Purple — main brand
  primaryLight: '#A29BFE',
  primaryDark: '#4A3CB5',
  
  secondary: '#00CEC9',    // Teal — accents
  secondaryLight: '#81ECEC',

  background: '#0F0F0F',   // Near-black
  surface: '#1A1A2E',      // Dark card surface
  surfaceLight: '#232342',

  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6C6C80',

  success: '#00B894',
  warning: '#FDCB6E',
  error: '#FF6B6B',

  border: '#2D2D44',
};
```

### 6.2 Typography

```typescript
const typography = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
};
```

### 6.3 Spacing Scale

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### 6.4 Component Styling Conventions

- Dark theme by default (content creator preference)
- Rounded corners: 12px for cards, 8px for buttons, 24px for chips
- Shadows: Subtle elevation with 10% opacity black
- Animations: Spring-based via `react-native-reanimated`
- Haptic feedback on key interactions (trim, split, export)

---

## 7. Performance Optimization

### 7.1 Rendering

| Technique | Application |
|-----------|-------------|
| `React.memo` | All list items (TemplateCard, TrackItem, MediaThumbnail) |
| `FlashList` | Media grid, project list, subtitle list |
| `useMemo` / `useCallback` | Editor operations, filter computations |
| Image caching | `react-native-fast-image` for thumbnails |
| Lazy loading | Template previews loaded on scroll |

### 7.2 Video Performance

| Technique | Application |
|-----------|-------------|
| Thumbnail extraction | FFmpeg extracts frames for timeline, not live decode |
| Preview resolution | Editor previews at 540p, export at 1080p |
| Hardware acceleration | FFmpeg hardware codec when available |
| Background processing | Export runs in background thread via native module |

### 7.3 Memory Management

- Release video player resources on screen unfocus
- Limit in-memory media assets to active project only
- Use streaming reads for large video files
- Aggressive image downsampling for gallery grid

---

## 8. Accessibility

| Feature | Implementation |
|---------|---------------|
| Screen reader | All interactive elements have `accessibilityLabel` |
| Dynamic type | Font sizes respect system text size settings |
| Color contrast | WCAG AA compliance (4.5:1 ratio minimum) |
| Touch targets | Minimum 44x44pt for all tappable elements |
| Reduced motion | Respect `prefers-reduced-motion` for animations |

---

## 9. Error Handling Strategy

| Error Type | UI Behavior |
|------------|-------------|
| Network failure | Toast with retry button |
| AI generation failure | Inline error with "Try Again" |
| Invalid media format | Alert dialog with supported formats |
| FFmpeg crash | Auto-save + error screen with "Resume" option |
| Export failure | Retry prompt with option to lower quality |
| Storage full | Warning banner with cleanup suggestions |

---

## 10. Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit tests | Jest | Business logic, utils, store actions (80%) |
| Component tests | React Native Testing Library | All screen components (70%) |
| Integration tests | Detox | Critical user flows (Create, Edit, Export) |
| Snapshot tests | Jest | Common components for regression |
| Performance tests | Flipper + custom metrics | Timeline FPS, export duration |
