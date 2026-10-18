import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AspectRatio,
  VideoFilterSettings,
  CaptionItem,
  BrollItem,
  StickerOverlay,
  ZoomKeyframe,
} from '../types/editor';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Layers } from 'lucide-react';

interface VideoCanvasProps {
  videoUrl: string;
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
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onTogglePlay: () => void;
  canvasRefOut?: React.RefObject<HTMLCanvasElement | null>;
  videoRefOut?: React.RefObject<HTMLVideoElement | null>;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  videoUrl,
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
  onTimeUpdate,
  onDurationChange,
  onTogglePlay,
  canvasRefOut,
  videoRefOut,
}) => {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const canvasRef = canvasRefOut || localCanvasRef;
  const videoRef = videoRefOut || localVideoRef;

  const [isMuted, setIsMuted] = useState(false);
  const [activeBrollTitle, setActiveBrollTitle] = useState<string | null>(null);
  const [activeCaptionText, setActiveCaptionText] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

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
  }, [brolls]);

  // Synchronize play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, videoRef]);

  // Synchronize seek/time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 0.3) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoRef]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 15;
      onDurationChange(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  // Canvas dimensions based on aspect ratio
  const getCanvasDimensions = useCallback((): { width: number; height: number } => {
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
  }, [aspectRatio]);

  // Main 60fps render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const { width, height } = getCanvasDimensions();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const currTime = video.currentTime;

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

      // Save context for transform & filter
      ctx.save();

      // Apply zoom if active
      if (currentZoom !== 1) {
        ctx.translate(width / 2, height / 2);
        ctx.scale(currentZoom, currentZoom);
        ctx.translate(-width / 2, -height / 2);
      }

      // Build CSS Filter string
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

      // Render base video (auto-fit cover)
      if (video.readyState >= 2) {
        const vWidth = video.videoWidth || 1920;
        const vHeight = video.videoHeight || 1080;

        const hRatio = width / vWidth;
        const vRatio = height / vHeight;
        const ratio = Math.max(hRatio, vRatio);

        const centerShiftX = (width - vWidth * ratio) / 2;
        const centerShiftY = (height - vHeight * ratio) / 2;

        ctx.drawImage(
          video,
          0,
          0,
          vWidth,
          vHeight,
          centerShiftX,
          centerShiftY,
          vWidth * ratio,
          vHeight * ratio
        );
      } else {
        // Placeholder background while loading
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(1, '#18181b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Reset filter
      ctx.filter = 'none';

      // Apply specialized color grade overlay tint
      if (filterSettings.filter === 'cinematic-teal') {
        // Teal shadows + Orange warm highlights
        ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.globalCompositeOperation = 'color-burn';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.10)';
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      } else if (filterSettings.filter === 'cyberpunk') {
        // Cyan and hot pink neon tint
        ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      } else if (filterSettings.filter === 'vintage') {
        // Warm nostalgic sepia tint
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
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

          // Digital neural lines
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 4;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const yOffset = (height / 6) * (i + 1) + Math.sin(currTime * 3 + i) * 20;
            ctx.moveTo(0, yOffset);
            ctx.bezierCurveTo(
              width * 0.3,
              yOffset + 40,
              width * 0.7,
              yOffset - 40,
              width,
              yOffset
            );
            ctx.stroke();
          }

          // B-roll central title badge
          ctx.fillStyle = '#38bdf8';
          ctx.font = `bold ${Math.round(width * 0.045)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`[ AI B-ROLL: ${activeBroll.title.toUpperCase()} ]`, width / 2, height / 2);
        }

        ctx.restore();

        // B-Roll HUD Pill badge in upper corner
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const badgeW = width * 0.32;
        const badgeH = 44;
        const badgeX = width * 0.05;
        const badgeY = height * 0.06;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold 16px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⚡ B-ROLL: ${activeBroll.title.slice(0, 16)}`, badgeX + badgeW / 2, badgeY + badgeH / 2);
        ctx.restore();
      } else {
        setActiveBrollTitle(null);
      }

      // LAYER 3: DYNAMIC ALEX HORMOZI & REELS CAPTIONS
      const activeCap = captions.find(
        (c) => currTime >= c.startSec && currTime <= c.endSec
      );

      if (activeCap) {
        setActiveCaptionText(activeCap.text);
        ctx.save();

        const fontSize = Math.round(width * 0.056);
        ctx.font = `900 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Position: lower third (or center if 9:16)
        const capY = aspectRatio === '9:16' ? height * 0.65 : height * 0.82;

        // Subtle dynamic bounce scale on active word
        const capProgress = (currTime - activeCap.startSec) / (activeCap.endSec - activeCap.startSec);
        const popScale = 1 + Math.sin(Math.min(1, capProgress * 4) * Math.PI) * 0.08;

        ctx.translate(width / 2, capY);
        ctx.scale(popScale, popScale);

        // Background box for extreme readability
        const textMetrics = ctx.measureText(activeCap.text);
        const boxPadX = fontSize * 0.7;
        const boxPadY = fontSize * 0.35;
        const boxW = textMetrics.width + boxPadX * 2;
        const boxH = fontSize * 1.5;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 14);
        ctx.fill();

        // Border glow
        ctx.strokeStyle = activeCap.color || '#FACC15';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Text stroke for punchy high-contrast comic/Hormozi look
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = fontSize * 0.16;
        ctx.lineJoin = 'round';
        ctx.strokeText(activeCap.text, 0, 0);

        // Text fill with bright highlight color
        ctx.fillStyle = activeCap.color || '#FACC15';
        ctx.fillText(activeCap.text, 0, 0);

        ctx.restore();
      } else {
        setActiveCaptionText(null);
      }

      // LAYER 4: STICKERS & BADGES
      stickers.forEach((st) => {
        if (currTime >= st.startSec && currTime <= st.endSec) {
          ctx.save();
          const stX = (width * st.xPercent) / 100;
          const stY = (height * st.yPercent) / 100;

          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.font = `bold 22px 'Plus Jakarta Sans', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const sWidth = ctx.measureText(st.text).width + 30;
          ctx.beginPath();
          ctx.roundRect(stX - sWidth / 2, stY - 20, sWidth, 40, 8);
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
    filterSettings,
    captions,
    brolls,
    stickers,
    zoomKeyframes,
    loadedImages,
    getCanvasDimensions,
    canvasRef,
    videoRef,
  ]);

  // Handle Audio Ducking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (audioDucking) {
      video.volume = 0.35; // Lowered for clear voiceover
    } else {
      video.volume = 1.0;
    }
  }, [audioDucking, videoRef]);

  // Aspect ratio wrapper styling
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[580px] w-auto';
      case '1:1':
        return 'aspect-square max-h-[540px] w-auto';
      case '4:5':
        return 'aspect-[4/5] max-h-[560px] w-auto';
      case '16:9':
      default:
        return 'aspect-video w-full max-h-[520px]';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4 bg-zinc-950/70 select-none">
      {/* Hidden Source Video Element (sync engine) */}
      <video
        ref={videoRef}
        src={videoUrl}
        crossOrigin="anonymous"
        playsInline
        muted={isMuted}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        className="hidden"
      />

      {/* Video Viewport Frame */}
      <div
        className={`relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800/80 transition-all duration-300 ${getAspectRatioClass()}`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-pointer"
          onClick={onTogglePlay}
        />

        {/* Real-time Indicator Overlays */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-900/90 border border-zinc-700/70 text-zinc-200 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI REAL-TIME 60FPS
          </span>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
            {aspectRatio}
          </span>
          {filterSettings.filter !== 'none' && (
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {filterSettings.filter.toUpperCase()}
            </span>
          )}
        </div>

        {/* Live Audio Ducking Indicator */}
        {audioDucking && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-violet-950/80 border border-violet-700/60 text-violet-300 flex items-center gap-1.5 backdrop-blur-md">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              Ducking: -14dB
            </span>
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
        <div className="absolute bottom-2 inset-x-3 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-lg flex items-center justify-between text-xs text-zinc-300 opacity-90 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="p-1 hover:text-cyan-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:text-cyan-400 transition-colors"
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
