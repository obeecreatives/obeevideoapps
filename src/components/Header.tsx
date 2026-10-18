import React, { useRef, useState, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Download,
  BookOpen,
  Upload,
  Camera,
  Layers,
  Monitor,
  Smartphone,
  Square,
  Maximize2,
  DownloadCloud,
} from 'lucide-react';
import { AspectRatio, SampleProject } from '../types/editor';
import { SAMPLE_PROJECTS } from '../constants/presets';

interface HeaderProps {
  currentProject: SampleProject;
  aspectRatio: AspectRatio;
  onSelectProject: (proj: SampleProject) => void;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  onUploadCustomVideo: (file: File) => void;
  onOpenRecorder: () => void;
  onOpenExport: () => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  aspectRatio,
  onSelectProject,
  onSelectAspectRatio,
  onUploadCustomVideo,
  onOpenRecorder,
  onOpenExport,
  onOpenArchitecture,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'Untuk menginstal di Chrome/Edge: Klik ikon "Install" di ujung kanan bilah alamat (address bar) browser Anda, atau pilih Menu (titik tiga) > "Install obeeVideo Apps".'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustomVideo(file);
    }
  };

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-zinc-100 select-none sticky top-0 z-40 backdrop-blur-md">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Film className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                obeeVideo Apps
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500 text-black">
                AI REAL-TIME
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Multimodal Video Director • Voice, Text & Visual
            </p>
          </div>
        </div>

        {/* Project Selector dropdown */}
        <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-zinc-800 gap-2">
          <span className="text-[11px] text-zinc-500 font-medium">Proyek:</span>
          <select
            value={currentProject.id}
            onChange={(e) => {
              const p = SAMPLE_PROJECTS.find((item) => item.id === e.target.value);
              if (p) onSelectProject(p);
            }}
            className="bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {SAMPLE_PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Record Live Camera / Webcam */}
          <button
            onClick={onOpenRecorder}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-xs text-rose-300 hover:text-white transition-colors cursor-pointer"
            title="Rekam langsung dari kamera & mikrofon"
          >
            <Camera className="w-3.5 h-3.5 text-rose-400" />
            <span>Rekam Kamera</span>
          </button>

          {/* Upload custom user video */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Unggah video lokal kamu (MP4, WebM, MOV)"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unggah Video</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Center: Aspect Ratio Toggle Switcher */}
      <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 gap-1 text-xs">
        <button
          onClick={() => onSelectAspectRatio('16:9')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
            aspectRatio === '16:9'
              ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="YouTube Landscape (16:9)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>16:9</span>
        </button>

        <button
          onClick={() => onSelectAspectRatio('9:16')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
            aspectRatio === '9:16'
              ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="TikTok / Reels / Shorts (9:16)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16 Reels</span>
        </button>

        <button
          onClick={() => onSelectAspectRatio('1:1')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
            aspectRatio === '1:1'
              ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Instagram Feed Square (1:1)"
        >
          <Square className="w-3.5 h-3.5" />
          <span>1:1</span>
        </button>

        <button
          onClick={() => onSelectAspectRatio('4:5')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
            aspectRatio === '4:5'
              ? 'bg-zinc-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Social Portrait (4:5)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>4:5</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* PWA Install App Button */}
        <button
          onClick={handleInstallApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shadow-sm"
          title="Install aplikasi ke Desktop / Laptop / HP (PWA)"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {/* Architecture Blueprint Button */}
        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm"
          title="Lihat Arsitektur Sistem & Preferensi Rekayasa Perangkat Lunak"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Preferensi & Arsitektur</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Video</span>
        </button>
      </div>
    </header>
  );
};
