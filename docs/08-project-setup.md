# Reel Maker — Project Setup & Development Guide

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Prerequisites

### 1.1 Development Machine

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22 LTS | Runtime for React Native CLI and backend |
| npm or yarn | Latest | Package management |
| Python | 3.12+ | Subtitle worker service |
| Java JDK | 17 | Android build |
| Xcode | 16+ | iOS build (macOS only) |
| Android Studio | Latest | Android SDK and emulator |
| CocoaPods | Latest | iOS native dependencies |
| Docker | Latest | Backend local development |
| Git | Latest | Version control |

### 1.2 Accounts & API Keys

| Service | Purpose | Where to Get |
|---------|---------|-------------|
| OpenAI | Caption + Subtitle generation | https://platform.openai.com |
| Google Cloud (optional) | Gemini fallback | https://console.cloud.google.com |
| Apple Developer | iOS builds | https://developer.apple.com |
| Google Play Console | Android builds | https://play.google.com/console |
| AWS / GCS | Object storage | https://aws.amazon.com or https://cloud.google.com |

---

## 2. Repository Structure

```
reel-maker/
├── docs/                      # Project documentation (this folder)
│   ├── 01-architecture.md
│   ├── 02-frontend-design.md
│   ├── 03-backend-design.md
│   ├── 04-api-specification.md
│   ├── 05-database-design.md
│   ├── 06-ai-integration.md
│   ├── 07-video-pipeline.md
│   └── 08-project-setup.md
│
├── mobile/                    # React Native mobile app
│   ├── src/
│   │   ├── app/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── theme/
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   ├── android/
│   ├── ios/
│   ├── __tests__/
│   ├── package.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── .env.example
│   └── app.json
│
├── services/                  # Backend microservices
│   ├── gateway/
│   ├── user-service/
│   ├── ai-service/
│   ├── subtitle-worker/
│   └── export-service/
│
├── docker-compose.yml         # Local backend orchestration
├── .gitignore
├── .env.example
└── README.md
```

---

## 3. Mobile App Setup

### 3.1 Initialize the Project

```bash
npx @react-native-community/cli init ReelMaker --template react-native-template-typescript

cd ReelMaker
```

### 3.2 Install Core Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# State Management
npm install zustand

# Video
npm install react-native-video ffmpeg-kit-react-native

# UI / Animations
npm install react-native-reanimated react-native-gesture-handler
npm install react-native-linear-gradient

# Image handling
npm install react-native-fast-image
npm install @react-native-camera-roll/camera-roll

# Storage
npm install @react-native-async-storage/async-storage
npm install react-native-keychain

# Networking
npm install axios

# Lists
npm install @shopify/flash-list

# Utilities
npm install uuid react-native-fs
npm install react-native-haptic-feedback

# Dev dependencies
npm install -D @types/uuid jest @testing-library/react-native
```

### 3.3 iOS Setup

```bash
cd ios
pod install
cd ..
```

Add to `ios/Podfile`:

```ruby
platform :ios, '15.0'

# FFmpeg Kit
pod 'ffmpeg-kit-react-native', :subspecs => ['full'], :podspec => '../node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'
```

### 3.4 Android Setup

Add to `android/build.gradle`:

```gradle
ext {
    ffmpegKitPackage = "full"
}
```

Ensure `minSdkVersion` is 24+ in `android/app/build.gradle`.

### 3.5 Environment Configuration

Create `.env` in the mobile root:

```bash
# .env.example
API_BASE_URL=http://localhost:3000/v1
OPENAI_API_KEY=sk-your-key-here
```

Install env support:

```bash
npm install react-native-config
```

### 3.6 Run the App

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Metro bundler (if not auto-started)
npx react-native start
```

---

## 4. Backend Setup

### 4.1 Quick Start with Docker

```bash
# From project root
docker-compose up -d

# Verify services
docker-compose ps
```

### 4.2 Manual Setup (without Docker)

#### Gateway Service

```bash
cd services/gateway
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

#### User Service

```bash
cd services/user-service
npm install
cp .env.example .env

# Set up database
npx prisma migrate dev
npx prisma db seed

npm run dev
```

#### AI Service

```bash
cd services/ai-service
npm install
cp .env.example .env
# Add OPENAI_API_KEY to .env
npm run dev
```

#### Subtitle Worker (Python)

```bash
cd services/subtitle-worker
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Add OPENAI_API_KEY and REDIS_URL to .env
python -m app.worker
```

#### Export Service

```bash
cd services/export-service
npm install
cp .env.example .env
npm run dev
```

### 4.3 Backend Environment Variables

```bash
# .env.example (common across services)
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

DATABASE_URL=postgresql://reel_maker:dev_password@localhost:5432/reel_maker_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-development-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o

AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_EXPORTS=reel-maker-exports-dev
S3_REGION=us-east-1
```

---

## 5. Development Workflow

### 5.1 Branch Strategy

```
main              ← Production-ready code
├── develop       ← Integration branch
│   ├── feature/media-upload
│   ├── feature/template-engine
│   ├── feature/video-editor
│   ├── feature/ai-caption
│   ├── feature/subtitles
│   └── feature/export
├── release/1.0   ← Release candidates
└── hotfix/*      ← Production fixes
```

### 5.2 Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(editor): add trim tool with draggable handles
fix(export): resolve crash on large video export
chore(deps): update ffmpeg-kit to 6.1
docs(api): add subtitle endpoint examples
test(caption): add unit tests for tone modifier
```

### 5.3 Code Quality

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Test
npm test

# Test with coverage
npm test -- --coverage
```

### 5.4 ESLint Configuration

```json
{
  "extends": [
    "@react-native",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-native/no-inline-styles": "warn",
    "no-console": "warn"
  }
}
```

### 5.5 TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2022"],
    "jsx": "react-native",
    "strict": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["components/*"],
      "@screens/*": ["screens/*"],
      "@services/*": ["services/*"],
      "@store/*": ["store/*"],
      "@hooks/*": ["hooks/*"],
      "@theme/*": ["theme/*"],
      "@types/*": ["types/*"],
      "@utils/*": ["utils/*"],
      "@constants/*": ["constants/*"]
    },
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "babel.config.js", "metro.config.js"]
}
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions — Mobile

```yaml
name: Mobile CI

on:
  push:
    branches: [develop, main]
    paths: ['mobile/**']
  pull_request:
    branches: [develop, main]
    paths: ['mobile/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json
      - run: npm ci
        working-directory: mobile
      - run: npm run lint
        working-directory: mobile
      - run: npx tsc --noEmit
        working-directory: mobile
      - run: npm test -- --coverage
        working-directory: mobile

  build-android:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
        working-directory: mobile
      - run: cd android && ./gradlew assembleRelease
        working-directory: mobile

  build-ios:
    needs: lint-and-test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
        working-directory: mobile
      - run: cd ios && pod install
        working-directory: mobile
      - run: xcodebuild -workspace ios/ReelMaker.xcworkspace -scheme ReelMaker -configuration Release -sdk iphoneos
        working-directory: mobile
```

### 6.2 GitHub Actions — Backend

```yaml
name: Backend CI

on:
  push:
    branches: [develop, main]
    paths: ['services/**']
  pull_request:
    branches: [develop, main]
    paths: ['services/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: reel_maker_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    strategy:
      matrix:
        service: [gateway, user-service, ai-service, export-service]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
        working-directory: services/${{ matrix.service }}
      - run: npm test
        working-directory: services/${{ matrix.service }}
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/reel_maker_test
          REDIS_URL: redis://localhost:6379
```

---

## 7. Development Milestones

### Sprint 1 (Weeks 1-2): Foundation

| Task | Owner | Priority |
|------|-------|----------|
| Project scaffolding (RN + backend services) | Full Stack | P0 |
| Navigation setup | Frontend | P0 |
| Auth flow (register/login/JWT) | Backend + Frontend | P0 |
| Design system (theme, common components) | Frontend | P0 |
| Database schema + Prisma setup | Backend | P0 |
| Docker Compose for local dev | Backend | P0 |

### Sprint 2 (Weeks 3-4): Media & Templates

| Task | Owner | Priority |
|------|-------|----------|
| Media picker (gallery + camera) | Frontend | P0 |
| Media import pipeline (FFmpeg) | Frontend | P0 |
| Template data model + seed data | Backend | P0 |
| Template picker UI | Frontend | P0 |
| Template application (FFmpeg) | Frontend | P1 |

### Sprint 3 (Weeks 5-6): Video Editor

| Task | Owner | Priority |
|------|-------|----------|
| Timeline component | Frontend | P0 |
| Trim tool | Frontend | P0 |
| Split tool | Frontend | P1 |
| Speed adjustment | Frontend | P1 |
| Filter strip | Frontend | P1 |
| Text overlay | Frontend | P1 |

### Sprint 4 (Weeks 7-8): AI Features

| Task | Owner | Priority |
|------|-------|----------|
| Caption generation API | Backend | P0 |
| Caption UI screen | Frontend | P0 |
| Subtitle worker (Whisper) | Backend | P0 |
| Subtitle UI screen | Frontend | P0 |
| Subtitle burn-in (FFmpeg) | Frontend | P1 |

### Sprint 5 (Weeks 9-10): Export & Music

| Task | Owner | Priority |
|------|-------|----------|
| Export pipeline (FFmpeg) | Frontend | P0 |
| Export service (cloud storage) | Backend | P0 |
| Music library API + UI | Full Stack | P1 |
| Audio mixing (FFmpeg) | Frontend | P1 |
| Share sheet integration | Frontend | P0 |

### Sprint 6 (Weeks 11-12): Polish & Launch

| Task | Owner | Priority |
|------|-------|----------|
| End-to-end testing (Detox) | QA | P0 |
| Performance optimization | Full Stack | P0 |
| Error handling & edge cases | Full Stack | P0 |
| App store assets & submission | Design + PM | P0 |
| Production deployment (backend) | DevOps | P0 |
| Monitoring & alerting setup | DevOps | P1 |

---

## 8. Useful Commands Reference

```bash
# Mobile
npx react-native run-ios                    # Run on iOS simulator
npx react-native run-android                # Run on Android emulator
npx react-native start --reset-cache        # Clear Metro cache
npx react-native log-ios                    # View iOS logs
npx react-native log-android                # View Android logs

# Backend
docker-compose up -d                        # Start all backend services
docker-compose logs -f ai-service           # Tail logs for a service
docker-compose down -v                      # Stop and remove volumes
npx prisma studio                           # Visual database browser
npx prisma migrate dev --name <name>        # Create migration
npx prisma db seed                          # Seed database

# Testing
npm test                                    # Run tests
npm test -- --watch                         # Watch mode
npm test -- --coverage                      # Coverage report
npx detox test -c ios.sim.debug             # E2E tests (iOS)

# Code Quality
npm run lint                                # ESLint
npm run lint -- --fix                       # Auto-fix lint issues
npx tsc --noEmit                            # TypeScript check
```
