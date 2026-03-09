# Reel Maker — System Architecture Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Overview

Reel Maker is a mobile application (iOS & Android) that enables users to create short-form vertical videos (Reels/Shorts) in under 60 seconds using templates and AI-assisted editing. The system follows a microservices backend architecture with a React Native mobile frontend.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE CLIENT                         │
│                  (React Native)                          │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Media    │ │ Template │ │  Video   │ │  Export   │  │
│  │  Manager  │ │  Engine  │ │  Editor  │ │  Service  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │             │            │              │        │
│  ┌────┴─────────────┴────────────┴──────────────┴────┐  │
│  │              FFmpeg Processing Layer               │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTPS / REST
                           ▼
┌──────────────────────────────────────────────────────────┐
│                     API GATEWAY                          │
│               (Rate Limiting, Auth, Routing)              │
└───────┬──────────────┬──────────────┬────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌──────────────┐
│  AI Caption  │ │ Subtitle  │ │   Export     │
│  Service     │ │  Service  │ │   Service    │
│  (Node.js)   │ │ (Python)  │ │  (Node.js)  │
└──────┬───────┘ └─────┬─────┘ └──────┬───────┘
       │               │              │
       ▼               ▼              ▼
┌──────────┐    ┌──────────┐   ┌───────────┐
│  OpenAI  │    │  Whisper  │   │   Object  │
│  API     │    │  API      │   │   Storage │
└──────────┘    └──────────┘   │  (S3/GCS) │
                               └───────────┘
```

---

## 3. Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Modularity** | Each feature is a self-contained module with clear boundaries |
| **Offline-First** | Media management and editing work offline; AI services require connectivity |
| **On-Device Processing** | Video rendering uses on-device FFmpeg to reduce server load and latency |
| **Thin Backend** | Backend handles AI calls and cloud export only — no video processing |
| **Stateless Services** | All backend microservices are stateless for horizontal scaling |

---

## 4. Component Architecture

### 4.1 Mobile Client (React Native)

| Component | Responsibility |
|-----------|---------------|
| **Media Manager** | Camera/gallery access, file validation, local storage |
| **Template Engine** | Load, preview, and apply reel templates |
| **Video Editor** | Trim, split, speed, filters, text overlay |
| **AI Caption UI** | Topic input, caption display, edit interface |
| **Subtitle Overlay** | Render subtitles on video preview and export |
| **Export Service** | Platform-specific encoding and sharing |
| **Music Library** | Browse, preview, and attach audio tracks |

### 4.2 Backend Microservices

| Service | Language | Responsibility | External Dependency |
|---------|----------|----------------|---------------------|
| **API Gateway** | Node.js | Auth, rate limiting, routing | — |
| **Caption Service** | Node.js | AI-powered caption & hashtag generation | OpenAI API |
| **Subtitle Service** | Python | Audio transcription → SRT/VTT | Whisper |
| **Export Service** | Node.js | Cloud rendering fallback, URL generation | Object Storage |
| **User Service** | Node.js | Auth, profile, project management | PostgreSQL |

### 4.3 External Services

| Service | Purpose |
|---------|---------|
| **OpenAI GPT** | Caption and hashtag generation |
| **OpenAI Whisper** | Speech-to-text for subtitle generation |
| **Google Gemini** | Optional alternative AI provider |
| **AWS S3 / GCS** | Exported video storage and CDN delivery |
| **Firebase** | Push notifications, analytics (future) |

---

## 5. Data Flow Diagrams

### 5.1 Reel Creation Flow

```
User                    App                     Backend
 │                       │                        │
 ├──Upload Media────────►│                        │
 │                       ├──Store Locally──►Local DB
 │                       │                        │
 ├──Select Template─────►│                        │
 │                       ├──Load Template Config   │
 │                       │                        │
 ├──Request Caption─────►│                        │
 │                       ├──POST /ai/caption─────►│
 │                       │                        ├──Call OpenAI
 │                       │◄──Caption Response─────┤
 │◄──Display Caption─────┤                        │
 │                       │                        │
 ├──Edit (optional)─────►│                        │
 │                       ├──FFmpeg Processing      │
 │                       │                        │
 ├──Export──────────────►│                        │
 │                       ├──FFmpeg Render           │
 │                       ├──POST /video/export───►│
 │                       │                        ├──Store in S3
 │                       │◄──video_url────────────┤
 │◄──Share Link──────────┤                        │
```

### 5.2 Subtitle Generation Flow

```
User              App                 Backend              Whisper
 │                 │                    │                     │
 ├──Request Subs──►│                    │                     │
 │                 ├──Extract Audio──►  │                     │
 │                 ├──POST /ai/subs───►│                     │
 │                 │                    ├──Send Audio────────►│
 │                 │                    │◄──Transcript────────┤
 │                 │                    ├──Convert to SRT      │
 │                 │◄──SRT File────────┤                     │
 │◄──Preview Subs──┤                    │                     │
```

---

## 6. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile Framework | React Native | 0.76+ |
| Navigation | React Navigation | 7.x |
| State Management | Zustand | 5.x |
| Video Processing | ffmpeg-kit-react-native | 6.x |
| Video Player | react-native-video | 6.x |
| Backend Runtime | Node.js | 22 LTS |
| Subtitle Service | Python / FastAPI | 3.12 / 0.115 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.x |
| Object Storage | AWS S3 or GCS | — |
| Container Orchestration | Kubernetes / ECS | — |
| CI/CD | GitHub Actions | — |
| Monitoring | Datadog / Grafana | — |

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

- **JWT-based auth** with access + refresh token pattern
- Access tokens: 15-minute expiry
- Refresh tokens: 30-day expiry, stored securely on device (Keychain / Keystore)
- API Gateway validates JWT on every request

### 7.2 Data Security

- All API communication over TLS 1.3
- Media files encrypted at rest in object storage (AES-256)
- No PII stored in logs
- API keys stored in environment variables, never committed to source

### 7.3 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/ai/caption` | 30 req/min per user |
| `/ai/subtitles` | 10 req/min per user |
| `/video/export` | 5 req/min per user |

---

## 8. Scalability Strategy

| Concern | Strategy |
|---------|----------|
| Compute | Horizontal pod autoscaling on K8s |
| AI Calls | Queue-based processing with Redis + BullMQ |
| Storage | CDN-fronted object storage with lifecycle policies |
| Database | Read replicas for query-heavy endpoints |
| Video Export | Async job queue — user notified on completion |

---

## 9. Deployment Architecture

```
┌──────────────┐     ┌──────────────┐
│  App Store   │     │ Google Play  │
│  (iOS)       │     │ (Android)    │
└──────┬───────┘     └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────────────────────────────┐
│           CDN (CloudFront/Akamai)    │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│           Load Balancer (ALB)        │
└───────┬──────────┬──────────┬────────┘
        ▼          ▼          ▼
   ┌─────────┐ ┌────────┐ ┌─────────┐
   │ Caption │ │Subtitle│ │ Export  │
   │ Service │ │Service │ │ Service │
   │ (x3)    │ │ (x3)   │ │ (x3)   │
   └────┬────┘ └───┬────┘ └────┬────┘
        │          │           │
        ▼          ▼           ▼
   ┌──────────────────────────────────┐
   │      PostgreSQL (Primary)       │
   │      + Read Replicas            │
   └──────────────────────────────────┘
```

---

## 10. Monitoring & Observability

| Aspect | Tool | Purpose |
|--------|------|---------|
| APM | Datadog / New Relic | Request tracing, latency |
| Logs | ELK Stack / CloudWatch | Centralized log aggregation |
| Metrics | Prometheus + Grafana | System and business metrics |
| Alerts | PagerDuty / Opsgenie | Incident response |
| Error Tracking | Sentry | Client + server error capture |

---

## 11. Failure Handling

| Scenario | Mitigation |
|----------|-----------|
| OpenAI API unavailable | Fallback to Gemini; queue retry with backoff |
| Whisper timeout | Return partial transcript; allow manual retry |
| FFmpeg crash on device | Graceful error UI; auto-save project state |
| Export failure | Async retry (3 attempts); notify user |
| Network loss during upload | Resume upload with chunked transfer |

---

## 12. Document References

| Document | File |
|----------|------|
| Frontend Design | `02-frontend-design.md` |
| Backend Design | `03-backend-design.md` |
| API Specification | `04-api-specification.md` |
| Database Design | `05-database-design.md` |
| AI Integration | `06-ai-integration.md` |
| Video Pipeline | `07-video-pipeline.md` |
| Project Setup | `08-project-setup.md` |
