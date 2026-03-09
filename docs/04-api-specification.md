# Reel Maker — API Specification Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft
**Base URL:** `https://api.reelmaker.app/v1`

---

## 1. Common Standards

### 1.1 Authentication

All endpoints (except `/auth/*`) require a Bearer token:

```
Authorization: Bearer <access_token>
```

### 1.2 Request/Response Format

- Content-Type: `application/json` (unless file upload)
- File uploads: `multipart/form-data`
- All timestamps: ISO 8601 format
- All IDs: UUID v4

### 1.3 Pagination

List endpoints support cursor-based pagination:

```
GET /projects?cursor=<last_id>&limit=20
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "uuid-of-last-item",
    "has_more": true
  }
}
```

### 1.4 Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Technical details (dev only)",
    "requestId": "req-uuid"
  }
}
```

---

## 2. Authentication APIs

### 2.1 Register

```
POST /auth/register
```

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123!"
}
```

**Validation:**
- `name`: 2–50 characters
- `email`: Valid email format, unique
- `password`: Min 8 characters, 1 uppercase, 1 number, 1 special char

**Response (201):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-03-09T10:00:00.000Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "dGhpcyBpcy...",
    "expires_in": 900
  }
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email taken |
| `VALIDATION_ERROR` | 400 | Invalid input |

---

### 2.2 Login

```
POST /auth/login
```

**Request:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123!"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "dGhpcyBpcy...",
    "expires_in": 900
  }
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password |

---

### 2.3 Refresh Token

```
POST /auth/refresh
```

**Request:**

```json
{
  "refresh_token": "dGhpcyBpcy..."
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOi...",
  "expires_in": 900
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| `AUTH_TOKEN_EXPIRED` | 401 | Refresh token expired |
| `AUTH_TOKEN_INVALID` | 401 | Token revoked or malformed |

---

### 2.4 Logout

```
POST /auth/logout
```

**Request:**

```json
{
  "refresh_token": "dGhpcyBpcy..."
}
```

**Response (204):** No content.

---

## 3. User APIs

### 3.1 Get Current User

```
GET /users/me
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://cdn.reelmaker.app/avatars/550e8400.jpg",
  "plan": "free",
  "projects_count": 12,
  "created_at": "2026-03-09T10:00:00.000Z"
}
```

### 3.2 Update User Profile

```
PATCH /users/me
```

**Request:**

```json
{
  "name": "John D.",
  "avatar_url": "https://cdn.reelmaker.app/avatars/new.jpg"
}
```

**Response (200):** Updated user object.

---

## 4. Project APIs

### 4.1 Create Project

```
POST /projects
```

**Request:**

```json
{
  "title": "My Travel Reel",
  "template_id": "travel_template"
}
```

**Response (201):**

```json
{
  "id": "project-uuid",
  "title": "My Travel Reel",
  "user_id": "user-uuid",
  "template_id": "travel_template",
  "status": "draft",
  "media_assets": [],
  "created_at": "2026-03-09T10:00:00.000Z",
  "updated_at": "2026-03-09T10:00:00.000Z"
}
```

### 4.2 List Projects

```
GET /projects?cursor=<id>&limit=20&status=draft
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | — | Pagination cursor |
| `limit` | number | 20 | Items per page (max 50) |
| `status` | string | — | Filter: draft, rendering, complete |

**Response (200):**

```json
{
  "data": [
    {
      "id": "project-uuid",
      "title": "My Travel Reel",
      "status": "draft",
      "thumbnail_url": "https://...",
      "updated_at": "2026-03-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "next_cursor": "project-uuid-2",
    "has_more": true
  }
}
```

### 4.3 Get Project

```
GET /projects/:id
```

**Response (200):**

```json
{
  "id": "project-uuid",
  "title": "My Travel Reel",
  "user_id": "user-uuid",
  "template_id": "travel_template",
  "status": "draft",
  "media_assets": [
    {
      "id": "media-uuid-1",
      "type": "image",
      "url": "file:///local/path/photo1.jpg",
      "duration": null,
      "order": 0
    },
    {
      "id": "media-uuid-2",
      "type": "video",
      "url": "file:///local/path/clip1.mp4",
      "duration": 8.5,
      "order": 1
    }
  ],
  "caption": "Escaping into the mountains",
  "hashtags": ["#travel", "#wanderlust"],
  "subtitle_url": null,
  "music_track_id": "track-uuid",
  "edit_operations": [
    { "type": "trim", "clip_index": 1, "start": 2.0, "end": 7.0 },
    { "type": "filter", "clip_index": 0, "filter_id": "warm" }
  ],
  "export_format": null,
  "created_at": "2026-03-09T10:00:00.000Z",
  "updated_at": "2026-03-09T11:30:00.000Z"
}
```

### 4.4 Update Project

```
PATCH /projects/:id
```

**Request (partial update):**

```json
{
  "title": "Kashmir Trip 2026",
  "caption": "Updated caption text",
  "template_id": "cinematic_template"
}
```

**Response (200):** Updated project object.

### 4.5 Add Media to Project

```
POST /projects/:id/media
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Media file (JPG, PNG, MP4, MOV) |
| `type` | string | "image" or "video" |
| `order` | number | Position in sequence |

**Response (201):**

```json
{
  "id": "media-uuid",
  "type": "video",
  "url": "https://storage.reelmaker.app/uploads/media-uuid.mp4",
  "duration": 12.3,
  "order": 2,
  "file_size_bytes": 15728640,
  "created_at": "2026-03-09T10:00:00.000Z"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| `FILE_TOO_LARGE` | 413 | File > 200MB |
| `UNSUPPORTED_FORMAT` | 415 | Not JPG/PNG/MP4/MOV |
| `MAX_ASSETS_REACHED` | 400 | More than 10 assets |

### 4.6 Delete Project

```
DELETE /projects/:id
```

**Response (204):** No content.

---

## 5. AI APIs

### 5.1 Generate Caption

```
POST /ai/caption
```

**Request:**

```json
{
  "topic": "Kashmir trip",
  "tone": "cinematic"
}
```

**Validation:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `topic` | string | Yes | 3–200 characters |
| `tone` | string | No | Enum: cinematic, funny, professional, casual, inspiring |

**Response (200):**

```json
{
  "caption": "Escaping into the mountains of Kashmir, where every breath feels like a prayer.",
  "hashtags": ["#travel", "#kashmir", "#wanderlust", "#mountains", "#incredibleindia"],
  "tone_used": "cinematic",
  "generated_at": "2026-03-09T10:00:00.000Z"
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| `CAPTION_GENERATION_FAILED` | 502 | AI provider error |
| `RATE_LIMIT_EXCEEDED` | 429 | > 30 req/min |

---

### 5.2 Generate Subtitles

```
POST /ai/subtitles
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio_file` | File | Yes | Audio/video file |
| `format` | string | No | "srt" (default) or "vtt" |
| `language` | string | No | ISO 639-1 code (default: "en") |

**Response (202 — Accepted):**

```json
{
  "job_id": "job-uuid",
  "status": "processing",
  "estimated_duration_seconds": 15,
  "poll_url": "/ai/subtitles/job-uuid"
}
```

### 5.3 Poll Subtitle Job Status

```
GET /ai/subtitles/:jobId
```

**Response (200) — Processing:**

```json
{
  "job_id": "job-uuid",
  "status": "processing",
  "progress": 65
}
```

**Response (200) — Complete:**

```json
{
  "job_id": "job-uuid",
  "status": "complete",
  "result": {
    "format": "srt",
    "content": "1\n00:00:01,000 --> 00:00:04,000\nWelcome to Kashmir\n\n2\n00:00:04,500 --> 00:00:08,000\nThe most beautiful place on earth\n",
    "word_count": 12,
    "duration_seconds": 8.0
  }
}
```

**Response (200) — Failed:**

```json
{
  "job_id": "job-uuid",
  "status": "failed",
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "Could not transcribe audio. Ensure the file contains clear speech."
  }
}
```

---

## 6. Export APIs

### 6.1 Export Video

```
POST /video/export
```

**Request:**

```json
{
  "project_id": "project-uuid",
  "format": "instagram",
  "quality": "hd"
}
```

**Validation:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `project_id` | string | Yes | Valid UUID |
| `format` | string | Yes | Enum: instagram, youtube_shorts, tiktok |
| `quality` | string | No | Enum: standard (720p), hd (1080p, default) |

**Response (202):**

```json
{
  "job_id": "export-job-uuid",
  "status": "queued",
  "poll_url": "/video/export/export-job-uuid"
}
```

### 6.2 Poll Export Status

```
GET /video/export/:jobId
```

**Response (200) — Complete:**

```json
{
  "job_id": "export-job-uuid",
  "status": "complete",
  "result": {
    "video_url": "https://cdn.reelmaker.app/exports/export-uuid.mp4",
    "file_size_bytes": 52428800,
    "duration_seconds": 15,
    "resolution": "1080x1920",
    "expires_at": "2026-03-10T10:00:00.000Z"
  }
}
```

### 6.3 Download Exported Video

```
GET /video/:id/download
```

**Response (302):** Redirects to pre-signed S3 URL.

---

## 7. Template APIs

### 7.1 List Templates

```
GET /templates?category=travel
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter: travel, makeup, promo, story, product |

**Response (200):**

```json
{
  "data": [
    {
      "id": "travel_template",
      "name": "Wanderlust",
      "category": "travel",
      "preview_url": "https://cdn.reelmaker.app/templates/travel_preview.mp4",
      "thumbnail_url": "https://cdn.reelmaker.app/templates/travel_thumb.jpg",
      "transitions": ["fade", "zoom"],
      "text_slots": ["title", "caption"],
      "duration": 15,
      "is_premium": false
    }
  ]
}
```

### 7.2 Get Template Detail

```
GET /templates/:id
```

**Response (200):**

```json
{
  "id": "travel_template",
  "name": "Wanderlust",
  "category": "travel",
  "preview_url": "https://cdn.reelmaker.app/templates/travel_preview.mp4",
  "transitions": [
    { "type": "fade", "duration_ms": 500, "position": "between_clips" },
    { "type": "zoom", "duration_ms": 300, "position": "clip_start" }
  ],
  "text_slots": [
    { "id": "title", "position": { "x": 0.5, "y": 0.15 }, "style": "bold_white", "max_chars": 30 },
    { "id": "caption", "position": { "x": 0.5, "y": 0.85 }, "style": "subtitle", "max_chars": 100 }
  ],
  "music_suggestion": "track-uuid",
  "duration": 15,
  "media_slots": 5,
  "aspect_ratio": "9:16"
}
```

---

## 8. Music APIs

### 8.1 List Music Tracks

```
GET /music?category=trending&search=summer
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | trending, royalty_free, user_upload |
| `search` | string | — | Search by name/genre |
| `cursor` | string | — | Pagination cursor |
| `limit` | number | 20 | Max 50 |

**Response (200):**

```json
{
  "data": [
    {
      "id": "track-uuid",
      "title": "Summer Vibes",
      "artist": "ChillBeats",
      "duration_seconds": 30,
      "genre": "lo-fi",
      "preview_url": "https://cdn.reelmaker.app/music/preview/track-uuid.mp3",
      "full_url": "https://cdn.reelmaker.app/music/full/track-uuid.mp3",
      "waveform_url": "https://cdn.reelmaker.app/music/waveform/track-uuid.json",
      "is_premium": false
    }
  ],
  "pagination": {
    "next_cursor": "track-uuid-2",
    "has_more": true
  }
}
```

---

## 9. Rate Limits Summary

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| `/auth/*` | 10 requests | per minute |
| `/ai/caption` | 30 requests | per minute |
| `/ai/subtitles` | 10 requests | per minute |
| `/video/export` | 5 requests | per minute |
| All other endpoints | 100 requests | per minute |

Rate limit headers included in every response:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1709942460
```
