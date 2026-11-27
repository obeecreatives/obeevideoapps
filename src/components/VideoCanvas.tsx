import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  AspectRatio,
  VideoFilterSettings,
  CaptionItem,
  BrollItem,
  StickerOverlay,
  ZoomKeyframe,
  VideoClip,
  LayoutSettings,
  PreviewQuality,
  PipPosition,
  ExplainerProject,
} from '../types/editor';
import { renderExplainerBoard } from '../utils/explainerRenderer';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  Sliders,
  Gauge,
  Check,
  ChevronDown,
  Columns2,
  Rows2,
  PictureInPicture2,
  Move,
} from 'lucide-react';

interface VideoCanvasProps {
  videoUrl: string;
  videoClips?: VideoClip[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  aspectRatio: AspectRatio;
  filterSettings: VideoFilterSettings;
  captions: CaptionItem[];
  brolls: BrollItem[];
  stickers: StickerOverlay[];
  zoomKeyframes: ZoomKeyframe[];
  audioDucking: boolean;
  layoutSettings: LayoutSettings;
  previewQuality: PreviewQuality;
  explainerProject?: ExplainerProject | null;
  onExplainerAudioDuration?: (dur: number) => void;
  onPreviewQualityChange: (quality: PreviewQuality) => void;
  onUpdateLayoutSettings: (settings: LayoutSettings) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onTogglePlay: () => void;
  canvasRefOut?: React.RefObject<HTMLCanvasElement | null>;
  videoRefOut?: React.RefObject<HTMLVideoElement | null>;
  audioRefOut?: React.RefObject<HTMLAudioElement | null>;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  videoUrl,
  videoClips,
  isPlaying,
  currentTime,
  duration,
  aspectRatio,
  filterSettings,
  captions,
  brolls,
  stickers,
  zoomKeyframes,
  audioDucking,
  layoutSettings,
  previewQuality,
  explainerProject,
  onExplainerAudioDuration,
  onPreviewQualityChange,
  onUpdateLayoutSettings,
  onTimeUpdate,
  onDurationChange,
  onTogglePlay,
  canvasRefOut,
  videoRefOut,
  audioRefOut,
}) => {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  const canvasRef = canvasRefOut || localCanvasRef;
  const videoRef = videoRefOut || localVideoRef;
  const audioRef = audioRefOut || localAudioRef;
  const isExplainerActive = Boolean(explainerProject?.active && explainerProject.slides.length > 0);

  const [isMuted, setIsMuted] = useState(false);
  const [activeBrollTitle, setActiveBrollTitle] = useState<string | null>(null);
  const [activeCaptionText, setActiveCaptionText] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  // Quality menu and Layout quick menu dropdown states
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);

  // Cached video elements for multi-clip / multi-slot playback
  const clipVideosMap = useRef<Map<string, HTMLVideoElement>>(new Map());
  const currentTimeRef = useRef<number>(currentTime);
  const lastStateUpdateTimeRef = useRef<number>(0);

  // Keep internal ref in sync with prop
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Normalize clips to use
  const clipsToUse: VideoClip[] = useMemo(() => {
    if (videoClips && videoClips.length > 0) return videoClips;
    return [
      {
        id: 'single-master',
        sourceUrl: videoUrl,
        title: 'Master Footage',
        startSec: 0,
        duration: duration || 15,
        sourceStartSec: 0,
        sourceDuration: duration || 15,
        speed: 1,
        volume: 1,
        muted: false,
      },
    ];
  }, [videoClips, videoUrl, duration]);

  // Find active clip based on currentTime
  const activeClipIndex = useMemo(() => {
    const idx = clipsToUse.findIndex(
      (c) => currentTime >= c.startSec && currentTime < c.startSec + c.duration
    );
    return idx !== -1 ? idx : Math.max(0, clipsToUse.length - 1);
  }, [clipsToUse, currentTime]);

  const activeClip = clipsToUse[activeClipIndex] || clipsToUse[0];

  // Secondary clip for multi-slot templates (Split / PIP)
  const secondaryClip = useMemo(() => {
    if (clipsToUse.length > 1) {
      // Find clip other than activeClip or take clip 1
      const otherIdx = clipsToUse.findIndex((_, i) => i !== activeClipIndex);
      return otherIdx !== -1 ? clipsToUse[otherIdx] : clipsToUse[1] || clipsToUse[0];
    }
    // Fallback secondary video stream so split/PIP preview works immediately
    return {
      id: 'secondary-sample',
      sourceUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      title: 'Secondary Stream (Reels)',
      startSec: 0,
      duration: duration || 15,
      sourceStartSec: 0,
      sourceDuration: duration || 15,
      speed: 1,
      volume: 0,
      muted: true,
    };
  }, [clipsToUse, activeClipIndex, duration]);

  // Pre-instantiate and buffer video elements for each clip
  useEffect(() => {
    const allUrls = [
      ...clipsToUse.map((c) => c.sourceUrl),
      secondaryClip.sourceUrl,
      videoUrl,
    ];

    allUrls.forEach((url) => {
      if (url && !clipVideosMap.current.has(url)) {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.playsInline = true;
        v.muted = isMuted;
        v.src = url;
        v.preload = 'auto';
        clipVideosMap.current.set(url, v);
      } else if (url) {
        const v = clipVideosMap.current.get(url);
        if (v) v.muted = isMuted;
      }
    });
  }, [clipsToUse, secondaryClip, videoUrl, isMuted]);

  // Helper to get active video element
  const getActiveVideo = useCallback((): HTMLVideoElement | null => {
    if (clipsToUse.length > 1) {
      return clipVideosMap.current.get(activeClip.sourceUrl) || videoRef.current;
    }
    return videoRef.current;
  }, [clipsToUse, activeClip, videoRef]);

  // Helper to get secondary video element for layouts
  const getSecondaryVideo = useCallback((): HTMLVideoElement | null => {
    return clipVideosMap.current.get(secondaryClip.sourceUrl) || null;
  }, [secondaryClip]);

  // Cache B-roll images
  useEffect(() => {
    brolls.forEach((b) => {
      if (b.type === 'image' && b.url && !loadedImages.has(b.url)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = b.url;
        img.onload = () => {
          setLoadedImages((prev) => new Map(prev).set(b.url, img));
        };
      }
    });
  }, [brolls, loadedImages]);

  // Synchronize play/pause for videos and AI Explainer voiceover audio
  useEffect(() => {
    const activeVid = getActiveVideo();
    const secVid = getSecondaryVideo();
    const expAudio = audioRef.current;

    if (isPlaying) {
      if (activeVid && !(isExplainerActive && layoutSettings.type === 'solo')) {
        activeVid.play().catch(() => {});
      }
      if (secVid && layoutSettings.type !== 'solo' && !isExplainerActive) {
        secVid.play().catch(() => {});
      }
      if (expAudio && isExplainerActive && explainerProject?.audioUrl) {
        if (Math.abs(expAudio.currentTime - currentTimeRef.current) > 0.35) {
          expAudio.currentTime = Math.min(
            currentTimeRef.current,
            Math.max(0, (expAudio.duration || duration) - 0.1)
          );
        }
        expAudio.play().catch(() => {});
      }
    } else {
      if (activeVid) activeVid.pause();
      if (secVid) secVid.pause();
      if (expAudio && !expAudio.paused) expAudio.pause();
      clipVideosMap.current.forEach((v) => {
        if (!v.paused) v.pause();
      });
    }
  }, [
    isPlaying,
    activeClip.sourceUrl,
    layoutSettings.type,
    isExplainerActive,
    explainerProject?.audioUrl,
    duration,
    getActiveVideo,
    getSecondaryVideo,
    audioRef,
  ]);

  // Synchronize seek/time
  useEffect(() => {
    const activeVid = getActiveVideo();
    const secVid = getSecondaryVideo();
    const expAudio = audioRef.current;

    if (activeVid && !(isExplainerActive && layoutSettings.type === 'solo')) {
      const clipLocalTime = Math.max(
        0,
        (currentTime - activeClip.startSec) * (activeClip.speed || 1) +
          (activeClip.sourceStartSec || 0)
      );
      if (Math.abs(activeVid.currentTime - clipLocalTime) > 0.3) {
        activeVid.currentTime = clipLocalTime;
      }
    }

    if (secVid && layoutSettings.type !== 'solo' && !isExplainerActive) {
      const secLocalTime = (currentTime * 1.05) % (secVid.duration || 15);
      if (Math.abs(secVid.currentTime - secLocalTime) > 0.5) {
        secVid.currentTime = secLocalTime;
      }
    }

    if (expAudio && isExplainerActive && explainerProject?.audioUrl) {
      const targetAudioTime = Math.min(
        Math.max(0, currentTime),
        Math.max(0, (expAudio.duration || duration) - 0.05)
      );
      if (Math.abs(expAudio.currentTime - targetAudioTime) > 0.35) {
        expAudio.currentTime = targetAudioTime;
      }
    }
  }, [
    currentTime,
    activeClip,
    layoutSettings.type,
    isExplainerActive,
    explainerProject?.audioUrl,
    duration,
    getActiveVideo,
    getSecondaryVideo,
    audioRef,
  ]);

  // Video event handlers for single master video
  const handleLoadedMetadata = () => {
    if (!isExplainerActive && clipsToUse.length <= 1 && videoRef.current) {
      const dur = videoRef.current.duration || 15;
      onDurationChange(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (!isExplainerActive && clipsToUse.length <= 1 && videoRef.current) {
      const now = performance.now();
      // Throttle state update to max 20Hz (50ms) to prevent UI stutter
      if (now - lastStateUpdateTimeRef.current >= 45) {
        lastStateUpdateTimeRef.current = now;
        onTimeUpdate(videoRef.current.currentTime);
      }
    }
  };

  // High performance, stutter-free playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp = performance.now();
    let frameId: number;
    const throttleMs = previewQuality === 'draft' ? 65 : 45;

    const step = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // When AI Explainer voiceover audio is actively playing, lock timeline directly to audio clock for zero drift!
      const expAudio = audioRef.current;
      let nextTime: number;
      if (
        isExplainerActive &&
        explainerProject?.audioUrl &&
        expAudio &&
        !expAudio.paused &&
        !expAudio.ended &&
        expAudio.currentTime > 0
      ) {
        nextTime = expAudio.currentTime;
      } else {
        nextTime = currentTimeRef.current + deltaSec;
      }

      if (nextTime >= duration) {
        currentTimeRef.current = 0;
        onTimeUpdate(0);
        onTogglePlay();
        return;
      }

      currentTimeRef.current = nextTime;

      // Throttle React state update to avoid overwhelming the React render tree
      if (now - lastStateUpdateTimeRef.current >= throttleMs) {
        lastStateUpdateTimeRef.current = now;
        onTimeUpdate(nextTime);
      }

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [
    isPlaying,
    duration,
    previewQuality,
    isExplainerActive,
    explainerProject?.audioUrl,
    audioRef,
    onTimeUpdate,
    onTogglePlay,
  ]);

  // Canvas dimensions based on aspect ratio AND preview quality mode
  const getCanvasDimensions = useCallback((): { width: number; height: number } => {
    // Quality multipliers:
    // Draft: low-res canvas for ultra-smooth 60fps even on low-end devices
    // Normal: 720p balanced crisp & fast
    // High: full 1080p studio
    if (previewQuality === 'draft') {
      switch (aspectRatio) {
        case '9:16':
          return { width: 450, height: 800 };
        case '1:1':
          return { width: 500, height: 500 };
        case '4:5':
          return { width: 480, height: 600 };
        case '16:9':
        default:
          return { width: 720, height: 405 };
      }
    }

    if (previewQuality === 'normal') {
      switch (aspectRatio) {
        case '9:16':
          return { width: 720, height: 1280 };
        case '1:1':
          return { width: 720, height: 720 };
        case '4:5':
          return { width: 720, height: 900 };
        case '16:9':
        default:
          return { width: 1280, height: 720 };
      }
    }

    // High quality (1080p full)
    switch (aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      case '16:9':
      default:
        return { width: 1920, height: 1080 };
    }
  }, [aspectRatio, previewQuality]);

  // Reusable helper to draw a video covering a bounding rectangle
  const drawVideoCover = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      video: HTMLVideoElement | null,
      dx: number,
      dy: number,
      dWidth: number,
      dHeight: number,
      roundedRadius = 0
    ) => {
      if (!video || video.readyState < 2) {
        ctx.fillStyle = '#18181b';
        if (roundedRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(dx, dy, dWidth, dHeight, roundedRadius);
          ctx.fill();
        } else {
          ctx.fillRect(dx, dy, dWidth, dHeight);
        }
        return;
      }

      const vWidth = video.videoWidth || 1920;
      const vHeight = video.videoHeight || 1080;
      const hRatio = dWidth / vWidth;
      const vRatio = dHeight / vHeight;
      const ratio = Math.max(hRatio, vRatio);

      const renderW = vWidth * ratio;
      const renderH = vHeight * ratio;
      const shiftX = dx + (dWidth - renderW) / 2;
      const shiftY = dy + (dHeight - renderH) / 2;

      ctx.save();
      ctx.beginPath();
      if (roundedRadius > 0) {
        ctx.roundRect(dx, dy, dWidth, dHeight, roundedRadius);
      } else {
        ctx.rect(dx, dy, dWidth, dHeight);
      }
      ctx.clip();
      ctx.drawImage(video, shiftX, shiftY, renderW, renderH);
      ctx.restore();
    },
    []
  );

  // Main high-performance render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const activeVideo = getActiveVideo();
      const secVideo = getSecondaryVideo();
      const primaryVideo = activeVideo || videoRef.current;

      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const { width, height } = getCanvasDimensions();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const currTime = currentTimeRef.current;

      // Check zoom keyframe
      let currentZoom = 1;
      const activeZoom = zoomKeyframes.find(
        (z) => currTime >= z.startSec && currTime <= z.endSec
      );
      if (activeZoom) {
        currentZoom = activeZoom.scale;
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply zoom if active
      if (currentZoom !== 1) {
        ctx.translate(width / 2, height / 2);
        ctx.scale(currentZoom, currentZoom);
        ctx.translate(-width / 2, -height / 2);
      }

      // Apply filter: In Draft mode, filters are applied via CSS on the wrapper to keep canvas draw 100% lag-free
      if (previewQuality !== 'draft') {
        const { contrast, saturation, brightness } = filterSettings;
        const filterParts: string[] = [
          `contrast(${contrast * 100}%)`,
          `saturate(${saturation * 100}%)`,
          `brightness(${brightness * 100}%)`,
        ];
        if (filterSettings.filter === 'noir') {
          filterParts.push('grayscale(100%)');
        }
        ctx.filter = filterParts.join(' ');
      } else {
        ctx.filter = 'none';
      }

      // Determine which source fills Slot 1 and Slot 2 based on swapSlots and Explainer mode
      const isSwapped = layoutSettings.swapSlots;
      const vidSlot1 = isSwapped ? secVideo || primaryVideo : primaryVideo;
      const vidSlot2 = isSwapped ? primaryVideo : secVideo || primaryVideo;

      const drawSlot = (
        slotIndex: 1 | 2,
        dx: number,
        dy: number,
        dWidth: number,
        dHeight: number,
        roundedRadius = 0
      ) => {
        if (isExplainerActive && explainerProject) {
          // When Explainer is paired in multi-slot layout:
          // Default (not swapped): Slot 1 = Presenter Video, Slot 2 = AI Motion Explainer Board
          // Swapped: Slot 1 = AI Motion Explainer Board, Slot 2 = Presenter Video
          const showBoardHere =
            (slotIndex === 2 && !isSwapped) || (slotIndex === 1 && isSwapped);
          if (showBoardHere) {
            ctx.save();
            ctx.filter = 'none';
            renderExplainerBoard(
              ctx,
              explainerProject,
              currTime,
              dx,
              dy,
              dWidth,
              dHeight,
              roundedRadius
            );
            ctx.restore();
            return;
          }
          drawVideoCover(ctx, primaryVideo, dx, dy, dWidth, dHeight, roundedRadius);
          return;
        }
        drawVideoCover(
          ctx,
          slotIndex === 1 ? vidSlot1 : vidSlot2,
          dx,
          dy,
          dWidth,
          dHeight,
          roundedRadius
        );
      };

      // RENDER TEMPLATE LAYOUTS
      if (layoutSettings.type === 'split-vertical') {
        // TOP / BOTTOM SPLIT SCREEN
        const splitRatio = layoutSettings.splitRatio || 0.5;
        const splitY = Math.round(height * splitRatio);

        // Top Slot (Slot 1)
        drawSlot(1, 0, 0, width, splitY);

        // Bottom Slot (Slot 2)
        drawSlot(2, 0, splitY, width, height - splitY);

        // Neon Divider Bar
        if (layoutSettings.showDivider) {
          ctx.save();
          ctx.strokeStyle = layoutSettings.dividerColor || '#06b6d4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, splitY);
          ctx.lineTo(width, splitY);
          ctx.stroke();

          // Subtle divider center badge
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          const badgeW = 90;
          const badgeH = 20;
          ctx.beginPath();
          ctx.roundRect((width - badgeW) / 2, splitY - badgeH / 2, badgeW, badgeH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = `bold 10px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `SPLIT ${Math.round(splitRatio * 100)}:${100 - Math.round(splitRatio * 100)}`,
            width / 2,
            splitY
          );
          ctx.restore();
        }
      } else if (layoutSettings.type === 'split-horizontal') {
        // LEFT / RIGHT SPLIT SCREEN
        const splitRatio = layoutSettings.splitRatio || 0.5;
        const splitX = Math.round(width * splitRatio);

        // Left Slot (Slot 1)
        drawSlot(1, 0, 0, splitX, height);

        // Right Slot (Slot 2)
        drawSlot(2, splitX, 0, width - splitX, height);

        // Neon Divider Bar
        if (layoutSettings.showDivider) {
          ctx.save();
          ctx.strokeStyle = layoutSettings.dividerColor || '#06b6d4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, height);
          ctx.stroke();
          ctx.restore();
        }
      } else if (layoutSettings.type === 'pip') {
        // PICTURE-IN-PICTURE (PIP)
        // Background (Slot 1)
        drawSlot(1, 0, 0, width, height);

        // Floating PIP Window (Slot 2)
        const pipScale = layoutSettings.pipScale || 0.35;
        const pipW = Math.round(width * pipScale);
        const pipH = Math.round(pipW * (aspectRatio === '9:16' ? 1.3 : 0.65));
        const margin = Math.round(width * 0.04);

        let pipX = width - pipW - margin;
        let pipY = height - pipH - margin - 50;

        switch (layoutSettings.pipPosition) {
          case 'top-right':
            pipX = width - pipW - margin;
            pipY = margin + 45;
            break;
          case 'top-left':
            pipX = margin;
            pipY = margin + 45;
            break;
          case 'bottom-left':
            pipX = margin;
            pipY = height - pipH - margin - 50;
            break;
          case 'bottom-right':
            pipX = width - pipW - margin;
            pipY = height - pipH - margin - 50;
            break;
          case 'center':
            pipX = (width - pipW) / 2;
            pipY = (height - pipH) / 2;
            break;
        }

        // Draw PIP with shadow, rounded clip, and neon border
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(pipX, pipY, pipW, pipH, 12);
        ctx.fill();
        ctx.restore();

        // Draw PIP Content
        drawSlot(2, pipX, pipY, pipW, pipH, 12);

        // Draw PIP Border & Badge
        ctx.save();
        ctx.strokeStyle = layoutSettings.dividerColor || '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(pipX, pipY, pipW, pipH, 12);
        ctx.stroke();

        // Small tag
        ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.beginPath();
        ctx.roundRect(pipX + 8, pipY + 8, 56, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `bold 9px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isExplainerActive ? 'EXPLAINER' : 'PIP CAM', pipX + 36, pipY + 16);
        ctx.restore();
      } else if (layoutSettings.type === 'reaction-frame') {
        // REACTION FRAME (Top 58% Content, Bottom 42% Reaction)
        const splitY = Math.round(height * 0.58);
        drawSlot(1, 0, 0, width, splitY);
        drawSlot(2, 0, splitY, width, height - splitY);

        // Studio divider line
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, splitY - 14, width, 28);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, splitY);
        ctx.lineTo(width, splitY);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold 11px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          isExplainerActive ? '📊 AI MOTION EXPLAINER & PRESENTER' : '🎙️ REAKSI & ULASAN KONTEN',
          width / 2,
          splitY
        );
        ctx.restore();
      } else if (isExplainerActive && explainerProject) {
        // FULLSCREEN AI MOTION EXPLAINER
        ctx.save();
        ctx.filter = 'none';
        renderExplainerBoard(ctx, explainerProject, currTime, 0, 0, width, height);
        ctx.restore();
      } else {
        // STANDARD SOLO FULLSCREEN
        drawVideoCover(ctx, primaryVideo, 0, 0, width, height);
      }

      // Reset filter
      ctx.filter = 'none';

      // Specialized visual tints (only active in normal and high quality)
      if (previewQuality !== 'draft') {
        if (filterSettings.filter === 'cinematic-teal') {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.10)';
          ctx.globalCompositeOperation = 'color-burn';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        } else if (filterSettings.filter === 'cyberpunk') {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.14)';
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        } else if (filterSettings.filter === 'vintage') {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        }

        // Vignette effect
        if (filterSettings.vignette > 0) {
          const radius = Math.max(width, height) * 0.7;
          const radial = ctx.createRadialGradient(
            width / 2,
            height / 2,
            radius * 0.4,
            width / 2,
            height / 2,
            radius
          );
          radial.addColorStop(0, 'rgba(0,0,0,0)');
          radial.addColorStop(1, `rgba(0,0,0,${filterSettings.vignette})`);
          ctx.fillStyle = radial;
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.restore();

      // LAYER 2: B-ROLL OVERLAYS
      const activeBroll = brolls.find(
        (b) => currTime >= b.startSec && currTime <= b.startSec + b.duration
      );

      if (activeBroll) {
        setActiveBrollTitle(activeBroll.title);
        ctx.save();
        ctx.globalAlpha = activeBroll.opacity || 0.9;
        ctx.globalCompositeOperation = activeBroll.blendMode || 'source-over';

        if (activeBroll.type === 'image' && loadedImages.has(activeBroll.url)) {
          const img = loadedImages.get(activeBroll.url)!;
          const hRatio = width / img.width;
          const vRatio = height / img.height;
          const ratio = Math.max(hRatio, vRatio);
          const shiftX = (width - img.width * ratio) / 2;
          const shiftY = (height - img.height * ratio) / 2;
          ctx.drawImage(img, shiftX, shiftY, img.width * ratio, img.height * ratio);
        } else {
          // Animated procedural AI B-roll card
          const bGrad = ctx.createLinearGradient(0, 0, width, height);
          bGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
          bGrad.addColorStop(1, 'rgba(30, 27, 75, 0.95)');
          ctx.fillStyle = bGrad;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = '#38bdf8';
          ctx.font = `bold ${Math.round(width * 0.045)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`[ AI B-ROLL: ${activeBroll.title.toUpperCase()} ]`, width / 2, height / 2);
        }

        ctx.restore();
      } else {
        setActiveBrollTitle(null);
      }

      // LAYER 3: RESPONSIVE WRAPPED CAPTIONS (Zero clipping & safe bottom margin)
      const activeCap = captions.find(
        (c) => currTime >= c.startSec && currTime <= c.endSec
      );

      if (activeCap) {
        setActiveCaptionText(activeCap.text);
        ctx.save();

        const isClean = activeCap.style === 'clean-minimal';
        const baseUnit = Math.min(width, height);
        const fontSize = Math.max(
          16,
          Math.round(
            isClean
              ? baseUnit * (aspectRatio === '9:16' ? 0.044 : 0.042)
              : baseUnit * 0.056
          )
        );
        ctx.font = `${isClean ? 700 : 900} ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap inside safe 84% canvas width (max 2 lines)
        const maxCapWidth = width * 0.84;
        const words = activeCap.text.trim().split(/\s+/);
        const capLines: string[] = [];
        let lineBuf = '';
        for (const w of words) {
          const test = lineBuf ? `${lineBuf} ${w}` : w;
          if (ctx.measureText(test).width <= maxCapWidth) {
            lineBuf = test;
          } else {
            if (lineBuf) capLines.push(lineBuf);
            lineBuf = w;
          }
        }
        if (lineBuf) capLines.push(lineBuf);
        const displayLines = capLines.slice(0, 2);

        const maxMeasuredLineW = displayLines.reduce(
          (max, l) => Math.max(max, ctx.measureText(l).width),
          0
        );
        const lineHeight = fontSize * 1.28;
        const boxPadX = fontSize * 0.8;
        const boxPadY = fontSize * 0.42;
        const boxW = Math.min(width * 0.92, maxMeasuredLineW + boxPadX * 2);
        const boxH = displayLines.length * lineHeight + boxPadY * 2;

        // Safe lower-third position that stays below Explainer cards
        const capY =
          isExplainerActive
            ? height - boxH / 2 - Math.round(height * 0.045)
            : aspectRatio === '9:16'
            ? height * 0.74
            : height * 0.85;

        ctx.translate(width / 2, capY);

        // Clean studio pill background
        ctx.fillStyle = isClean ? 'rgba(6, 12, 24, 0.88)' : 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
        ctx.fill();

        ctx.strokeStyle = isClean
          ? `${activeCap.color || '#38bdf8'}aa`
          : activeCap.color || '#FACC15';
        ctx.lineWidth = isClean ? 2 : 3.2;
        ctx.stroke();

        // Draw each wrapped line centered inside box
        const firstLineY = -((displayLines.length - 1) * lineHeight) / 2;
        displayLines.forEach((line, idx) => {
          const ly = firstLineY + idx * lineHeight;
          if (!isClean) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = fontSize * 0.14;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, 0, ly);
          }
          ctx.fillStyle = isClean ? '#f8fafc' : activeCap.color || '#FACC15';
          ctx.fillText(line, 0, ly);
        });

        ctx.restore();
      } else {
        setActiveCaptionText(null);
      }

      // LAYER 4: STICKERS
      stickers.forEach((st) => {
        if (currTime >= st.startSec && currTime <= st.endSec) {
          ctx.save();
          const stX = (width * st.xPercent) / 100;
          const stY = (height * st.yPercent) / 100;

          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.font = `bold 20px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const sWidth = ctx.measureText(st.text).width + 24;
          ctx.beginPath();
          ctx.roundRect(stX - sWidth / 2, stY - 18, sWidth, 36, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(st.text, stX, stY);
          ctx.restore();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    aspectRatio,
    previewQuality,
    filterSettings,
    layoutSettings,
    captions,
    brolls,
    stickers,
    zoomKeyframes,
    loadedImages,
    isExplainerActive,
    explainerProject,
    getCanvasDimensions,
    drawVideoCover,
    getActiveVideo,
    getSecondaryVideo,
    canvasRef,
    videoRef,
  ]);

  // Handle Audio Ducking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (audioDucking) {
      video.volume = 0.35;
    } else {
      video.volume = 1.0;
    }
  }, [audioDucking, videoRef]);

  // Handle swapping slots
  const handleSwapSlots = () => {
    onUpdateLayoutSettings({
      ...layoutSettings,
      swapSlots: !layoutSettings.swapSlots,
    });
  };

  // Handle changing split ratio (resize / perbesar)
  const handleCycleSplitRatio = () => {
    let nextRatio = 0.5;
    if (layoutSettings.splitRatio === 0.5) nextRatio = 0.65;
    else if (layoutSettings.splitRatio === 0.65) nextRatio = 0.35;
    else nextRatio = 0.5;

    onUpdateLayoutSettings({
      ...layoutSettings,
      splitRatio: nextRatio,
    });
  };

  // Handle resizing PIP (perbesar / perkecil)
  const handleCyclePipScale = () => {
    let nextScale = 0.35;
    if (layoutSettings.pipScale <= 0.25) nextScale = 0.38;
    else if (layoutSettings.pipScale <= 0.4) nextScale = 0.52;
    else if (layoutSettings.pipScale <= 0.55) nextScale = 0.65;
    else nextScale = 0.25;

    onUpdateLayoutSettings({
      ...layoutSettings,
      pipScale: nextScale,
    });
  };

  // Handle cycling PIP corner position
  const handleCyclePipPosition = () => {
    const positions: PipPosition[] = [
      'bottom-right',
      'bottom-left',
      'top-left',
      'top-right',
      'center',
    ];
    const currentIndex = positions.indexOf(layoutSettings.pipPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    onUpdateLayoutSettings({
      ...layoutSettings,
      pipPosition: positions[nextIndex],
    });
  };

  // CSS Filter string for GPU hardware acceleration in Draft mode
  const getDraftCssFilter = () => {
    if (previewQuality !== 'draft') return undefined;
    const { contrast, saturation, brightness } = filterSettings;
    return `contrast(${contrast * 100}%) saturate(${saturation * 100}%) brightness(${brightness * 100}%)`;
  };

  // Aspect ratio wrapper styling
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-full max-w-full w-auto';
      case '1:1':
        return 'aspect-square max-h-full max-w-full w-auto';
      case '4:5':
        return 'aspect-[4/5] max-h-full max-w-full w-auto';
      case '16:9':
      default:
        return 'aspect-video max-h-full max-w-full w-auto';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-2 sm:p-4 bg-zinc-950/70 select-none overflow-hidden">
      {/* Hidden Source Video Element (sync engine) */}
      <video
        ref={videoRef}
        src={videoUrl}
        crossOrigin="anonymous"
        playsInline
        muted={isMuted || (isExplainerActive && Boolean(explainerProject?.audioUrl))}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        className="hidden"
      />

      {/* Hidden AI Explainer Voiceover Audio Element */}
      {explainerProject?.audioUrl && (
        <audio
          ref={audioRef}
          src={explainerProject.audioUrl}
          muted={isMuted}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration > 0 && onExplainerAudioDuration) {
              onExplainerAudioDuration(audioRef.current.duration);
            }
          }}
          className="hidden"
        />
      )}

      {/* Video Viewport Frame */}
      <div
        className={`relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800/80 transition-all duration-300 ${getAspectRatioClass()}`}
      >
        <canvas
          ref={canvasRef}
          style={{ filter: getDraftCssFilter() }}
          className="w-full h-full object-contain cursor-pointer"
          onClick={onTogglePlay}
        />

        {/* Real-time Indicator Overlays & Controls Header */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
          {/* Left badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.8 text-[11px] font-semibold rounded-md bg-zinc-900/90 border border-zinc-700/70 text-zinc-200 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              60FPS
            </span>

            {/* Quality Badge Selector */}
            <div className="relative pointer-events-auto">
              <button
                onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
                className={`flex items-center gap-1 px-2 py-0.8 text-[11px] font-semibold rounded-md backdrop-blur-md border transition-all cursor-pointer ${
                  previewQuality === 'draft'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : previewQuality === 'normal'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title="Pilih Kualitas Preview (Draft / Normal / Tinggi)"
              >
                <Gauge className="w-3 h-3" />
                <span className="uppercase font-mono">
                  {previewQuality === 'draft'
                    ? 'Draft (Cepat)'
                    : previewQuality === 'normal'
                    ? 'Normal (720p)'
                    : 'Tinggi (1080p)'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Quality Dropdown Menu */}
              {isQualityMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-56 p-1.5 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-md z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] text-zinc-400 font-medium uppercase tracking-wider border-b border-zinc-800 mb-1">
                    Kualitas Preview Video
                  </div>

                  {/* Draft */}
                  <button
                    onClick={() => {
                      onPreviewQualityChange('draft');
                      setIsQualityMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      previewQuality === 'draft'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="mt-0.5">
                      {previewQuality === 'draft' ? (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>🚀 Draft (Anti Patah-Patah)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        Sangat ringan & mulus. Ideal untuk HP atau laptop saat preview video.
                      </p>
                    </div>
                  </button>

                  {/* Normal */}
                  <button
                    onClick={() => {
                      onPreviewQualityChange('normal');
                      setIsQualityMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      previewQuality === 'normal'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="mt-0.5">
                      {previewQuality === 'normal' ? (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>⚡ Normal (720p Seimbang)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        Rekomendasi default. Gambar jernih dan render responsif.
                      </p>
                    </div>
                  </button>

                  {/* High */}
                  <button
                    onClick={() => {
                      onPreviewQualityChange('high');
                      setIsQualityMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      previewQuality === 'high'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="mt-0.5">
                      {previewQuality === 'high' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>💎 Tinggi (Studio 1080p)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        Resolusi maksimal dengan shading penuh untuk cek detail akhir.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Explainer Active Indicator */}
            {isExplainerActive && (
              <span className="px-2 py-0.8 text-[11px] font-mono rounded bg-emerald-950/85 border border-emerald-500/50 text-emerald-300 flex items-center gap-1 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>AI EXPLAINER</span>
              </span>
            )}

            {/* Layout Active Indicator */}
            {layoutSettings.type !== 'solo' && (
              <span className="px-2 py-0.8 text-[11px] font-mono rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 flex items-center gap-1 backdrop-blur-md">
                <Layers className="w-3 h-3 text-purple-400" />
                <span className="capitalize">{layoutSettings.type.replace('-', ' ')}</span>
              </span>
            )}
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-1.5">
            {audioDucking && (
              <span className="px-2 py-0.8 text-[11px] font-medium rounded-md bg-violet-950/80 border border-violet-700/60 text-violet-300 flex items-center gap-1 backdrop-blur-md">
                <Layers className="w-3 h-3 text-violet-400" />
                Ducking
              </span>
            )}
            <span className="px-2 py-0.8 text-[11px] font-mono rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
              {aspectRatio}
            </span>
          </div>
        </div>

        {/* FLOATING TEMPLATE CONTROLS HUD (When multi-slot layout is active) */}
        {layoutSettings.type !== 'solo' && (
          <div className="absolute top-12 inset-x-2 sm:inset-x-4 flex items-center justify-center pointer-events-none z-30">
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-zinc-950/85 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-xl text-xs text-zinc-200">
              {/* Swap Button (Tukar Posisi) */}
              <button
                onClick={handleSwapSlots}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  layoutSettings.swapSlots
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/30'
                }`}
                title="Tukar posisi video Slot 1 & Slot 2"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{layoutSettings.swapSlots ? 'Posisi: Ditukar 🔄' : '🔄 Tukar Posisi'}</span>
              </button>

              {/* Resize / Perbesar Button */}
              {layoutSettings.type.startsWith('split') && (
                <button
                  onClick={handleCycleSplitRatio}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer font-medium"
                  title="Ubah pembagian rasio split (Perbesar / Perkecil Slot)"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Rasio: {Math.round(layoutSettings.splitRatio * 100)}:
                    {100 - Math.round(layoutSettings.splitRatio * 100)}
                  </span>
                </button>
              )}

              {/* PIP Scale & Position Buttons */}
              {layoutSettings.type === 'pip' && (
                <>
                  <button
                    onClick={handleCyclePipScale}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer font-medium"
                    title="Perbesar / Perkecil Ukuran Jendela PIP"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ukuran PIP: {Math.round(layoutSettings.pipScale * 100)}%</span>
                  </button>

                  <button
                    onClick={handleCyclePipPosition}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer font-medium"
                    title="Ganti Sudut Posisi PIP (Kanan-Bawah, Kiri-Bawah, Kanan-Atas, Kiri-Atas)"
                  >
                    <Move className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="capitalize font-mono text-[11px]">
                      {layoutSettings.pipPosition}
                    </span>
                  </button>
                </>
              )}

              {/* Reset to Solo Fullscreen */}
              <button
                onClick={() =>
                  onUpdateLayoutSettings({
                    ...layoutSettings,
                    type: 'solo',
                  })
                }
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Kembali ke Fullscreen Standar"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Play/Pause Center Overlay on Hover or Pause */}
        {!isPlaying && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-110 active:scale-95 transition-all backdrop-blur-sm cursor-pointer z-10"
            title="Putar Video"
          >
            <Play className="w-8 h-8 fill-black translate-x-0.5" />
          </button>
        )}

        {/* Quick controls bar on video bottom */}
        <div className="absolute bottom-2 inset-x-3 px-3 py-1.5 bg-zinc-900/85 backdrop-blur-md rounded-lg flex items-center justify-between text-xs text-zinc-300 opacity-90 hover:opacity-100 transition-opacity z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="p-1 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <span className="font-mono text-zinc-400">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            {activeBrollTitle && (
              <span className="text-cyan-400 text-[11px] font-mono">
                🎬 B-Roll: {activeBrollTitle}
              </span>
            )}
            {activeCaptionText && (
              <span className="text-amber-400 text-[11px] font-mono truncate max-w-[140px]">
                💬 {activeCaptionText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
