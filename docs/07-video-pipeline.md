# Reel Maker — Video Processing Pipeline Document

**Version:** 1.0
**Last Updated:** 2026-03-09
**Status:** Draft

---

## 1. Overview

Video processing in Reel Maker is primarily performed **on-device** using FFmpeg (via `ffmpeg-kit-react-native`). This approach minimizes server costs, reduces latency, and enables offline editing. Server-side processing is reserved as a fallback for complex exports.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                  Mobile Device                   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │          FFmpeg Processing Layer          │   │
│  │                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │  Import   │  │  Edit    │  │ Export │ │   │
│  │  │  Pipeline │  │  Pipeline│  │Pipeline│ │   │
│  │  └──────────┘  └──────────┘  └────────┘ │   │
│  │                                          │   │
│  │  ┌──────────────────────────────────┐    │   │
│  │  │      FFmpeg Command Builder       │    │   │
│  │  └──────────────────────────────────┘    │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │         Local File System                 │   │
│  │  /tmp/reel-maker/projects/<project_id>/   │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 3. FFmpeg Kit Integration

### 3.1 Library

**Package:** `ffmpeg-kit-react-native`
**Variant:** `full` (includes all codecs and filters)

### 3.2 Installation

```bash
npm install ffmpeg-kit-react-native

# iOS
cd ios && pod install

# Android: Add to build.gradle
ext {
    ffmpegKitPackage = "full"
}
```

### 3.3 Core Service Interface

```typescript
import { FFmpegKit, FFmpegSession, ReturnCode } from 'ffmpeg-kit-react-native';

class FFmpegService {
  async execute(command: string): Promise<FFmpegResult> {
    const session: FFmpegSession = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();
    
    if (ReturnCode.isSuccess(returnCode)) {
      return { success: true, output: await session.getOutput() };
    }
    
    const logs = await session.getLogs();
    throw new FFmpegError(`FFmpeg failed: ${logs}`);
  }

  async executeWithProgress(
    command: string,
    onProgress: (progress: number) => void
  ): Promise<FFmpegResult> {
    return new Promise((resolve, reject) => {
      FFmpegKit.executeAsync(
        command,
        async (session) => {
          const returnCode = await session.getReturnCode();
          if (ReturnCode.isSuccess(returnCode)) {
            resolve({ success: true });
          } else {
            reject(new FFmpegError('FFmpeg processing failed'));
          }
        },
        (log) => { /* log callback */ },
        (statistics) => {
          const time = statistics.getTime();
          if (time > 0) onProgress(time);
        }
      );
    });
  }
}
```

---

## 4. Processing Pipelines

### 4.1 Media Import Pipeline

Takes raw user media and normalizes it for editing.

```
Input (JPG/PNG/MP4/MOV)
         │
         ▼
┌─────────────────────┐
│  Format Detection    │  Probe file metadata
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Image      Video
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Resize │ │ Transcode    │
│ to     │ │ to standard  │
│ 1080x  │ │ format       │
│ 1920   │ │              │
└───┬────┘ └──────┬───────┘
    │              │
    ▼              ▼
┌─────────────────────┐
│ Generate Thumbnail   │  Extract first frame / resize image
└────────┬────────────┘
         │
         ▼
   Normalized Asset
```

**FFmpeg Commands:**

```bash
# Image: Resize and pad to 9:16 (1080x1920)
ffmpeg -i input.jpg -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" output.jpg

# Video: Transcode to standard format
ffmpeg -i input.mov -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -r 30 output.mp4

# Generate thumbnail
ffmpeg -i input.mp4 -vframes 1 -vf "scale=270:480" -q:v 5 thumbnail.jpg

# Probe metadata
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
```

### 4.2 Edit Pipeline

#### 4.2.1 Trim

```bash
# Trim video from 3s to 10s
ffmpeg -i input.mp4 -ss 3 -to 10 -c:v libx264 -c:a aac -avoid_negative_ts make_zero output.mp4
```

```typescript
function buildTrimCommand(input: string, output: string, start: number, end: number): string {
  return `-i ${input} -ss ${start} -to ${end} -c:v libx264 -c:a aac -avoid_negative_ts make_zero ${output}`;
}
```

#### 4.2.2 Split

```bash
# Split at position 5s → two output files
ffmpeg -i input.mp4 -t 5 -c copy part1.mp4
ffmpeg -i input.mp4 -ss 5 -c copy part2.mp4
```

#### 4.2.3 Speed Adjustment

```bash
# 2x speed
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" output.mp4

# 0.5x speed (slow motion)
ffmpeg -i input.mp4 -vf "setpts=2.0*PTS" -af "atempo=0.5" output.mp4
```

```typescript
function buildSpeedCommand(input: string, output: string, factor: number): string {
  const videoPts = (1 / factor).toFixed(4);
  
  let audioFilter: string;
  if (factor <= 0.5) audioFilter = `atempo=0.5,atempo=${factor / 0.5}`;
  else if (factor >= 2.0) audioFilter = `atempo=2.0,atempo=${factor / 2.0}`;
  else audioFilter = `atempo=${factor}`;

  return `-i ${input} -vf "setpts=${videoPts}*PTS" -af "${audioFilter}" ${output}`;
}
```

#### 4.2.4 Filters

| Filter ID | FFmpeg Filter | Description |
|-----------|--------------|-------------|
| warm | `colortemperature=temperature=6500` | Warm tone |
| cool | `colortemperature=temperature=3500` | Cool/blue tone |
| vintage | `curves=vintage` | Retro film look |
| bw | `hue=s=0` | Black and white |
| vivid | `eq=saturation=1.5:contrast=1.1` | High saturation |
| fade | `eq=brightness=0.06:gamma=1.2` | Faded/matte look |
| sharp | `unsharp=5:5:1.0` | Sharpened |

```bash
# Apply warm filter
ffmpeg -i input.mp4 -vf "colortemperature=temperature=6500" -c:a copy output.mp4
```

#### 4.2.5 Text Overlay

```bash
# Add text overlay
ffmpeg -i input.mp4 -vf "drawtext=text='Hello World':fontsize=48:fontcolor=white:x=(w-tw)/2:y=(h-th)*0.15:fontfile=/path/to/font.ttf:shadowcolor=black:shadowx=2:shadowy=2" -c:a copy output.mp4
```

```typescript
interface TextOverlayConfig {
  text: string;
  fontSize: number;
  fontColor: string;
  x: number;       // 0-1 relative position
  y: number;       // 0-1 relative position
  fontFile: string;
  shadow: boolean;
  startTime?: number;
  endTime?: number;
}

function buildTextOverlayFilter(config: TextOverlayConfig): string {
  const x = `(w-tw)*${config.x}`;
  const y = `(h-th)*${config.y}`;
  let filter = `drawtext=text='${escapeText(config.text)}':fontsize=${config.fontSize}:fontcolor=${config.fontColor}:x=${x}:y=${y}:fontfile=${config.fontFile}`;
  
  if (config.shadow) filter += `:shadowcolor=black:shadowx=2:shadowy=2`;
  if (config.startTime !== undefined) filter += `:enable='between(t,${config.startTime},${config.endTime})'`;
  
  return filter;
}
```

### 4.3 Template Application Pipeline

```
Selected Media (1-10 clips)
         │
         ▼
┌─────────────────────┐
│ Duration Calculator  │  Calculate per-clip duration
│                     │  based on template total
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Clip Trimming        │  Trim each clip to allocated duration
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Transition Builder   │  Build filter graph for transitions
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Text Slot Renderer   │  Overlay template text elements
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Concatenation        │  Merge all processed clips
└────────┬────────────┘
         │
         ▼
   Template Preview
```

#### Transition FFmpeg Examples

```bash
# Fade transition between two clips (1s crossfade)
ffmpeg -i clip1.mp4 -i clip2.mp4 -filter_complex \
  "[0:v]trim=0:5,setpts=PTS-STARTPTS[v0]; \
   [1:v]trim=0:5,setpts=PTS-STARTPTS[v1]; \
   [v0][v1]xfade=transition=fade:duration=1:offset=4[outv]; \
   [0:a][1:a]acrossfade=d=1[outa]" \
  -map "[outv]" -map "[outa]" output.mp4

# Zoom transition
# ... offset=4 refers to when transition starts (4s into first clip)
ffmpeg -i clip1.mp4 -i clip2.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=smoothup:duration=0.5:offset=4[outv]" \
  -map "[outv]" output.mp4
```

### 4.4 Subtitle Overlay Pipeline

```bash
# Burn subtitles into video
ffmpeg -i input.mp4 -vf "subtitles=subtitles.srt:force_style='FontName=Arial,FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'" output.mp4
```

```typescript
interface SubtitleStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string;  // ASS color format
  outlineColor: string;
  outlineWidth: number;
  alignment: number;     // 2 = bottom center
}

function buildSubtitleFilter(srtPath: string, style: SubtitleStyle): string {
  return `subtitles=${srtPath}:force_style='FontName=${style.fontName},FontSize=${style.fontSize},PrimaryColour=${style.primaryColor},OutlineColour=${style.outlineColor},Outline=${style.outlineWidth},Alignment=${style.alignment}'`;
}
```

### 4.5 Audio/Music Pipeline

```bash
# Mix background music with video audio
ffmpeg -i video.mp4 -i music.mp3 -filter_complex \
  "[1:a]volume=0.3[music]; \
   [0:a][music]amix=inputs=2:duration=shortest[outa]" \
  -map 0:v -map "[outa]" -c:v copy output.mp4

# Replace audio entirely
ffmpeg -i video.mp4 -i music.mp3 -map 0:v -map 1:a -shortest output.mp4

# Extract audio for subtitle generation
ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
```

---

## 5. Export Pipeline

### 5.1 Final Render Flow

```
Project State
     │
     ▼
┌────────────────┐
│ Collect Assets  │  Gather all clips, overlays, audio
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Build Complex   │  Construct full FFmpeg filter graph
│ Filter Graph    │  combining all operations
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Execute Render  │  Run FFmpeg with progress tracking
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Platform Encode │  Re-encode for target platform specs
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Save / Upload   │  Save locally + optional cloud upload
└────────────────┘
```

### 5.2 Platform-Specific Export Settings

| Setting | Instagram | YouTube Shorts | TikTok |
|---------|-----------|---------------|--------|
| Resolution | 1080x1920 | 1080x1920 | 1080x1920 |
| Aspect Ratio | 9:16 | 9:16 | 9:16 |
| Max Duration | 90s | 60s | 60s |
| Codec | H.264 | H.264 | H.264 |
| Audio Codec | AAC | AAC | AAC |
| Audio Bitrate | 128 kbps | 128 kbps | 128 kbps |
| Video Bitrate | 5 Mbps | 8 Mbps | 5 Mbps |
| Frame Rate | 30 fps | 30 fps | 30 fps |
| Container | MP4 | MP4 | MP4 |
| Max File Size | 250 MB | 256 MB | 287 MB |

### 5.3 Export Command Builder

```typescript
interface ExportConfig {
  format: 'instagram' | 'youtube_shorts' | 'tiktok';
  quality: 'standard' | 'hd';
}

const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  instagram: {
    videoBitrate: '5M',
    audioBitrate: '128k',
    maxDuration: 90,
    maxFileSize: 250 * 1024 * 1024,
  },
  youtube_shorts: {
    videoBitrate: '8M',
    audioBitrate: '128k',
    maxDuration: 60,
    maxFileSize: 256 * 1024 * 1024,
  },
  tiktok: {
    videoBitrate: '5M',
    audioBitrate: '128k',
    maxDuration: 60,
    maxFileSize: 287 * 1024 * 1024,
  },
};

function buildExportCommand(
  inputPath: string,
  outputPath: string,
  config: ExportConfig,
  filterGraph?: string
): string {
  const preset = PLATFORM_PRESETS[config.format];
  const resolution = config.quality === 'hd' ? '1080:1920' : '720:1280';

  let command = `-i ${inputPath}`;
  
  if (filterGraph) command += ` -filter_complex "${filterGraph}"`;
  
  command += ` -c:v libx264 -preset medium -b:v ${preset.videoBitrate}`;
  command += ` -c:a aac -b:a ${preset.audioBitrate}`;
  command += ` -vf scale=${resolution}:force_original_aspect_ratio=decrease,pad=${resolution}:(ow-iw)/2:(oh-ih)/2:black`;
  command += ` -r 30 -pix_fmt yuv420p`;
  command += ` -movflags +faststart`;
  command += ` -t ${preset.maxDuration}`;
  command += ` ${outputPath}`;

  return command;
}
```

---

## 6. File Management

### 6.1 Directory Structure (On-Device)

```
/app-data/reel-maker/
├── projects/
│   └── <project-id>/
│       ├── originals/        # Raw uploaded media
│       │   ├── img_001.jpg
│       │   └── clip_001.mp4
│       ├── processed/        # Normalized media
│       │   ├── img_001_1080.jpg
│       │   └── clip_001_norm.mp4
│       ├── thumbnails/       # Generated thumbnails
│       │   ├── img_001_thumb.jpg
│       │   └── clip_001_thumb.jpg
│       ├── temp/             # Intermediate processing files
│       │   └── *.mp4
│       ├── audio/            # Extracted/mixed audio
│       │   └── extracted.wav
│       ├── subtitles/        # Generated subtitle files
│       │   └── subtitles.srt
│       └── export/           # Final exported videos
│           └── reel_final.mp4
└── cache/
    ├── templates/            # Cached template assets
    └── music/                # Cached music previews
```

### 6.2 Cleanup Strategy

| Directory | Cleanup Trigger | Policy |
|-----------|----------------|--------|
| `temp/` | After each edit operation completes | Immediate delete |
| `processed/` | On project delete | Cascade delete |
| `export/` | After share/upload complete | Keep 3 most recent |
| `cache/templates/` | App startup | LRU, max 500MB |
| `cache/music/` | App startup | LRU, max 200MB |

---

## 7. Performance Benchmarks

Target performance on mid-range devices (e.g., iPhone 12 / Pixel 6):

| Operation | Target Time | Method |
|-----------|-------------|--------|
| Image normalize (1080p) | < 1s | Single FFmpeg call |
| Video normalize (10s clip) | < 5s | Hardware-accelerated encode |
| Trim operation | < 2s | Stream copy when possible |
| Apply filter (10s clip) | < 4s | GPU-accelerated filter |
| Text overlay render | < 3s | `drawtext` filter |
| Subtitle burn-in (15s) | < 5s | `subtitles` filter |
| Full export (15s reel, HD) | < 30s | Full pipeline |
| Full export (30s reel, HD) | < 50s | Full pipeline |
| Thumbnail generation | < 0.5s | Single frame extract |

---

## 8. Error Recovery

| Failure | Recovery Strategy |
|---------|-------------------|
| FFmpeg crash mid-edit | Auto-save project state every 5 operations; restore from last save |
| Insufficient storage | Check available space before operation; warn user at < 500MB |
| Corrupt output file | Validate output with `ffprobe`; retry operation once |
| Memory pressure | Reduce preview resolution; process one clip at a time |
| Background task killed (iOS) | Save progress; resume on next app foreground |

---

## 9. Testing

### 9.1 Test Matrix

| Test Case | Input | Expected Output |
|-----------|-------|----------------|
| Import JPG (landscape) | 1920x1080 JPG | 1080x1920 with letterboxing |
| Import MP4 (4K) | 3840x2160 MP4 | 1080x1920 normalized |
| Trim 0-5s | 10s video | 5s video |
| Speed 2x | 10s video | 5s video |
| Speed 0.5x | 10s video | 20s video |
| Filter: B&W | Color video | Desaturated video |
| Export Instagram | Edited project | 1080x1920, H264, ≤90s |
| Subtitle burn-in | Video + SRT | Video with visible subtitles |
| Concatenate 5 clips | 5 x 3s clips | 15s merged video |

### 9.2 Automated Testing

```typescript
describe('FFmpegService', () => {
  it('should trim video accurately', async () => {
    const result = await ffmpegService.trim('test_10s.mp4', 'output.mp4', 2, 7);
    const probe = await ffmpegService.probe('output.mp4');
    expect(probe.duration).toBeCloseTo(5, 0.5);
  });

  it('should apply speed change', async () => {
    const result = await ffmpegService.speed('test_10s.mp4', 'output.mp4', 2.0);
    const probe = await ffmpegService.probe('output.mp4');
    expect(probe.duration).toBeCloseTo(5, 0.5);
  });

  it('should export in correct resolution', async () => {
    const result = await ffmpegService.export('project.mp4', 'output.mp4', { format: 'instagram', quality: 'hd' });
    const probe = await ffmpegService.probe('output.mp4');
    expect(probe.width).toBe(1080);
    expect(probe.height).toBe(1920);
  });
});
```
