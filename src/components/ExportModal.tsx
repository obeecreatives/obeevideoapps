import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Loader2,
  CheckCircle2,
  Film,
  Sparkles,
  Sliders,
  Share2,
} from 'lucide-react';
import { AspectRatio, ExplainerProject, VideoFilterSettings } from '../types/editor';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aspectRatio: AspectRatio;
  duration: number;
  filterSettings: VideoFilterSettings;
  explainerProject?: ExplainerProject | null;
  onSeek?: (time: number) => void;
  onSetPlaying?: (playing: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  videoRef,
  aspectRatio,
  duration,
  filterSettings,
  explainerProject,
  onSeek,
  onSetPlaying,
}) => {
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');
  const [fps, setFps] = useState<30 | 60>(60);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas) {
      setErrorMessage('Canvas belum siap untuk dirender.');
      return;
    }

    setErrorMessage(null);
    setIsExporting(true);
    setExportProgress(0);
    setDownloadUrl(null);

    let exportAudioCtx: AudioContext | null = null;
    let exportAudioSource: AudioBufferSourceNode | null = null;

    try {
      // Reset timeline to 0
      if (onSeek) onSeek(0);
      if (video && !(explainerProject?.active)) {
        video.currentTime = 0;
        await video.play().catch(() => {});
      }

      // Capture video stream from canvas
      const canvasStream = canvas.captureStream(fps);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      // If AI Explainer voiceover WAV exists, decode and mux into export stream
      if (explainerProject?.active && explainerProject.audioUrl) {
        try {
          const resp = await fetch(explainerProject.audioUrl);
          const arrayBuf = await resp.arrayBuffer();
          exportAudioCtx = new AudioContext();
          const decoded = await exportAudioCtx.decodeAudioData(arrayBuf);
          const dest = exportAudioCtx.createMediaStreamDestination();
          exportAudioSource = exportAudioCtx.createBufferSource();
          exportAudioSource.buffer = decoded;
          exportAudioSource.connect(dest);
          const audioTracks = dest.stream.getAudioTracks();
          audioTracks.forEach((t) => tracks.push(t));
        } catch (audioErr) {
          console.warn('Could not mux explainer audio into export:', audioErr);
        }
      }

      const combinedStream = new MediaStream(tracks);

      // Setup MediaRecorder
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = 'video/webm';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: resolution === '1080p' ? 8000000 : 4000000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (exportAudioSource) {
          try {
            exportAudioSource.stop();
          } catch {
            // ignore
          }
        }
        if (exportAudioCtx) {
          exportAudioCtx.close().catch(() => {});
        }
        if (onSetPlaying) onSetPlaying(false);
        const blob = new Blob(chunks, { type: selectedMime });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsExporting(false);
        setExportProgress(100);
      };

      recorder.start();
      if (exportAudioSource) {
        exportAudioSource.start(0);
      }
      if (onSetPlaying) onSetPlaying(true);

      // Progress tracker based on project duration
      const totalSec = Math.max(3, duration || 15);
      const startMs = performance.now();
      const interval = setInterval(() => {
        const elapsedSec = (performance.now() - startMs) / 1000;
        const progress = Math.min(100, Math.round((elapsedSec / totalSec) * 100));
        setExportProgress(progress);

        if (elapsedSec >= totalSec) {
          clearInterval(interval);
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          if (video) video.pause();
        }
      }, 150);
    } catch (err) {
      console.error('Export failed:', err);
      if (exportAudioCtx) exportAudioCtx.close().catch(() => {});
      if (onSetPlaying) onSetPlaying(false);
      setIsExporting(false);
      setErrorMessage('Gagal mengekspor video melalui MediaRecorder browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative text-zinc-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Ekspor Video AI Real-Time</h3>
              <p className="text-xs text-zinc-400">
                Render semua layer sinematik, subtitle, dan B-roll ke file video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Export Configuration */}
        {!downloadUrl && !isExporting && (
          <div className="space-y-4 text-xs">
            {/* Resolution Selector */}
            <div>
              <label className="font-semibold text-zinc-300 block mb-2">Resolusi Video</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    resolution === '1080p'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-bold text-sm">1080p Full HD</span>
                  <span className="text-[10px] text-zinc-400">
                    Kualitas tajam untuk YouTube, TikTok & Reels
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    resolution === '720p'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-bold text-sm">720p Standard</span>
                  <span className="text-[10px] text-zinc-400">
                    Ukuran file lebih ringan dan cepat
                  </span>
                </button>
              </div>
            </div>

            {/* Framerate & Aspect ratio info */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-zinc-400 block">Rasio Aspek Terpilih:</span>
                <span className="font-bold text-cyan-400 font-mono text-sm">{aspectRatio}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Color LUT:</span>
                <span className="font-mono text-amber-400 text-sm">
                  {filterSettings.filter.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Framerate:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{fps} FPS</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Display */}
        {isExporting && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
            <div>
              <div className="font-bold text-sm text-zinc-100">
                Merender Video dengan Canvas Engine...
              </div>
              <div className="text-xs text-zinc-400 font-mono mt-1">
                Proses: {exportProgress}% • Membakar subtitle & color grade real-time
              </div>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-200 shadow-sm shadow-cyan-500/50"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Download Success Screen */}
        {downloadUrl && (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-zinc-100">Render Video Selesai!</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Video siap diunduh dan dipublikasikan ke media sosial Anda.
              </p>
            </div>
            <a
              href={downloadUrl}
              download={`obeevideo-export-${Date.now()}.webm`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Video Sekarang (WebM / HD)</span>
            </a>
          </div>
        )}

        {/* Footer Actions */}
        {!downloadUrl && !isExporting && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleStartExport}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mulai Render & Ekspor</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
