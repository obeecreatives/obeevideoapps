import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoCanvas } from './components/VideoCanvas';
import { MultimodalCommandBar } from './components/MultimodalCommandBar';
import { Timeline } from './components/Timeline';
import { InspectorPanel } from './components/InspectorPanel';
import { ExportModal } from './components/ExportModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CameraRecorderModal } from './components/CameraRecorderModal';
import { SAMPLE_PROJECTS, FILTER_PRESETS } from './constants/presets';
import {
  SampleProject,
  AspectRatio,
  VideoFilterSettings,
  CaptionItem,
  BrollItem,
  StickerOverlay,
  ZoomKeyframe,
  DirectorActionLog,
} from './types/editor';
import { sendCommandToDirector } from './services/aiDirector';

export default function App() {
  // Active Project & Media State
  const [currentProject, setCurrentProject] = useState<SampleProject>(SAMPLE_PROJECTS[0]);
  const [videoUrl, setVideoUrl] = useState<string>(SAMPLE_PROJECTS[0].videoUrl);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(SAMPLE_PROJECTS[0].aspectRatio);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(SAMPLE_PROJECTS[0].duration || 15);

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

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);

  // Shared Canvas & Video Refs for Export
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Switch Project
  const handleSelectProject = (project: SampleProject) => {
    setCurrentProject(project);
    setVideoUrl(project.videoUrl);
    setAspectRatio(project.aspectRatio);
    setFilterSettings(project.defaultFilter || FILTER_PRESETS.none);
    setCaptions(project.defaultCaptions || []);
    setBrolls(project.defaultBroll || []);
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

  // Upload Custom User Video
  const handleUploadCustomVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setCurrentTime(0);
    setIsPlaying(false);
    setCaptions([]);
    setBrolls([]);
    setZoomKeyframes([]);
    setCurrentProject({
      id: `custom-${Date.now()}`,
      title: file.name.slice(0, 32),
      category: 'Kustom Pengguna',
      aspectRatio: '16:9',
      videoUrl: url,
      duration: 15,
      thumbnail: '',
      defaultFilter: FILTER_PRESETS['cinematic-teal'],
      defaultCaptions: [],
      defaultBroll: [],
    });
    setActionLogs((prev) => [
      {
        id: `upload-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        command: `Unggah Video: ${file.name}`,
        actionSummary: 'Video kustom berhasil dimuat ke timeline real-time.',
        directorTip: 'Ketik atau ucapkan perintah untuk mulai memotong hening dan menambahkan efek AI.',
        source: 'text',
      },
      ...prev,
    ]);
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
        // Execute AST actions in real-time
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

            case 'AUDIO_DUCKING':
              if (payload?.enabled !== undefined) {
                setAudioDucking(payload.enabled);
              }
              break;

            case 'ZOOM_EFFECT':
              if (payload) {
                const newZoom: ZoomKeyframe = {
                  id: `zoom-${Date.now()}`,
                  startSec: Number(payload.startSec) || 1.0,
                  endSec: Number(payload.endSec) || 4.0,
                  scale: Number(payload.scale) || 1.3,
                  target: payload.target || 'center',
                };
                setZoomKeyframes((prev) => [...prev, newZoom]);
              }
              break;

            case 'ADD_STICKER_OVERLAY':
              if (payload) {
                const newSticker: StickerOverlay = {
                  id: `stk-${Date.now()}`,
                  text: payload.text || 'HIGHLIGHT',
                  type: payload.type || 'badge',
                  startSec: Number(payload.startSec) || 1.0,
                  endSec: Number(payload.endSec) || 5.0,
                  xPercent: Number(payload.xPercent) || 50,
                  yPercent: Number(payload.yPercent) || 20,
                };
                setStickers((prev) => [...prev, newSticker]);
              }
              break;

            default:
              break;
          }
        });

        // Add action log
        setActionLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            command,
            actionSummary: result.actionSummary || 'Tindakan pengeditan berhasil diterapkan.',
            directorTip: result.directorTip,
            source: imageRef ? 'image' : 'voice',
          },
          ...prev,
        ]);
        setStatusMessage('Tindakan AI berhasil diterapkan seketika!');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Gagal menerapkan tindakan AI.');
    } finally {
      setIsProcessingCommand(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Keyboard Shortcuts (Space for play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyC') {
        handleSplitClip(currentTime);
      } else if (e.code === 'ArrowRight') {
        setCurrentTime((t) => Math.min(duration, t + 1));
      } else if (e.code === 'ArrowLeft') {
        setCurrentTime((t) => Math.max(0, t - 1));
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
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* 2. Main Middle Workspace: Canvas on Left, Inspector on Right */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left / Center Viewport Column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 h-full">
          {/* Real-Time HTML5 Canvas Video Preview */}
          <div className="flex-1 min-h-0 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-inner flex items-center justify-center relative">
            <VideoCanvas
              videoUrl={videoUrl}
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
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
              onTogglePlay={handleTogglePlay}
              canvasRefOut={canvasRef}
              videoRefOut={videoRef}
            />
          </div>

          {/* Multimodal Command Bar (Voice, Text, Image) */}
          <div className="shrink-0">
            <MultimodalCommandBar
              onExecuteCommand={handleExecuteCommand}
              isProcessing={isProcessingCommand}
              statusMessage={statusMessage}
            />
          </div>
        </div>

        {/* Right Inspector & Tools Column */}
        <div className="w-80 lg:w-96 shrink-0 h-full">
          <InspectorPanel
            filterSettings={filterSettings}
            captions={captions}
            brolls={brolls}
            actionLogs={actionLogs}
            duration={duration}
            currentTime={currentTime}
            onUpdateFilter={setFilterSettings}
            onUpdateCaptions={setCaptions}
            onAddBroll={(item) => setBrolls((prev) => [...prev, item])}
            onDeleteBroll={handleDeleteBroll}
            onDeleteCaption={handleDeleteCaption}
          />
        </div>
      </div>

      {/* 3. Bottom Multitrack Timeline */}
      <div className="shrink-0 px-3 pb-3">
        <Timeline
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          captions={captions}
          brolls={brolls}
          audioDucking={audioDucking}
          onSeek={setCurrentTime}
          onTogglePlay={handleTogglePlay}
          onSplitClip={handleSplitClip}
          onDeleteBroll={handleDeleteBroll}
          onDeleteCaption={handleDeleteCaption}
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
    </div>
  );
}
