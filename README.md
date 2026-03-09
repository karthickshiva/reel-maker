# Reel Maker

Reel Maker is a mobile-first app for creating social media reels from images and clips, with AI-assisted captions and subtitles plus backend services for orchestration and export.

## Repository Layout

- `docs/` – architecture, design, API, and setup documentation
- `mobile/` – React Native TypeScript application
- `services/` – backend microservices (`gateway`, `user-service`, `ai-service`, `subtitle-worker`, `export-service`)
- `__tests__/` – repository scaffold validation tests

## Local Setup

### Prerequisites

- Node.js 22+
- npm (latest)
- (Optional) Docker for backend orchestration
- (Optional) Xcode + Android Studio for mobile builds

### 1) Install mobile dependencies

```bash
cd mobile
npm install
```

### 2) Configure environment variables

Create a local `.env` file from the root example:

```bash
cp .env.example .env
```

Fill in service-specific values before running backend services.

### 3) Validate repository scaffold

From repository root:

```bash
npm install
npm test
```

### 4) Run mobile app

```bash
cd mobile
npm run start
```

Then use either:

```bash
npm run ios
# or
npm run android
```
