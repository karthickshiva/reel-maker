# Reel Maker — Backend Design Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Overview

The backend follows a microservices architecture. Each service is independently deployable, stateless, and communicates via REST APIs through an API Gateway. Heavy processing (AI inference, video encoding) is handled asynchronously via job queues.

---

## 2. Service Architecture

```
                    ┌──────────────────────────┐
                    │       API Gateway        │
                    │   (Express + Middleware)  │
                    └─────┬──────┬──────┬──────┘
                          │      │      │
              ┌───────────┘      │      └───────────┐
              ▼                  ▼                  ▼
     ┌────────────────┐ ┌──────────────┐ ┌────────────────┐
     │ User Service   │ │ AI Service   │ │ Export Service  │
     │ (Node.js)      │ │ (Node + Py)  │ │ (Node.js)      │
     └───────┬────────┘ └──────┬───────┘ └───────┬────────┘
             │                 │                  │
             ▼                 ▼                  ▼
     ┌──────────────┐  ┌─────────────┐   ┌──────────────┐
     │  PostgreSQL   │  │  Redis      │   │  S3 / GCS    │
     │  (Users, Proj)│  │  (Queue,    │   │  (Videos)    │
     │               │  │   Cache)    │   │              │
     └──────────────┘  └─────────────┘   └──────────────┘
```

---

## 3. Service Definitions

### 3.1 API Gateway

**Responsibility:** Single entry point for all client requests.

| Concern | Implementation |
|---------|---------------|
| Routing | Path-based routing to downstream services |
| Authentication | JWT validation middleware |
| Rate Limiting | Token bucket per user (via Redis) |
| Request Logging | Structured JSON logs |
| CORS | Configured for mobile + web origins |
| Request Validation | JSON Schema validation middleware |

**Tech:** Node.js, Express, `express-rate-limit`, `jsonwebtoken`, `helmet`

### 3.2 User Service

**Responsibility:** Authentication, user profiles, project management.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create new user account |
| `/auth/login` | POST | Authenticate and return JWT |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Invalidate refresh token |
| `/users/me` | GET | Get current user profile |
| `/users/me` | PATCH | Update user profile |
| `/projects` | GET | List user projects |
| `/projects` | POST | Create new project |
| `/projects/:id` | GET | Get project detail |
| `/projects/:id` | PATCH | Update project |
| `/projects/:id` | DELETE | Delete project |

**Tech:** Node.js, Express, Prisma ORM, PostgreSQL

### 3.3 AI Service

**Responsibility:** Caption generation and subtitle transcription.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/caption` | POST | Generate caption + hashtags |
| `/ai/subtitles` | POST | Transcribe audio → SRT/VTT |
| `/ai/subtitles/:jobId` | GET | Poll subtitle job status |

**Tech:**
- Caption: Node.js + OpenAI SDK
- Subtitles: Python + FastAPI + Whisper

**Processing Model:**
- Captions: Synchronous (< 3s response time)
- Subtitles: Asynchronous (job queue + polling)

### 3.4 Export Service

**Responsibility:** Server-side video rendering (fallback) and cloud storage.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video/export` | POST | Queue export job |
| `/video/export/:jobId` | GET | Poll export job status |
| `/video/:id/download` | GET | Get signed download URL |

**Tech:** Node.js, BullMQ, FFmpeg (server-side), AWS S3 SDK

---

## 4. Shared Infrastructure

### 4.1 Database (PostgreSQL)

Single PostgreSQL instance shared across services (separate schemas per service for logical isolation).

```
reel_maker_db
├── auth schema    → users, refresh_tokens
├── project schema → projects, media_assets, project_templates
└── export schema  → export_jobs
```

### 4.2 Redis

| Use Case | Configuration |
|----------|---------------|
| Rate limiting | Sliding window counters |
| Job queue (BullMQ) | Subtitle and export job queues |
| Session cache | Refresh token blacklist |
| Response cache | Template metadata (TTL: 1 hour) |

### 4.3 Object Storage (S3 / GCS)

| Bucket | Content | Access |
|--------|---------|--------|
| `reel-maker-exports` | Exported video files | Pre-signed URLs (1 hour expiry) |
| `reel-maker-uploads` | User-uploaded audio for subtitles | Service-only access |
| `reel-maker-assets` | Template assets, music library | Public CDN |

---

## 5. Service Directory Structure

### 5.1 Node.js Services (User, AI Caption, Export)

```
services/
├── gateway/
│   ├── src/
│   │   ├── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── routes/
│   │   │   └── proxy.ts
│   │   └── config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── user-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   └── projectController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   └── projectService.ts
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   ├── project.ts
│   │   │   └── mediaAsset.ts
│   │   ├── middleware/
│   │   │   └── validate.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   └── project.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── ai-service/
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   │   ├── captionController.ts
│   │   │   └── subtitleController.ts
│   │   ├── services/
│   │   │   ├── captionService.ts
│   │   │   └── subtitleQueueService.ts
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   └── gemini.ts
│   │   ├── routes/
│   │   │   └── ai.ts
│   │   └── config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── subtitle-worker/         # Python service
│   ├── app/
│   │   ├── main.py
│   │   ├── worker.py
│   │   ├── transcriber.py
│   │   ├── srt_converter.py
│   │   └── config.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── export-service/
    ├── src/
    │   ├── index.ts
    │   ├── controllers/
    │   │   └── exportController.ts
    │   ├── services/
    │   │   ├── exportService.ts
    │   │   ├── ffmpegService.ts
    │   │   └── storageService.ts
    │   ├── routes/
    │   │   └── export.ts
    │   └── config.ts
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

---

## 6. Authentication Flow

```
Client                  Gateway              User Service
  │                       │                       │
  ├──POST /auth/login────►│                       │
  │  {email, password}    ├──Forward──────────────►│
  │                       │                       ├──Validate credentials
  │                       │                       ├──Generate JWT pair
  │                       │◄──{access, refresh}───┤
  │◄──{access, refresh}──┤                       │
  │                       │                       │
  │  (15 min later)       │                       │
  │                       │                       │
  ├──POST /auth/refresh──►│                       │
  │  {refresh_token}      ├──Forward──────────────►│
  │                       │                       ├──Validate refresh token
  │                       │                       ├──Issue new access token
  │                       │◄──{access}────────────┤
  │◄──{access}────────────┤                       │
```

### JWT Payload Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1709942400,
  "exp": 1709943300,
  "type": "access"
}
```

---

## 7. Job Queue Architecture

### 7.1 Subtitle Processing Queue

```
Client                AI Service              Redis/BullMQ           Subtitle Worker
  │                      │                        │                       │
  ├──POST /ai/subtitles─►│                        │                       │
  │  {audio_file}        ├──Add job to queue──────►│                       │
  │                      │                        │                       │
  │◄──{jobId, status:    │                        │                       │
  │   "processing"}──────┤                        │                       │
  │                      │                        │                       │
  │                      │                        ├──Dequeue job─────────►│
  │                      │                        │                       ├──Transcribe
  │                      │                        │                       ├──Generate SRT
  │                      │                        │◄──Update job status───┤
  │                      │                        │   {status: "complete",│
  │                      │                        │    srt_url: "..."}    │
  │                      │                        │                       │
  ├──GET /ai/subtitles/  │                        │                       │
  │  :jobId ────────────►├──Check job status──────►│                       │
  │                      │◄──{complete, srt_url}──┤                       │
  │◄──{srt_data}─────────┤                        │                       │
```

### 7.2 Export Processing Queue

Same pattern as subtitle queue — client polls `GET /video/export/:jobId` until status is `complete`.

---

## 8. Error Handling

### 8.1 Standard Error Response Format

```json
{
  "error": {
    "code": "CAPTION_GENERATION_FAILED",
    "message": "Failed to generate caption. Please try again.",
    "details": "OpenAI API rate limit exceeded",
    "requestId": "req-uuid"
  }
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT expired |
| `AUTH_FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `PROJECT_NOT_FOUND` | 404 | Project ID does not exist |
| `CAPTION_GENERATION_FAILED` | 502 | OpenAI API error |
| `SUBTITLE_PROCESSING_FAILED` | 502 | Whisper transcription error |
| `EXPORT_FAILED` | 500 | FFmpeg or storage error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `FILE_TOO_LARGE` | 413 | Upload exceeds 200MB |

---

## 9. Logging & Observability

### 9.1 Log Format (Structured JSON)

```json
{
  "timestamp": "2026-03-09T10:30:00.000Z",
  "level": "info",
  "service": "ai-service",
  "requestId": "req-uuid",
  "userId": "user-uuid",
  "message": "Caption generated successfully",
  "duration_ms": 1200,
  "provider": "openai"
}
```

### 9.2 Key Metrics

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `request_duration_ms` | Histogram | p99 > 5000ms |
| `ai_api_latency_ms` | Histogram | p99 > 10000ms |
| `export_queue_depth` | Gauge | > 100 pending |
| `error_rate` | Counter | > 5% of requests |
| `active_connections` | Gauge | > 80% of pool |

---

## 10. Configuration Management

### 10.1 Environment Variables

```bash
# Common
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@host:5432/reel_maker_db

# Redis
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=<secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# OpenAI
OPENAI_API_KEY=<key>
OPENAI_MODEL=gpt-4o

# Whisper
WHISPER_MODEL=whisper-1

# Storage
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_BUCKET_EXPORTS=reel-maker-exports
S3_BUCKET_UPLOADS=reel-maker-uploads
S3_REGION=us-east-1
```

### 10.2 Configuration per Environment

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| Log level | debug | info | info |
| Rate limit | disabled | relaxed | strict |
| AI provider | OpenAI (mock) | OpenAI | OpenAI + Gemini fallback |
| Storage | Local filesystem | S3 | S3 + CDN |
| Database | Local PostgreSQL | RDS (small) | RDS (multi-AZ) |

---

## 11. Health Checks

Each service exposes:

```
GET /health
```

Response:

```json
{
  "status": "healthy",
  "service": "ai-service",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "openai": "reachable"
  }
}
```

Used by load balancer for routing and by monitoring for alerting.

---

## 12. Deployment

### 12.1 Docker Compose (Development)

```yaml
version: '3.8'
services:
  gateway:
    build: ./services/gateway
    ports: ['3000:3000']
    depends_on: [user-service, ai-service, export-service]

  user-service:
    build: ./services/user-service
    depends_on: [postgres]

  ai-service:
    build: ./services/ai-service
    depends_on: [redis]

  subtitle-worker:
    build: ./services/subtitle-worker
    depends_on: [redis]

  export-service:
    build: ./services/export-service
    depends_on: [redis, postgres]

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: reel_maker_db
      POSTGRES_USER: reel_maker
      POSTGRES_PASSWORD: dev_password
    volumes: ['pgdata:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

volumes:
  pgdata:
```

### 12.2 Production (Kubernetes)

- Each service gets a Deployment + Service + HPA
- Ingress controller routes to API Gateway
- Secrets managed via Kubernetes Secrets or AWS Secrets Manager
- Auto-scaling based on CPU (70%) and custom metrics (queue depth)
