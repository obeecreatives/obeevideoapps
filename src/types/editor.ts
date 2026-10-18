export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type FilterType =
  | 'none'
  | 'cinematic-teal'
  | 'cyberpunk'
  | 'vintage'
  | 'noir'
  | 'warm'
  | 'clean'
  | 'hdr';

export interface VideoFilterSettings {
  filter: FilterType;
  contrast: number; // 0.5 - 2.0 (default 1)
  saturation: number; // 0 - 2.5 (default 1)
  brightness: number; // 0.5 - 1.5 (default 1)
  vignette: number; // 0 - 1 (default 0)
  warmth: number; // -50 to 50 (default 0)
}

export interface VideoClip {
  id: string;
  sourceUrl: string;
  title: string;
  startSec: number;
  duration: number; // in project timeline
  sourceStartSec: number;
  sourceDuration: number;
  speed: number;
  volume: number;
  muted: boolean;
}

export interface BrollItem {
  id: string;
  title: string;
  type: 'video' | 'image' | 'procedural';
  url: string;
  startSec: number;
  duration: number;
  category: string;
  opacity: number;
  blendMode: 'source-over' | 'screen' | 'multiply' | 'overlay';
}

export interface CaptionItem {
  id: string;
  text: string;
  startSec: number;
  endSec: number;
  style: 'alex-hormozi' | 'neon-glow' | 'clean-minimal' | 'karaoke';
  color: string;
  highlightWord?: string;
  emoji?: string;
}

export interface StickerOverlay {
  id: string;
  text: string;
  type: 'badge' | 'callout' | 'subscribe' | 'highlight';
  startSec: number;
  endSec: number;
  xPercent: number;
  yPercent: number;
}

export interface ZoomKeyframe {
  id: string;
  startSec: number;
  endSec: number;
  scale: number;
  target: 'center' | 'top';
}

export interface StoryboardScene {
  scene: number;
  title: string;
  narration: string;
  visualBroll: string;
  audioCue: string;
  cutTiming: string;
}

export interface DirectorActionLog {
  id: string;
  timestamp: string;
  command: string;
  actionSummary: string;
  directorTip?: string;
  source: 'voice' | 'text' | 'image';
}

export interface SampleProject {
  id: string;
  title: string;
  category: string;
  aspectRatio: AspectRatio;
  videoUrl: string;
  duration: number;
  thumbnail: string;
  defaultCaptions: CaptionItem[];
  defaultBroll: BrollItem[];
  defaultFilter: VideoFilterSettings;
}
