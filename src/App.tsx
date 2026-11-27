import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoCanvas } from './components/VideoCanvas';
import { MultimodalCommandBar } from './components/MultimodalCommandBar';
import { Timeline } from './components/Timeline';
import { InspectorPanel } from './components/InspectorPanel';
import { ExportModal } from './components/ExportModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CameraRecorderModal } from './components/CameraRecorderModal';
import { UserGuideModal } from './components/UserGuideModal';
import { ExplainerGeneratorModal } from './components/ExplainerGeneratorModal';
import { SAMPLE_PROJECTS, FILTER_PRESETS, DEFAULT_LAYOUT_SETTINGS } from './constants/presets';
import {
  SampleProject,
  AspectRatio,
  VideoFilterSettings,
  CaptionItem,
  BrollItem,
  StickerOverlay,
  ZoomKeyframe,
  DirectorActionLog,
  VideoClip,
  LayoutSettings,
  PreviewQuality,
  ExplainerProject,
} from './types/editor';
import { sendCommandToDirector } from './services/aiDirector';
import { Mic, Sparkles, Layers } from 'lucide-react';

export default function App() {
  // Active Project & Media State
  const [currentProject, setCurrentProject] = useState<SampleProject>(SAMPLE_PROJECTS[0]);
  const [videoUrl, setVideoUrl] = useState<string>(SAMPLE_PROJECTS[0].videoUrl);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(SAMPLE_PROJECTS[0].aspectRatio);

  // Multi-clip video sequence state
  const [videoClips, setVideoClips] = useState<VideoClip[]>([
    {
      id: 'clip-master-1',
      sourceUrl: SAMPLE_PROJECTS[0].videoUrl,
      title: SAMPLE_PROJECTS[0].title,
      startSec: 0,
      duration: SAMPLE_PROJECTS[0].duration,
      sourceStartSec: 0,
      sourceDuration: SAMPLE_PROJECTS[0].duration,
      speed: 1,
      volume: 1,
      muted: false,
    },
  ]);

  // Playback & Preview Quality State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(SAMPLE_PROJECTS[0].duration || 15);
  const [previewQuality, setPreviewQuality] = useState<PreviewQuality>('normal');

  // Video Layout Template State (Solo, Split-Vertical, Split-Horizontal, PIP)
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(DEFAULT_LAYOUT_SETTINGS);

  // Video Shaders & Filter State
  const [filterSettings, setFilterSettings] = useState<VideoFilterSettings>(
    SAMPLE_PROJECTS[0].defaultFilter || FILTER_PRESETS['cinematic-teal']
  );

  // Timeline Tracks State
  const [captions, setCaptions] = useState<CaptionItem[]>(
    SAMPLE_PROJECTS[0].defaultCaptions || []
  );
  const [brolls, setBrolls] = useState<BrollItem[]>(
    SAMPLE_PROJECTS[0].defaultBroll || []
  );
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);
  const [zoomKeyframes, setZoomKeyframes] = useState<ZoomKeyframe[]>([]);
  const [audioDucking, setAudioDucking] = useState<boolean>(false);


  // AI Director Logs State
  const [actionLogs, setActionLogs] = useState<DirectorActionLog[]>([
    {
      id: 'init-log',
      timestamp: 'Baru saja',
      command: 'Inisialisasi Project AI Director',
      actionSummary: 'Proyek dimuat dengan preset sinematik Teal & Orange dan subtitle dinamis.',
      directorTip: 'Gunakan suara untuk perintah seperti "Potong hening", "Ubah ke 9:16", atau "Beri B-roll cyber".',
      source: 'text',
    },
  ]);

  // Command Processing States
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Mobile Workspace Active Tab ('director' | 'studio' | 'timeline')
  const [mobileTab, setMobileTab] = useState<'director' | 'studio' | 'timeline'>('director');

  // AI Motion Explainer Project State (Free-tier Prompt-to-Explainer)
  const [explainerProject, setExplainerProject] = useState<ExplainerProject | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  // Shared Canvas, Video & Audio Refs for Export
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Helper: build balanced, synced captions from explainer slides (no orphan single words)
  const buildExplainerCaptions = useCallback((project: ExplainerProject): CaptionItem[] => {
    const items: CaptionItem[] = [];
    project.slides.forEach((slide, sIdx) => {
      const text = slide.narration.trim();
      if (!text) return;
      const words = text.split(/\s+/);
      const slideDur = Math.max(0.8, slide.endSec - slide.startSec);

      // Distribute words evenly across N balanced chunks (max ~7 words per chunk)
      const chunkCount = Math.max(1, Math.ceil(words.length / 7));
      const baseSize = Math.floor(words.length / chunkCount);
      const remainder = words.length % chunkCount;
      const chunks: string[] = [];
      let idx = 0;
      for (let c = 0; c < chunkCount; c++) {
        const size = baseSize + (c < remainder ? 1 : 0);
        chunks.push(words.slice(idx, idx + size).join(' '));
        idx += size;
      }

      // Weight each chunk by spoken character + punctuation length
      const weights = chunks.map((ch) => {
        const pauses = (ch.match(/[.,!?;:]/g) || []).length * 6;
        return Math.max(6, ch.length + pauses);
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let cursor = slide.startSec;
      chunks.forEach((chunk, cIdx) => {
        const segDur = (weights[cIdx] / totalWeight) * slideDur;
        const startSec = Number(cursor.toFixed(2));
        cursor += segDur;
        const endSec =
          cIdx === chunks.length - 1 ? slide.endSec : Number(cursor.toFixed(2));
        items.push({
          id: `exp-cap-${sIdx}-${cIdx}-${Date.now()}`,
          text: chunk,
          startSec,
          endSec,
          style: 'clean-minimal',
          color: slide.accentColor || '#38bdf8',
        });
      });
    });
    return items;
  }, []);

  // Apply generated AI Motion Explainer directly to the editor timeline
  const handleApplyExplainer = useCallback(
    (
      project: ExplainerProject,
      options: {
        aspectRatio: AspectRatio;
        compositionMode: 'fullscreen' | 'split-presenter';
        audioWarning?: string | null;
      }
    ) => {
      setExplainerProject(project);
      setAspectRatio(options.aspectRatio);
      setDuration(project.totalDuration);
      setCurrentTime(0);
      setIsPlaying(false);
      setBrolls([]);
      setStickers([]);
      setZoomKeyframes([]);
      setCaptions(buildExplainerCaptions(project));

      if (options.compositionMode === 'split-presenter') {
        setLayoutSettings((prev) => ({
          ...prev,
          type: options.aspectRatio === '9:16' ? 'split-vertical' : 'split-horizontal',
          splitRatio: 0.42,
          swapSlots: false,
        }));
      } else {
        setLayoutSettings((prev) => ({
          ...prev,
          type: 'solo',
          swapSlots: false,
        }));
      }

      setActionLogs((prev) => [
        {
          id: `explainer-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          command: `AI Motion Explainer: ${project.title}`,
          actionSummary: options.audioWarning
            ? `Berhasil membuat ${project.slides.length} slide animasi (${options.audioWarning})`
            : `Berhasil membuat ${project.slides.length} slide animasi + suara narator AI (${project.voiceName}) dan subtitle otomatis.`,
          directorTip:
            'Klik Play untuk melihat animasi & mendengar suara AI. Anda juga bisa menggabungkannya dengan rekaman presenter di tab Template Layout.',
          source: 'text',
        },
        ...prev,
      ]);
    },
    [buildExplainerCaptions]
  );

  // Rescale explainer slides & captions tightly to actual spoken WAV duration (weighted by syllables/characters + punctuation)
  const handleExplainerAudioDuration = useCallback(
    (actualAudioSec: number) => {
      if (!actualAudioSec || !Number.isFinite(actualAudioSec) || actualAudioSec < 1) return;
      setExplainerProject((prev) => {
        if (!prev || !prev.active || prev.slides.length === 0) return prev;
        if (Math.abs(prev.totalDuration - actualAudioSec) < 0.15) return prev;

        const targetTotal = Number(actualAudioSec.toFixed(2));
        const spokenWeights = prev.slides.map((s) => {
          const txt = s.narration.trim();
          const commaPauses = (txt.match(/[,;:]/g) || []).length * 5;
          const sentencePauses = (txt.match(/[.!?]/g) || []).length * 9;
          return Math.max(12, txt.length + commaPauses + sentencePauses);
        });
        const totalWeight = spokenWeights.reduce((acc, n) => acc + n, 0);

        let cursor = 0;
        const rescaledSlides = prev.slides.map((slide, idx) => {
          const share = (spokenWeights[idx] / totalWeight) * targetTotal;
          const startSec = Number(cursor.toFixed(2));
          cursor += share;
          const endSec =
            idx === prev.slides.length - 1 ? targetTotal : Number(cursor.toFixed(2));
          return { ...slide, startSec, endSec };
        });

        const updated: ExplainerProject = {
          ...prev,
          slides: rescaledSlides,
          totalDuration: targetTotal,
        };
        setDuration(targetTotal);
        setCaptions(buildExplainerCaptions(updated));
        return updated;
      });
    },
    [buildExplainerCaptions]
  );

  const handleUpdateExplainer = useCallback(
    (updated: ExplainerProject | null) => {
      setExplainerProject(updated);
      if (updated) {
        setCaptions(buildExplainerCaptions(updated));
      } else {
        setLayoutSettings((prev) => ({ ...prev, type: 'solo' }));
      }
    },
    [buildExplainerCaptions]
  );

  // Switch Project
  const handleSelectProject = (project: SampleProject) => {
    setExplainerProject(null);
    setCurrentProject(project);
    setVideoUrl(project.videoUrl);
    setAspectRatio(project.aspectRatio);
    setFilterSettings(project.defaultFilter || FILTER_PRESETS.none);
    setCaptions(project.defaultCaptions || []);
    setBrolls(project.defaultBroll || []);
    setDuration(project.duration || 15);
    setVideoClips([
      {
        id: `clip-${project.id}`,
        sourceUrl: project.videoUrl,
        title: project.title,
        startSec: 0,
        duration: project.duration || 15,
        sourceStartSec: 0,
        sourceDuration: project.duration || 15,
        speed: 1,
        volume: 1,
        muted: false,
      },
    ]);
    setCurrentTime(0);
    setIsPlaying(false);
    setActionLogs((prev) => [
      {
        id: `switch-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        command: `Buka template: ${project.title}`,
        actionSummary: `Memuat media dan komposisi ${project.category}.`,
        directorTip: 'Sesuaikan subtitle dan rasio aspek sesuai platform tujuan.',
        source: 'text',
      },
      ...prev,
    ]);
  };

  // Upload Multiple Custom User Videos at once
  const handleUploadCustomVideos = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setStatusMessage(`Memproses ${files.length} video terpilih...`);
    setIsProcessingCommand(true);

    try {
      const newClips: VideoClip[] = [];
      let cumulativeTime = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);

        // Calculate actual duration via hidden video element
        const dur = await new Promise<number>((resolve) => {
          const tempVid = document.createElement('video');
          tempVid.preload = 'metadata';
          tempVid.src = url;
          tempVid.onloadedmetadata = () => {
            resolve(tempVid.duration > 0 ? tempVid.duration : 10);
          };
          tempVid.onerror = () => {
            resolve(10);
          };
        });

        newClips.push({
          id: `clip-${Date.now()}-${i}`,
          sourceUrl: url,
          title: file.name.replace(/\.[^/.]+$/, '').slice(0, 24),
          startSec: cumulativeTime,
          duration: dur,
          sourceStartSec: 0,
          sourceDuration: dur,
          speed: 1,
          volume: 1,
          muted: false,
        });

        cumulativeTime += dur;
      }

      const totalDuration = cumulativeTime;
      const keepExplainerSplit = Boolean(explainerProject?.active && layoutSettings.type !== 'solo');
      setVideoClips(newClips);
      setVideoUrl(newClips[0].sourceUrl);
      if (!keepExplainerSplit) {
        setExplainerProject(null);
        setDuration(totalDuration);
        setCaptions([]);
      }
      setCurrentTime(0);
      setIsPlaying(false);
      setBrolls([]);
      setZoomKeyframes([]);

      setCurrentProject({
        id: `custom-multi-${Date.now()}`,
        title: `${files.length} Video Tergabung`,
        category: 'Rangkaian Video',
        aspectRatio: '16:9',
        videoUrl: newClips[0].sourceUrl,
        duration: totalDuration,
        thumbnail: '',
        defaultFilter: filterSettings,
        defaultCaptions: [],
        defaultBroll: [],
      });

      setActionLogs((prev) => [
        {
          id: `upload-multi-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          command: `Unggah ${files.length} Video Sekaligus`,
          actionSummary: `Berhasil menggabungkan ${files.length} klip video ke timeline dengan durasi total ${totalDuration.toFixed(1)} detik.`,
          directorTip: 'Klip tersusun berurutan di track V1. Anda dapat menyunting atau memberi instruksi suara ke AI Director.',
          source: 'text',
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Error processing multi-video upload:', err);
    } finally {
      setIsProcessingCommand(false);
      setStatusMessage('');
    }
  };

  // Upload Single Custom User Video fallback
  const handleUploadCustomVideo = (file: File) => {
    handleUploadCustomVideos([file]);
  };

  // Delete a clip from multi-clip sequence
  const handleDeleteClip = (clipId: string) => {
    setVideoClips((prev) => {
      const filtered = prev.filter((c) => c.id !== clipId);
      if (filtered.length === 0) return prev;
      let cum = 0;
      const recalculated = filtered.map((c) => {
        const updated = { ...c, startSec: cum };
        cum += c.duration;
        return updated;
      });
      setDuration(cum);
      if (currentTime >= cum) {
        setCurrentTime(0);
      }
      return recalculated;
    });
  };

  // Toggle Play
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Split Clip at Time
  const handleSplitClip = (time: number) => {
    setActionLogs((prev) => [
      {
        id: `split-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        command: `Split Clip pada ${time.toFixed(1)}s`,
        actionSummary: `Memotong segmen klip video master pada posisi playhead.`,
        directorTip: 'Kamu bisa menghapus atau menerapkan efek berbeda pada klip baru ini.',
        source: 'text',
      },
      ...prev,
    ]);
  };

  // Delete B-Roll item
  const handleDeleteBroll = (id: string) => {
    setBrolls((prev) => prev.filter((b) => b.id !== id));
  };

  // Delete Caption item
  const handleDeleteCaption = (id: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
  };

  // Core Multimodal AI Dispatcher
  const handleExecuteCommand = async (command: string, imageRef?: string) => {
    setIsProcessingCommand(true);
    setStatusMessage(`AI Director menganalisis: "${command}"...`);

    try {
      const currentContext = {
        duration,
        currentTime,
        aspectRatio,
        activeFilter: filterSettings.filter,
        captionsCount: captions.length,
        brollCount: brolls.length,
      };

      const result = await sendCommandToDirector(command, currentContext, imageRef);

      if (result.success && result.actions) {
        result.actions.forEach((act) => {
          const { type, payload } = act as any;

          switch (type) {
            case 'SET_COLOR_FILTER':
              if (payload?.filter && FILTER_PRESETS[payload.filter as keyof typeof FILTER_PRESETS]) {
                const basePreset = FILTER_PRESETS[payload.filter as keyof typeof FILTER_PRESETS];
                setFilterSettings({
                  ...basePreset,
                  contrast: payload.contrast ?? basePreset.contrast,
                  saturation: payload.saturation ?? basePreset.saturation,
                  brightness: payload.brightness ?? basePreset.brightness,
                  vignette: payload.vignette ?? basePreset.vignette,
                });
              } else if (payload) {
                setFilterSettings((prev) => ({
                  ...prev,
                  contrast: payload.contrast ?? prev.contrast,
                  saturation: payload.saturation ?? prev.saturation,
                  brightness: payload.brightness ?? prev.brightness,
                  vignette: payload.vignette ?? prev.vignette,
                }));
              }
              break;

            case 'ADD_CAPTIONS':
              if (payload?.captions && Array.isArray(payload.captions)) {
                const mapped: CaptionItem[] = payload.captions.map((c: any, i: number) => ({
                  id: `ai-cap-${Date.now()}-${i}`,
                  text: c.text,
                  startSec: Number(c.startSec) || 0,
                  endSec: Number(c.endSec) || Math.min(duration, 3.5),
                  style: c.style || 'alex-hormozi',
                  color: c.color || '#FACC15',
                  emoji: c.emoji,
                  highlightWord: c.highlightWord,
                }));
                setCaptions(mapped);
              }
              break;

            case 'GENERATE_BROLL':
              if (payload) {
                const newBroll: BrollItem = {
                  id: `ai-broll-${Date.now()}`,
                  title: payload.title || payload.prompt?.slice(0, 20) || 'AI B-Roll',
                  type: 'image',
                  url:
                    payload.visualCategory === 'tech'
                      ? 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
                      : payload.visualCategory === 'city'
                      ? 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'
                      : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
                  startSec: Number(payload.startSec) || Math.max(0, currentTime),
                  duration: Number(payload.endSec ? payload.endSec - payload.startSec : 3.5),
                  category: payload.visualCategory || 'tech',
                  opacity: 0.88,
                  blendMode: 'screen',
                };
                setBrolls((prev) => [...prev, newBroll]);
              }
              break;

            case 'SET_ASPECT_RATIO':
              if (payload?.ratio) {
                setAspectRatio(payload.ratio as AspectRatio);
              }
              break;

            case 'ADD_STICKER':
              if (payload) {
                const newSticker: StickerOverlay = {
                  id: `ai-stick-${Date.now()}`,
                  text: payload.text || '🔥 HIGHLIGHT',
                  type: payload.type || 'badge',
                  startSec: Number(payload.startSec) || currentTime,
                  endSec: Number(payload.endSec) || currentTime + 3,
                  xPercent: Number(payload.xPercent) || 50,
                  yPercent: Number(payload.yPercent) || 75,
                };
                setStickers((prev) => [...prev, newSticker]);
              }
              break;

            case 'ZOOM_PUNCH':
              if (payload) {
                const newZoom: ZoomKeyframe = {
                  id: `ai-zoom-${Date.now()}`,
                  startSec: Number(payload.startSec) || currentTime,
                  endSec: Number(payload.endSec) || currentTime + 2,
                  scale: Number(payload.scale) || 1.25,
                  target: payload.target || 'center',
                };
                setZoomKeyframes((prev) => [...prev, newZoom]);
              }
              break;

            case 'AUDIO_DUCKING':
              setAudioDucking(Boolean(payload?.enabled));
              break;

            case 'CUT_SILENCE':
              handleSplitClip(currentTime);
              break;

            case 'SET_LAYOUT':
              if (payload?.type) {
                setLayoutSettings((prev) => ({
                  ...prev,
                  type: payload.type,
                  splitRatio: payload.splitRatio !== undefined ? Number(payload.splitRatio) : prev.splitRatio,
                  pipScale: payload.pipScale !== undefined ? Number(payload.pipScale) : prev.pipScale,
                  pipPosition: payload.pipPosition || prev.pipPosition,
                  swapSlots: payload.swapSlots !== undefined ? Boolean(payload.swapSlots) : prev.swapSlots,
                }));
              }
              break;

            case 'SWAP_LAYOUT_SLOTS':
              setLayoutSettings((prev) => ({
                ...prev,
                swapSlots: !prev.swapSlots,
              }));
              break;

            case 'RESIZE_LAYOUT':
              setLayoutSettings((prev) => ({
                ...prev,
                splitRatio: payload?.splitRatio !== undefined ? Number(payload.splitRatio) : prev.splitRatio,
                pipScale: payload?.pipScale !== undefined ? Number(payload.pipScale) : prev.pipScale,
              }));
              break;

            default:
              break;
          }

        });

        // Record AI Director Action Log
        const newLog: DirectorActionLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          command: command.length > 40 ? `${command.slice(0, 40)}...` : command,
          actionSummary: result.actionSummary || 'AI Director menerapkan penyesuaian pada timeline.',
          directorTip: result.directorTip,
          source: imageRef ? 'image' : 'voice',
        };

        setActionLogs((prev) => [newLog, ...prev]);
        setStatusMessage(result.actionSummary || 'Aksi berhasil dieksekusi!');
      } else {
        setStatusMessage('AI Director tidak dapat mengeksekusi instruksi ini.');
      }
    } catch (error) {
      console.error('Command execution failed:', error);
      setStatusMessage('Gagal memproses instruksi dengan AI Director.');
    } finally {
      setIsProcessingCommand(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Keyboard Shortcuts: Space for play/pause, Left/Right for seek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((t) => Math.max(0, t - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((t) => Math.min(duration, t + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, currentTime, duration]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <Header
        currentProject={currentProject}
        aspectRatio={aspectRatio}
        onSelectProject={handleSelectProject}
        onSelectAspectRatio={setAspectRatio}
        onUploadCustomVideo={handleUploadCustomVideo}
        onUploadCustomVideos={handleUploadCustomVideos}
        videoClipsCount={videoClips.length}
        hasActiveExplainer={Boolean(explainerProject?.active)}
        onOpenExplainer={() => setIsExplainerOpen(true)}
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* 2. Main Middle Workspace: Responsive across Mobile Portrait, Mobile Landscape, and Desktop */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row lg:flex-row overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Viewport / Video Canvas Column */}
        <div className="flex flex-col gap-2 sm:gap-3 min-w-0 h-[34vh] sm:h-[38vh] landscape:h-full w-full landscape:w-1/2 lg:w-auto lg:flex-1 shrink-0 landscape:shrink">
          {/* Real-Time HTML5 Canvas Video Preview */}
          <div className="flex-1 min-h-0 bg-zinc-900/60 rounded-xl sm:rounded-2xl border border-zinc-800/80 overflow-hidden shadow-inner flex items-center justify-center relative">
            <VideoCanvas
              videoUrl={videoUrl}
              videoClips={videoClips}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              aspectRatio={aspectRatio}
              filterSettings={filterSettings}
              captions={captions}
              brolls={brolls}
              stickers={stickers}
              zoomKeyframes={zoomKeyframes}
              audioDucking={audioDucking}
              layoutSettings={layoutSettings}
              previewQuality={previewQuality}
              explainerProject={explainerProject}
              onExplainerAudioDuration={handleExplainerAudioDuration}
              onPreviewQualityChange={setPreviewQuality}
              onUpdateLayoutSettings={setLayoutSettings}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
              onTogglePlay={handleTogglePlay}
              canvasRefOut={canvasRef}
              videoRefOut={videoRef}
              audioRefOut={audioRef}
            />

          </div>

          {/* Multimodal Command Bar (Desktop Only - displayed directly under video) */}
          <div className="hidden lg:block shrink-0">
            <MultimodalCommandBar
              onExecuteCommand={handleExecuteCommand}
              isProcessing={isProcessingCommand}
              statusMessage={statusMessage}
            />
          </div>
        </div>

        {/* Mobile Control Center (< lg only): Tab Switcher + Active Content */}
        <div className="lg:hidden flex-1 min-h-0 flex flex-col min-w-0 w-full landscape:w-1/2 landscape:h-full overflow-hidden bg-zinc-900/40 rounded-xl border border-zinc-800/80 p-1.5 sm:p-2">
          {/* Mobile Tab Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800/90 mb-2 gap-1 shrink-0 text-xs shadow-sm">
            <button
              onClick={() => setMobileTab('director')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                mobileTab === 'director'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="truncate">AI Director & Tools</span>
            </button>

            <button
              onClick={() => setMobileTab('studio')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                mobileTab === 'studio'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="truncate">Perintah Suara</span>
            </button>

            <button
              onClick={() => setMobileTab('timeline')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                mobileTab === 'timeline'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="truncate">Timeline ({videoClips.length})</span>
            </button>
          </div>

          {/* Mobile Active Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {mobileTab === 'director' && (
              <div className="h-full">
                <InspectorPanel
                  filterSettings={filterSettings}
                  captions={captions}
                  brolls={brolls}
                  actionLogs={actionLogs}
                  duration={duration}
                  currentTime={currentTime}
                  layoutSettings={layoutSettings}
                  previewQuality={previewQuality}
                  videoClips={videoClips}
                  onUpdateLayoutSettings={setLayoutSettings}
                  onPreviewQualityChange={setPreviewQuality}
                  onUpdateFilter={setFilterSettings}
                  onUpdateCaptions={setCaptions}
                  onAddBroll={(item) => setBrolls((prev) => [...prev, item])}
                  onDeleteBroll={handleDeleteBroll}
                  onDeleteCaption={handleDeleteCaption}
                />
              </div>
            )}

            {mobileTab === 'studio' && (
              <div className="space-y-3 pb-2">
                <MultimodalCommandBar
                  onExecuteCommand={handleExecuteCommand}
                  isProcessing={isProcessingCommand}
                  statusMessage={statusMessage}
                />

                {/* Quick AI Director Log Summary */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Riwayat Aksi AI ({actionLogs.length})
                    </span>
                    <button
                      onClick={() => setMobileTab('director')}
                      className="text-[11px] text-cyan-400 font-medium hover:underline cursor-pointer"
                    >
                      Buka Panel Lengkap →
                    </button>
                  </div>
                  {actionLogs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400">
                        <span className="text-cyan-400 font-semibold">{log.command}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {log.actionSummary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mobileTab === 'timeline' && (
              <div className="h-full">
                <Timeline
                  duration={duration}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  captions={captions}
                  brolls={brolls}
                  videoClips={videoClips}
                  audioDucking={audioDucking}
                  onSeek={setCurrentTime}
                  onTogglePlay={handleTogglePlay}
                  onSplitClip={handleSplitClip}
                  onDeleteBroll={handleDeleteBroll}
                  onDeleteCaption={handleDeleteCaption}
                  onDeleteClip={handleDeleteClip}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop Inspector Panel Column (>= lg only) */}
        <div className="hidden lg:block w-80 lg:w-96 shrink-0 h-full">
          <InspectorPanel
            filterSettings={filterSettings}
            captions={captions}
            brolls={brolls}
            actionLogs={actionLogs}
            duration={duration}
            currentTime={currentTime}
            layoutSettings={layoutSettings}
            previewQuality={previewQuality}
            videoClips={videoClips}
            onUpdateLayoutSettings={setLayoutSettings}
            onPreviewQualityChange={setPreviewQuality}
            onUpdateFilter={setFilterSettings}
            onUpdateCaptions={setCaptions}
            onAddBroll={(item) => setBrolls((prev) => [...prev, item])}
            onDeleteBroll={handleDeleteBroll}
            onDeleteCaption={handleDeleteCaption}
          />

        </div>
      </div>

      {/* 3. Bottom Multitrack Timeline (Desktop >= lg only) */}
      <div className="hidden lg:block shrink-0 px-3 pb-3">
        <Timeline
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          captions={captions}
          brolls={brolls}
          videoClips={videoClips}
          audioDucking={audioDucking}
          onSeek={setCurrentTime}
          onTogglePlay={handleTogglePlay}
          onSplitClip={handleSplitClip}
          onDeleteBroll={handleDeleteBroll}
          onDeleteCaption={handleDeleteCaption}
          onDeleteClip={handleDeleteClip}
        />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvasRef={canvasRef}
        videoRef={videoRef}
        aspectRatio={aspectRatio}
        duration={duration}
        filterSettings={filterSettings}
        explainerProject={explainerProject}
        onSeek={setCurrentTime}
        onSetPlaying={setIsPlaying}
      />

      <ExplainerGeneratorModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        currentAspectRatio={aspectRatio}
        activeExplainer={explainerProject}
        onApplyExplainer={handleApplyExplainer}
        onUpdateExplainer={handleUpdateExplainer}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <CameraRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onRecordingComplete={handleUploadCustomVideo}
      />

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        shareUrl="https://ais-pre-uywl2uudm2r3yigxejum7f-421277974915.asia-southeast1.run.app"
      />
    </div>
  );
}
