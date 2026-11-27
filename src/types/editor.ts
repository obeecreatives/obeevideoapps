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

export type PreviewQuality = 'draft' | 'normal' | 'high';

export type TemplateLayoutType =
  | 'solo'
  | 'split-vertical'
  | 'split-horizontal'
  | 'pip'
  | 'reaction-frame';

export type PipPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'center';

export interface LayoutSettings {
  type: TemplateLayoutType;
  swapSlots: boolean;
  splitRatio: number; // 0.25 to 0.75, default 0.5
  pipScale: number; // 0.20 to 0.60, default 0.35 (35% scale)
  pipPosition: PipPosition;
  slot1ClipId?: string;
  slot2ClipId?: string;
  showDivider: boolean;
  dividerColor: string;
}

export type ExplainerTheme =
  | 'smartboard-dark'
  | 'corporate-clean'
  | 'editorial-warm'
  | 'cyber-neon';

export type ExplainerSlideLayout =
  | 'hero-hook'
  | 'bullet-steps'
  | 'comparison-flow'
  | 'big-stat'
  | 'cta-finale';

export type ExplainerVoiceName = 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';

export interface ExplainerSlideItem {
  icon: string;
  title: string;
  desc: string;
  color?: string;
}

export interface ExplainerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle?: string;
  layout: ExplainerSlideLayout;
  narration: string;
  startSec: number;
  endSec: number;
  accentColor: string;
  items: ExplainerSlideItem[];
  leftColumnTitle?: string;
  rightColumnTitle?: string;
  rightItems?: ExplainerSlideItem[];
  highlightStat?: string;
  highlightLabel?: string;
}

export interface ExplainerProject {
  id: string;
  title: string;
  subtitle: string;
  videoType: 'tutorial' | 'iklan' | 'editorial';
  theme: ExplainerTheme;
  voiceName: ExplainerVoiceName;
  fullNarration: string;
  audioUrl?: string;
  slides: ExplainerSlide[];
  totalDuration: number;
  active: boolean;
}


