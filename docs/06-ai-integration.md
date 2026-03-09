# Reel Maker — AI Integration Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Overview

The Reel Maker app uses AI for two primary features:

1. **Caption Generation** — Powered by OpenAI GPT (with Gemini as fallback)
2. **Subtitle Generation** — Powered by OpenAI Whisper

This document covers integration architecture, prompt design, error handling, cost estimation, and provider management.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AI Service Layer                       │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │  Caption Module   │    │   Subtitle Module         │   │
│  │                  │    │                          │   │
│  │  ┌────────────┐  │    │  ┌──────────────────┐   │   │
│  │  │  Provider   │  │    │  │  Audio Extractor  │   │   │
│  │  │  Manager    │  │    │  └────────┬─────────┘   │   │
│  │  └──────┬─────┘  │    │           │              │   │
│  │         │        │    │  ┌────────▼─────────┐   │   │
│  │    ┌────┴────┐   │    │  │  Whisper Client   │   │   │
│  │    │         │   │    │  └────────┬─────────┘   │   │
│  │  ┌─▼──┐  ┌──▼─┐ │    │           │              │   │
│  │  │ GPT│  │Gem.│ │    │  ┌────────▼─────────┐   │   │
│  │  └────┘  └────┘ │    │  │  SRT Converter    │   │   │
│  │                  │    │  └──────────────────┘   │   │
│  └──────────────────┘    └──────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Caption Generation

### 3.1 Provider: OpenAI GPT

**Model:** `gpt-4o`
**Fallback Model:** `gpt-4o-mini` (if rate limited or for cost savings)
**Optional Fallback Provider:** Google Gemini

### 3.2 System Prompt

```
You are a social media caption writer specializing in short-form video content
(Instagram Reels, YouTube Shorts, TikTok).

Your task is to generate a compelling caption and relevant hashtags based on
the given topic and tone.

Rules:
- Caption must be 1-3 sentences
- Caption should be engaging, scroll-stopping, and platform-appropriate
- Generate 5-8 relevant hashtags
- Hashtags should mix popular and niche tags
- Do not use emojis unless the tone is "funny" or "casual"
- Keep the total caption under 150 characters for optimal engagement
```

### 3.3 Request Format

```typescript
interface CaptionRequest {
  topic: string;       // 3-200 chars
  tone?: CaptionTone;  // defaults to "casual"
}

type CaptionTone = 'cinematic' | 'funny' | 'professional' | 'casual' | 'inspiring';
```

### 3.4 OpenAI API Call

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateCaption(topic: string, tone: string = 'casual'): Promise<CaptionResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Topic: ${topic}\nTone: ${tone}\n\nGenerate a caption and hashtags.`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'caption_response',
        schema: {
          type: 'object',
          properties: {
            caption: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } }
          },
          required: ['caption', 'hashtags']
        }
      }
    },
    max_tokens: 300,
    temperature: 0.8,
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 3.5 Tone-Specific Prompt Modifiers

| Tone | Modifier Added to User Prompt |
|------|-------------------------------|
| cinematic | "Use dramatic, visual language. Paint a picture with words." |
| funny | "Be witty and humorous. Use wordplay or relatable humor." |
| professional | "Keep it polished and brand-friendly. Suitable for business content." |
| casual | "Be conversational and friendly. Like talking to a friend." |
| inspiring | "Be motivational and uplifting. Inspire action or reflection." |

### 3.6 Response Validation

```typescript
interface CaptionResult {
  caption: string;
  hashtags: string[];
}

function validateCaptionResult(result: unknown): CaptionResult {
  if (!result || typeof result !== 'object') throw new Error('Invalid response');
  
  const { caption, hashtags } = result as Record<string, unknown>;
  
  if (typeof caption !== 'string' || caption.length === 0) {
    throw new Error('Caption is empty');
  }
  if (!Array.isArray(hashtags) || hashtags.length === 0) {
    throw new Error('No hashtags generated');
  }
  
  return {
    caption: caption.slice(0, 500),
    hashtags: hashtags
      .filter((h): h is string => typeof h === 'string')
      .map(h => h.startsWith('#') ? h : `#${h}`)
      .slice(0, 10),
  };
}
```

---

## 4. Subtitle Generation

### 4.1 Provider: OpenAI Whisper

**Model:** `whisper-1`
**Supported Input:** mp3, mp4, mpeg, mpga, m4a, wav, webm
**Max File Size:** 25MB (Whisper API limit)

### 4.2 Processing Pipeline

```
Input Video/Audio
       │
       ▼
┌─────────────────┐
│ Audio Extraction │  FFmpeg: extract audio as WAV/MP3
│ (if video input) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Chunking   │  Split audio > 25MB into segments
│  (if needed)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Whisper API Call │  Transcribe each chunk
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Merge Results   │  Combine chunk transcripts with
│                  │  adjusted timestamps
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SRT/VTT Convert │  Format into subtitle file
└────────┬────────┘
         │
         ▼
   Subtitle Output
```

### 4.3 Whisper API Call (Python Worker)

```python
import openai
from pathlib import Path

client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def transcribe_audio(audio_path: str, language: str = "en") -> dict:
    """Transcribe audio file using Whisper API."""
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language,
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )
    return transcript
```

### 4.4 SRT Conversion

```python
def transcript_to_srt(transcript: dict) -> str:
    """Convert Whisper transcript to SRT format."""
    srt_lines = []
    for i, segment in enumerate(transcript.segments, start=1):
        start = format_timestamp(segment["start"])
        end = format_timestamp(segment["end"])
        text = segment["text"].strip()
        srt_lines.append(f"{i}\n{start} --> {end}\n{text}\n")
    return "\n".join(srt_lines)


def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
```

### 4.5 VTT Conversion

```python
def transcript_to_vtt(transcript: dict) -> str:
    """Convert Whisper transcript to WebVTT format."""
    vtt_lines = ["WEBVTT\n"]
    for i, segment in enumerate(transcript.segments, start=1):
        start = format_timestamp_vtt(segment["start"])
        end = format_timestamp_vtt(segment["end"])
        text = segment["text"].strip()
        vtt_lines.append(f"{i}\n{start} --> {end}\n{text}\n")
    return "\n".join(vtt_lines)
```

---

## 5. Provider Management

### 5.1 Fallback Strategy

```typescript
class AIProviderManager {
  private providers: AIProvider[];

  async generateCaption(request: CaptionRequest): Promise<CaptionResult> {
    for (const provider of this.providers) {
      try {
        const result = await provider.generateCaption(request);
        return validateCaptionResult(result);
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed`, { error });
        if (this.isLastProvider(provider)) throw error;
      }
    }
    throw new Error('All providers failed');
  }
}
```

### 5.2 Provider Configuration

```typescript
const providers: ProviderConfig[] = [
  {
    name: 'openai',
    priority: 1,
    enabled: true,
    config: {
      model: 'gpt-4o',
      maxTokens: 300,
      temperature: 0.8,
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 30000,
    },
  },
  {
    name: 'gemini',
    priority: 2,
    enabled: true,
    config: {
      model: 'gemini-2.0-flash',
      maxTokens: 300,
      temperature: 0.8,
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 30000,
    },
  },
];
```

### 5.3 Gemini Integration (Fallback)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCaptionGemini(topic: string, tone: string): Promise<CaptionResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `${SYSTEM_PROMPT}\n\nTopic: ${topic}\nTone: ${tone}\n\nRespond in JSON: { "caption": "...", "hashtags": ["..."] }`;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  return validateCaptionResult(JSON.parse(text));
}
```

---

## 6. Error Handling

### 6.1 Error Classification

| Error Type | Retry | Fallback | User Message |
|-----------|-------|----------|-------------|
| Rate limit (429) | Yes, with backoff | Yes, try next provider | "Generating caption... (retrying)" |
| Auth error (401) | No | No | "Service configuration error" |
| Timeout | Yes (1 retry) | Yes | "Taking longer than expected, retrying..." |
| Invalid response | Yes (1 retry) | Yes | "Something went wrong, trying again..." |
| Content filter | No | Yes, modify prompt | "Could not generate for this topic" |
| Server error (5xx) | Yes, with backoff | Yes | "Service temporarily unavailable" |

### 6.2 Retry Configuration

```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503],
};
```

---

## 7. Cost Management

### 7.1 Per-Request Cost Estimates

| Feature | Model | Input Tokens | Output Tokens | Cost per Request |
|---------|-------|-------------|---------------|-----------------|
| Caption | gpt-4o | ~200 | ~150 | ~$0.002 |
| Caption | gpt-4o-mini | ~200 | ~150 | ~$0.0003 |
| Subtitle (30s audio) | whisper-1 | — | — | ~$0.006 |
| Subtitle (60s audio) | whisper-1 | — | — | ~$0.012 |

### 7.2 Monthly Cost Projections (50,000 daily reels)

| Scenario | Assumption | Monthly Cost |
|----------|-----------|-------------|
| Conservative | 30% use captions, 10% use subtitles | ~$1,500 |
| Moderate | 50% use captions, 25% use subtitles | ~$4,000 |
| Aggressive | 80% use captions, 40% use subtitles | ~$8,500 |

### 7.3 Cost Optimization Strategies

| Strategy | Impact |
|----------|--------|
| Use `gpt-4o-mini` for free-tier users | 85% caption cost reduction |
| Cache common caption topics | 20-30% reduction in API calls |
| Client-side audio trimming before Whisper | Reduce audio length = reduce cost |
| Batch subtitle processing during off-peak | Better rate limit utilization |
| Set `max_tokens` strictly | Prevent runaway token consumption |

---

## 8. Content Safety

### 8.1 Input Sanitization

```typescript
function sanitizeTopic(topic: string): string {
  return topic
    .trim()
    .slice(0, 200)
    .replace(/[<>]/g, '');
}
```

### 8.2 Output Filtering

- OpenAI's built-in content filter handles most cases
- Additional post-processing removes any unexpected content
- Profanity filter for generated hashtags
- Log and flag content filter triggers for review

### 8.3 Prompt Injection Prevention

- System prompt is fixed and not user-modifiable
- User input is placed in a clearly delineated user message
- Response format is constrained to JSON schema
- Output is validated against expected structure before returning

---

## 9. Monitoring & Alerts

### 9.1 Key Metrics to Track

| Metric | Alert Threshold |
|--------|----------------|
| Caption generation latency (p95) | > 5 seconds |
| Subtitle processing time (p95) | > 30 seconds |
| AI provider error rate | > 5% |
| Monthly token consumption | > 80% of budget |
| Fallback provider activation rate | > 10% |

### 9.2 Logging

Every AI API call logs:

```json
{
  "event": "ai_api_call",
  "provider": "openai",
  "model": "gpt-4o",
  "feature": "caption",
  "input_tokens": 195,
  "output_tokens": 142,
  "latency_ms": 1200,
  "success": true,
  "user_id": "user-uuid",
  "request_id": "req-uuid"
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Prompt construction with various topic/tone combinations
- Response validation and edge cases
- SRT/VTT conversion accuracy
- Provider fallback logic

### 10.2 Integration Tests

- Real API calls with test keys (limited test suite)
- Mock API responses for CI/CD pipeline
- Subtitle pipeline end-to-end with sample audio

### 10.3 Test Fixtures

```json
{
  "caption_test_cases": [
    {
      "input": { "topic": "beach sunset", "tone": "cinematic" },
      "expected_caption_length_range": [20, 150],
      "expected_hashtag_count_range": [5, 8]
    },
    {
      "input": { "topic": "cooking tutorial", "tone": "casual" },
      "expected_caption_length_range": [20, 150],
      "expected_hashtag_count_range": [5, 8]
    }
  ]
}
```
