# Reel Maker — Database Design Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Overview

The application uses PostgreSQL 16 as the primary relational database. This document covers the schema design, relationships, indexing strategy, and migration approach.

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│      users      │       │   refresh_tokens     │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │──┐    │ id (PK)             │
│ name            │  │    │ user_id (FK)        │──┐
│ email (UNIQUE)  │  │    │ token_hash          │  │
│ password_hash   │  │    │ expires_at          │  │
│ avatar_url      │  │    │ revoked             │  │
│ plan            │  │    │ created_at          │  │
│ created_at      │  │    └─────────────────────┘  │
│ updated_at      │  │                              │
└─────────────────┘  │    ┌─────────────────────┐  │
                     │    │      projects        │  │
                     │    ├─────────────────────┤  │
                     ├───►│ id (PK)             │  │
                     │    │ user_id (FK)        │◄─┘
                     │    │ title               │
                     │    │ template_id         │
                     │    │ status              │
                     │    │ caption             │
                     │    │ hashtags            │
                     │    │ music_track_id      │
                     │    │ export_format       │
                     │    │ created_at          │
                     │    │ updated_at          │
                     │    └──────────┬──────────┘
                     │               │
                     │               │ 1:N
                     │               ▼
                     │    ┌─────────────────────┐
                     │    │    media_assets      │
                     │    ├─────────────────────┤
                     │    │ id (PK)             │
                     │    │ project_id (FK)     │
                     │    │ type                │
                     │    │ url                 │
                     │    │ duration            │
                     │    │ file_size_bytes     │
                     │    │ order_index         │
                     │    │ created_at          │
                     │    └─────────────────────┘
                     │
                     │    ┌─────────────────────┐
                     │    │   edit_operations    │
                     │    ├─────────────────────┤
                     │    │ id (PK)             │
                     │    │ project_id (FK)     │
                     │    │ operation_type      │
                     │    │ clip_index          │
                     │    │ parameters (JSONB)  │
                     │    │ order_index         │
                     │    │ created_at          │
                     │    └─────────────────────┘
                     │
                     │    ┌─────────────────────┐
                     │    │    export_jobs       │
                     │    ├─────────────────────┤
                     │    │ id (PK)             │
                     │    │ project_id (FK)     │
                     │    │ user_id (FK)        │◄─┘
                     │    │ format              │
                     │    │ quality             │
                     │    │ status              │
                     │    │ progress            │
                     │    │ video_url           │
                     │    │ file_size_bytes     │
                     │    │ error_message       │
                     │    │ started_at          │
                     │    │ completed_at        │
                     │    │ created_at          │
                     │    └─────────────────────┘
                     │
                     │    ┌─────────────────────┐
                     │    │   subtitle_jobs      │
                     │    ├─────────────────────┤
                     │    │ id (PK)             │
                     │    │ project_id (FK)     │
                     │    │ user_id (FK)        │◄─┘
                     │    │ format              │
                     │    │ language            │
                     │    │ status              │
                     │    │ progress            │
                     │    │ content             │
                     │    │ word_count          │
                     │    │ error_message       │
                     │    │ started_at          │
                     │    │ completed_at        │
                     │    │ created_at          │
                     │    └─────────────────────┘

┌─────────────────────┐    ┌─────────────────────┐
│     templates        │    │    music_tracks      │
├─────────────────────┤    ├─────────────────────┤
│ id (PK)             │    │ id (PK)             │
│ name                │    │ title               │
│ category            │    │ artist              │
│ preview_url         │    │ duration_seconds    │
│ thumbnail_url       │    │ genre               │
│ transitions (JSONB) │    │ category            │
│ text_slots (JSONB)  │    │ preview_url         │
│ duration            │    │ full_url            │
│ media_slots         │    │ waveform_url        │
│ aspect_ratio        │    │ is_premium          │
│ is_premium          │    │ uploaded_by (FK)    │
│ created_at          │    │ created_at          │
└─────────────────────┘    └─────────────────────┘
```

---

## 3. Table Definitions

### 3.1 users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    plan VARCHAR(20) NOT NULL DEFAULT 'free'
        CHECK (plan IN ('free', 'pro', 'business')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
```

### 3.2 refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at)
    WHERE revoked = FALSE;
```

### 3.3 projects

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL DEFAULT 'Untitled Reel',
    template_id VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'rendering', 'complete', 'failed')),
    caption TEXT,
    hashtags TEXT[],
    music_track_id UUID,
    export_format VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects (user_id);
CREATE INDEX idx_projects_user_status ON projects (user_id, status);
CREATE INDEX idx_projects_updated_at ON projects (updated_at DESC);
```

### 3.4 media_assets

```sql
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    duration DECIMAL(10, 3),
    file_size_bytes BIGINT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_assets_project_id ON media_assets (project_id);
CREATE INDEX idx_media_assets_order ON media_assets (project_id, order_index);
```

### 3.5 edit_operations

```sql
CREATE TABLE edit_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    operation_type VARCHAR(20) NOT NULL
        CHECK (operation_type IN ('trim', 'split', 'speed', 'filter', 'text_overlay')),
    clip_index INTEGER NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edit_operations_project_id ON edit_operations (project_id);
```

**Example `parameters` JSONB for each operation type:**

```json
// trim
{ "start": 2.0, "end": 7.5 }

// split
{ "position": 4.0 }

// speed
{ "factor": 2.0 }

// filter
{ "filter_id": "warm", "intensity": 0.8 }

// text_overlay
{ "text": "Hello World", "x": 0.5, "y": 0.3, "font_size": 24, "color": "#FFFFFF" }
```

### 3.6 export_jobs

```sql
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    format VARCHAR(20) NOT NULL
        CHECK (format IN ('instagram', 'youtube_shorts', 'tiktok')),
    quality VARCHAR(10) NOT NULL DEFAULT 'hd'
        CHECK (quality IN ('standard', 'hd')),
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),
    video_url TEXT,
    file_size_bytes BIGINT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_export_jobs_project_id ON export_jobs (project_id);
CREATE INDEX idx_export_jobs_user_id ON export_jobs (user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs (status)
    WHERE status IN ('queued', 'processing');
```

### 3.7 subtitle_jobs

```sql
CREATE TABLE subtitle_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    format VARCHAR(5) NOT NULL DEFAULT 'srt'
        CHECK (format IN ('srt', 'vtt')),
    language VARCHAR(5) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),
    content TEXT,
    word_count INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subtitle_jobs_project_id ON subtitle_jobs (project_id);
CREATE INDEX idx_subtitle_jobs_user_id ON subtitle_jobs (user_id);
CREATE INDEX idx_subtitle_jobs_status ON subtitle_jobs (status)
    WHERE status IN ('queued', 'processing');
```

### 3.8 templates

```sql
CREATE TABLE templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL
        CHECK (category IN ('travel', 'makeup', 'promo', 'story', 'product')),
    preview_url TEXT,
    thumbnail_url TEXT,
    transitions JSONB NOT NULL DEFAULT '[]',
    text_slots JSONB NOT NULL DEFAULT '[]',
    duration INTEGER NOT NULL,
    media_slots INTEGER NOT NULL DEFAULT 5,
    aspect_ratio VARCHAR(10) NOT NULL DEFAULT '9:16',
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates (category);
```

### 3.9 music_tracks

```sql
CREATE TABLE music_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200),
    duration_seconds INTEGER NOT NULL,
    genre VARCHAR(50),
    category VARCHAR(20) NOT NULL
        CHECK (category IN ('trending', 'royalty_free', 'user_upload')),
    preview_url TEXT NOT NULL,
    full_url TEXT NOT NULL,
    waveform_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_music_tracks_category ON music_tracks (category);
CREATE INDEX idx_music_tracks_genre ON music_tracks (genre);
CREATE INDEX idx_music_tracks_search ON music_tracks
    USING gin (to_tsvector('english', title || ' ' || COALESCE(artist, '') || ' ' || COALESCE(genre, '')));
```

---

## 4. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String          @id @default(uuid())
  name          String          @db.VarChar(50)
  email         String          @unique @db.VarChar(255)
  passwordHash  String          @map("password_hash") @db.VarChar(255)
  avatarUrl     String?         @map("avatar_url")
  plan          String          @default("free") @db.VarChar(20)
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  
  refreshTokens RefreshToken[]
  projects      Project[]
  exportJobs    ExportJob[]
  subtitleJobs  SubtitleJob[]
  musicTracks   MusicTrack[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash") @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

model Project {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  title        String   @default("Untitled Reel") @db.VarChar(100)
  templateId   String?  @map("template_id") @db.VarChar(50)
  status       String   @default("draft") @db.VarChar(20)
  caption      String?
  hashtags     String[]
  musicTrackId String?  @map("music_track_id")
  exportFormat String?  @map("export_format") @db.VarChar(20)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  mediaAssets    MediaAsset[]
  editOperations EditOperation[]
  exportJobs     ExportJob[]
  subtitleJobs   SubtitleJob[]

  @@index([userId])
  @@index([userId, status])
  @@map("projects")
}

model MediaAsset {
  id            String   @id @default(uuid())
  projectId     String   @map("project_id")
  type          String   @db.VarChar(10)
  url           String
  duration      Decimal? @db.Decimal(10, 3)
  fileSizeBytes BigInt?  @map("file_size_bytes")
  orderIndex    Int      @default(0) @map("order_index")
  createdAt     DateTime @default(now()) @map("created_at")
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("media_assets")
}

model EditOperation {
  id            String   @id @default(uuid())
  projectId     String   @map("project_id")
  operationType String   @map("operation_type") @db.VarChar(20)
  clipIndex     Int      @map("clip_index")
  parameters    Json     @default("{}")
  orderIndex    Int      @default(0) @map("order_index")
  createdAt     DateTime @default(now()) @map("created_at")
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("edit_operations")
}

model ExportJob {
  id            String    @id @default(uuid())
  projectId     String    @map("project_id")
  userId        String    @map("user_id")
  format        String    @db.VarChar(20)
  quality       String    @default("hd") @db.VarChar(10)
  status        String    @default("queued") @db.VarChar(20)
  progress      Int       @default(0)
  videoUrl      String?   @map("video_url")
  fileSizeBytes BigInt?   @map("file_size_bytes")
  errorMessage  String?   @map("error_message")
  startedAt     DateTime? @map("started_at")
  completedAt   DateTime? @map("completed_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@index([projectId])
  @@index([userId])
  @@map("export_jobs")
}

model SubtitleJob {
  id           String    @id @default(uuid())
  projectId    String    @map("project_id")
  userId       String    @map("user_id")
  format       String    @default("srt") @db.VarChar(5)
  language     String    @default("en") @db.VarChar(5)
  status       String    @default("queued") @db.VarChar(20)
  progress     Int       @default(0)
  content      String?
  wordCount    Int?      @map("word_count")
  errorMessage String?   @map("error_message")
  startedAt    DateTime? @map("started_at")
  completedAt  DateTime? @map("completed_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@index([projectId])
  @@index([userId])
  @@map("subtitle_jobs")
}

model Template {
  id           String   @id @db.VarChar(50)
  name         String   @db.VarChar(100)
  category     String   @db.VarChar(20)
  previewUrl   String?  @map("preview_url")
  thumbnailUrl String?  @map("thumbnail_url")
  transitions  Json     @default("[]")
  textSlots    Json     @default("[]") @map("text_slots")
  duration     Int
  mediaSlots   Int      @default(5) @map("media_slots")
  aspectRatio  String   @default("9:16") @map("aspect_ratio") @db.VarChar(10)
  isPremium    Boolean  @default(false) @map("is_premium")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([category])
  @@map("templates")
}

model MusicTrack {
  id              String   @id @default(uuid())
  title           String   @db.VarChar(200)
  artist          String?  @db.VarChar(200)
  durationSeconds Int      @map("duration_seconds")
  genre           String?  @db.VarChar(50)
  category        String   @db.VarChar(20)
  previewUrl      String   @map("preview_url")
  fullUrl         String   @map("full_url")
  waveformUrl     String?  @map("waveform_url")
  isPremium       Boolean  @default(false) @map("is_premium")
  uploadedBy      String?  @map("uploaded_by")
  createdAt       DateTime @default(now()) @map("created_at")
  
  uploader User? @relation(fields: [uploadedBy], references: [id])

  @@index([category])
  @@index([genre])
  @@map("music_tracks")
}
```

---

## 5. Migration Strategy

### 5.1 Tool

Prisma Migrate for schema migrations (auto-generates SQL from Prisma schema changes).

### 5.2 Workflow

1. Modify `schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Review generated SQL in `prisma/migrations/`
4. Commit migration files to version control
5. Production: `npx prisma migrate deploy`

### 5.3 Seed Data

Templates and sample music tracks are seeded via `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.template.createMany({
    data: [
      {
        id: 'travel_template',
        name: 'Wanderlust',
        category: 'travel',
        transitions: [
          { type: 'fade', duration_ms: 500 },
          { type: 'zoom', duration_ms: 300 }
        ],
        textSlots: [
          { id: 'title', position: { x: 0.5, y: 0.15 }, style: 'bold_white' },
          { id: 'caption', position: { x: 0.5, y: 0.85 }, style: 'subtitle' }
        ],
        duration: 15,
        mediaSlots: 5,
      },
      // ... more templates
    ],
  });
}

main();
```

---

## 6. Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| users | `email` (UNIQUE) | Login lookup |
| projects | `(user_id, status)` | User's project listing with filter |
| projects | `updated_at DESC` | Sort by recent |
| media_assets | `(project_id, order_index)` | Ordered asset retrieval |
| export_jobs | `status` (partial: queued/processing) | Worker job polling |
| subtitle_jobs | `status` (partial: queued/processing) | Worker job polling |
| music_tracks | GIN full-text | Music search |

---

## 7. Data Retention & Cleanup

| Data | Retention | Cleanup Method |
|------|-----------|----------------|
| Export job records | 90 days after completion | Scheduled cron job |
| Exported video files (S3) | 7 days after creation | S3 lifecycle policy |
| Revoked refresh tokens | 30 days after revocation | Scheduled cron job |
| Deleted projects | Immediate (CASCADE) | Database cascading |
| Subtitle job results | 90 days after completion | Scheduled cron job |

---

## 8. Backup Strategy

| Aspect | Configuration |
|--------|--------------|
| Automated backups | Daily via RDS automated backups |
| Retention | 14 days |
| Point-in-time recovery | Enabled (5-minute granularity) |
| Cross-region replica | Staging: No / Production: Yes |
| Manual snapshots | Before major migrations |
