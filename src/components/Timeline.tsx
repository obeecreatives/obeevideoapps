import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  ZoomIn,
  ZoomOut,
  Volume2,
  Subtitles,
  Film,
  Sparkles,
  Layers,
  Trash2,
} from 'lucide-react';
import { CaptionItem, BrollItem, VideoClip } from '../types/editor';

interface TimelineProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  captions: CaptionItem[];
  brolls: BrollItem[];
  videoClips?: VideoClip[];
  audioDucking: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onSplitClip: (time: number) => void;
  onDeleteBroll?: (id: string) => void;
  onDeleteCaption?: (id: string) => void;
  onDeleteClip?: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  isPlaying,
  captions,
  brolls,
  videoClips,
  audioDucking,
  onSeek,
  onTogglePlay,
  onSplitClip,
  onDeleteBroll,
  onDeleteCaption,
  onDeleteClip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [splitPoints, setSplitPoints] = useState<number[]>([]);

  const totalDuration = Math.max(5, duration || 15);

  // Format seconds to mm:ss.ms
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Convert timeline click or drag to time
  const handleSeekFromPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * totalDuration;
    onSeek(targetTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPlayhead(true);
    handleSeekFromPointer(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead) {
        handleSeekFromPointer(e.clientX);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, totalDuration]);

  // Handle Split at playhead
  const handleSplit = () => {
    setSplitPoints((prev) => [...prev, currentTime].sort((a, b) => a - b));
    onSplitClip(currentTime);
  };

  // Playhead percentage
  const playheadPercent = (currentTime / totalDuration) * 100;

  // Generate ruler tick marks
  const ticks = [];
  const tickStep = totalDuration > 60 ? 5 : totalDuration > 30 ? 2 : 1;
  for (let i = 0; i <= totalDuration; i += tickStep) {
    ticks.push(i);
  }

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-zinc-800/80 bg-zinc-950/70 text-xs">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke awal (00:00)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span className="hidden xs:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span className="hidden xs:inline">Play</span>
              </>
            )}
          </button>
          <button
            onClick={handleSplit}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-cyan-400 border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Potong klip pada posisi playhead (Split Cut)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
        </div>

        {/* Time display */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs">
          <span className="text-cyan-400 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">{formatTime(totalDuration)}</span>
        </div>

        {/* Timeline Zoom & Track Status */}
        <div className="flex items-center gap-2">
          {videoClips && videoClips.length > 1 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              <Film className="w-3 h-3 text-cyan-400" />
              {videoClips.length} Klip Tersambung
            </span>
          )}
          <div className="hidden xs:flex items-center gap-1 bg-zinc-800/60 px-2 py-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              title="Perkecil Timeline"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] text-zinc-400 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              title="Perbesar Timeline"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Track Workspace */}
      <div className="flex w-full overflow-hidden">
        {/* Track Headers (Left labels) */}
        <div className="w-24 sm:w-28 shrink-0 bg-zinc-950/90 border-r border-zinc-800/80 flex flex-col select-none text-[11px] text-zinc-400">
          <div className="h-6 border-b border-zinc-800/60 px-2 flex items-center font-mono text-zinc-500 text-[10px]">
            TIME
          </div>
          <div className="h-10 border-b border-zinc-800/60 px-2 flex items-center gap-1.5 text-zinc-300 font-medium">
            <Subtitles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Subtitle</span>
          </div>
          <div className="h-10 border-b border-zinc-800/60 px-2 flex items-center gap-1.5 text-zinc-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">B-Roll</span>
          </div>
          <div className="h-12 border-b border-zinc-800/60 px-2 flex items-center gap-1.5 text-zinc-300 font-medium">
            <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">V1 Video</span>
          </div>
          <div className="h-10 px-2 flex items-center gap-1.5 text-zinc-300 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">A1 Audio</span>
          </div>
        </div>

        {/* Tracks Canvas Area with Playhead */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          className="relative flex-1 bg-zinc-900/60 overflow-x-auto overflow-y-hidden cursor-crosshair select-none"
          style={{ minHeight: '190px' }}
        >
          {/* RULER (Top Bar) */}
          <div className="h-6 w-full border-b border-zinc-800/80 bg-zinc-950/50 flex relative">
            {ticks.map((t) => {
              const posPercent = (t / totalDuration) * 100;
              return (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 border-l border-zinc-700/50 pl-1 text-[9px] font-mono text-zinc-500 pointer-events-none"
                  style={{ left: `${posPercent}%` }}
                >
                  {t}s
                </div>
              );
            })}
          </div>

          {/* TRACK 1: CAPTIONS / SUBTITLES */}
          <div className="h-10 w-full border-b border-zinc-800/60 relative bg-zinc-900/40 p-1">
            {captions.map((cap) => {
              const leftPercent = (cap.startSec / totalDuration) * 100;
              const widthPercent = ((cap.endSec - cap.startSec) / totalDuration) * 100;
              return (
                <div
                  key={cap.id}
                  className="absolute top-1 bottom-1 rounded bg-amber-500/20 border border-amber-500/60 px-2 flex items-center justify-between overflow-hidden text-[10px] text-amber-200 group hover:border-amber-400 transition-colors"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(3, widthPercent)}%`,
                  }}
                  title={`${cap.text} (${cap.startSec.toFixed(1)}s - ${cap.endSec.toFixed(1)}s)`}
                >
                  <span className="truncate font-semibold">{cap.text}</span>
                  {onDeleteCaption && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCaption(cap.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-amber-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* TRACK 2: B-ROLL OVERLAYS */}
          <div className="h-10 w-full border-b border-zinc-800/60 relative bg-zinc-900/30 p-1">
            {brolls.map((b) => {
              const leftPercent = (b.startSec / totalDuration) * 100;
              const widthPercent = (b.duration / totalDuration) * 100;
              return (
                <div
                  key={b.id}
                  className="absolute top-1 bottom-1 rounded bg-cyan-500/20 border border-cyan-500/60 px-2 flex items-center justify-between overflow-hidden text-[10px] text-cyan-200 group hover:border-cyan-400 transition-colors"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(3, widthPercent)}%`,
                  }}
                  title={`B-Roll: ${b.title} (${b.startSec.toFixed(1)}s - ${(
                    b.startSec + b.duration
                  ).toFixed(1)}s)`}
                >
                  <span className="truncate font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    {b.title}
                  </span>
                  {onDeleteBroll && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBroll(b.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-cyan-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* TRACK 3: PRIMARY VIDEO / MULTI-CLIP TRACK WITH WAVEFORM & CUTS */}
          <div className="h-12 w-full border-b border-zinc-800/60 relative bg-indigo-950/20 p-1 flex items-center">
            {videoClips && videoClips.length > 0 ? (
              videoClips.map((clip, idx) => {
                const leftPercent = (clip.startSec / totalDuration) * 100;
                const widthPercent = (clip.duration / totalDuration) * 100;
                const isSelected =
                  currentTime >= clip.startSec && currentTime < clip.startSec + clip.duration;
                const colorTheme = [
                  'bg-indigo-900/50 border-indigo-500/70 text-indigo-200',
                  'bg-violet-900/50 border-violet-500/70 text-violet-200',
                  'bg-cyan-950/60 border-cyan-500/70 text-cyan-200',
                  'bg-blue-900/50 border-blue-500/70 text-blue-200',
                ][idx % 4];

                return (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 rounded border px-2 sm:px-3 flex items-center justify-between overflow-hidden group transition-all ${colorTheme} ${
                      isSelected ? 'ring-2 ring-cyan-400 brightness-110 shadow-lg' : 'opacity-90'
                    }`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(2, widthPercent)}%`,
                    }}
                    title={`${clip.title} (${clip.duration.toFixed(1)}s)`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="px-1.5 py-0.2 bg-black/50 rounded text-[9px] font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold truncate">
                        {clip.title}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono hidden md:inline">
                        ({clip.duration.toFixed(1)}s)
                      </span>
                    </div>

                    {/* Simulated Waveform lines */}
                    <div className="hidden sm:flex items-center gap-0.5 opacity-30">
                      {Array.from({ length: 8 }).map((_, wIdx) => (
                        <div
                          key={wIdx}
                          className="w-0.5 bg-current rounded-full"
                          style={{ height: `${6 + (wIdx % 3) * 4}px` }}
                        />
                      ))}
                    </div>

                    {/* Delete Clip */}
                    {videoClips.length > 1 && onDeleteClip && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClip(clip.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition-opacity cursor-pointer shrink-0"
                        title="Hapus klip ini dari urutan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              /* Single master footage fallback */
              <div className="absolute inset-1 rounded bg-indigo-900/40 border border-indigo-700/60 overflow-hidden flex items-center px-3 justify-between">
                <span className="text-[11px] font-semibold text-indigo-200 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  Main Master Footage (4K 60FPS)
                </span>
                <div className="flex items-center gap-0.5 opacity-40">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const h = 4 + Math.sin(idx * 0.5) * 12 + (idx % 3) * 6;
                    return (
                      <div
                        key={idx}
                        className="w-1 bg-indigo-400 rounded-full"
                        style={{ height: `${Math.max(3, h)}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split markers */}
            {splitPoints.map((pt, i) => {
              const ptPercent = (pt / totalDuration) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 pointer-events-none"
                  style={{ left: `${ptPercent}%` }}
                >
                  <span className="absolute -top-1 -left-2 text-[8px] bg-yellow-400 text-black px-1 rounded font-mono">
                    ✂️ CUT
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: AUDIO / BGM & DUCKING */}
          <div className="h-10 w-full relative bg-emerald-950/10 p-1 flex items-center">
            <div className="absolute inset-1 rounded bg-emerald-900/30 border border-emerald-700/50 flex items-center justify-between px-3">
              <span className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-400" />
                BGM: Synthwave Cyber Pulse
              </span>

              {audioDucking && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-900/60 text-violet-300 font-mono border border-violet-700/40">
                  AI Ducking -14dB Active
                </span>
              )}
            </div>
          </div>

          {/* PLAYHEAD NEEDLE & VERTICAL LINE */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none playhead-needle transition-none"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-3.5 h-3.5 -ml-[6px] -mt-1 bg-rose-500 rounded-sm shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};
