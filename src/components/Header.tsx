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
  X,
  Menu,
  HelpCircle,
  Share2,
  Presentation,
} from 'lucide-react';
import { AspectRatio, SampleProject } from '../types/editor';
import { SAMPLE_PROJECTS } from '../constants/presets';

interface HeaderProps {
  currentProject: SampleProject;
  aspectRatio: AspectRatio;
  onSelectProject: (proj: SampleProject) => void;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
  onUploadCustomVideo?: (file: File) => void;
  onUploadCustomVideos: (files: File[]) => void;
  videoClipsCount?: number;
  hasActiveExplainer?: boolean;
  onOpenExplainer: () => void;
  onOpenRecorder: () => void;
  onOpenExport: () => void;
  onOpenArchitecture: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  aspectRatio,
  onSelectProject,
  onSelectAspectRatio,
  onUploadCustomVideo,
  onUploadCustomVideos,
  videoClipsCount = 1,
  hasActiveExplainer = false,
  onOpenExplainer,
  onOpenRecorder,
  onOpenExport,
  onOpenArchitecture,
  onOpenGuide,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      setShowInstallGuide(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      if (onUploadCustomVideos) {
        onUploadCustomVideos(files);
      } else if (onUploadCustomVideo) {
        onUploadCustomVideo(files[0]);
      }
      setIsMobileMenuOpen(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <header className="w-full bg-zinc-950/95 border-b border-zinc-800/80 px-3 sm:px-4 py-2 flex items-center justify-between text-zinc-100 select-none sticky top-0 z-40 backdrop-blur-md">
        {/* Brand logo & tagline */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  obeeVideo
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-cyan-500 text-black">
                  AI
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 hidden sm:block">
                Multimodal Video Director
              </p>
            </div>
          </div>

          {/* Project Selector dropdown (Desktop >= lg) */}
          <div className="hidden lg:flex items-center ml-3 pl-3 border-l border-zinc-800 gap-2">
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
              title="Rekam langsung dari webcam/kamera"
            >
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Rekam Kamera</span>
            </button>

            {/* AI Motion Explainer & Voiceover Generator (Free-tier) */}
            <button
              onClick={onOpenExplainer}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                hasActiveExplainer
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/60 text-emerald-200'
                  : 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 hover:from-cyan-900/80 hover:to-indigo-900/80 border-cyan-500/40 text-cyan-200'
              }`}
              title="Buat video iklan, tutorial, atau editorial otomatis dari prompt + suara AI"
            >
              <Presentation className="w-3.5 h-3.5 text-cyan-400" />
              <span>{hasActiveExplainer ? 'Edit Explainer' : 'Buat dari Prompt'}</span>
            </button>

            {/* Upload custom user video (supports multiple files) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Unggah satu atau banyak video sekaligus (MP4, WebM, MOV)"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Unggah Video</span>
              {videoClipsCount > 1 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                  {videoClipsCount} klip
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input for custom video (supports multiple files) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Center: Aspect Ratio Toggle Switcher */}
        {/* Desktop Version */}
        <div className="hidden md:flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 gap-1 text-xs">
          <button
            onClick={() => onSelectAspectRatio('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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

        {/* Mobile Aspect Ratio Dropdown */}
        <div className="flex md:hidden items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs">
          <span className="text-zinc-500 mr-1 text-[10px] hidden xs:inline">Rasio:</span>
          <select
            value={aspectRatio}
            onChange={(e) => onSelectAspectRatio(e.target.value as AspectRatio)}
            className="bg-transparent text-cyan-400 font-bold outline-none cursor-pointer text-xs"
          >
            <option value="16:9" className="bg-zinc-900 text-zinc-100">16:9</option>
            <option value="9:16" className="bg-zinc-900 text-zinc-100">9:16</option>
            <option value="1:1" className="bg-zinc-900 text-zinc-100">1:1</option>
            <option value="4:5" className="bg-zinc-900 text-zinc-100">4:5</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Guide Button */}
          <button
            onClick={onOpenGuide}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-sm"
            title="Buka Panduan Penggunaan & Link Tim"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Panduan</span>
          </button>

          {/* PWA Install App Button (Desktop) */}
          <button
            onClick={handleInstallApp}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shadow-sm"
            title="Install aplikasi ke Desktop / Laptop / HP (PWA)"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Install App</span>
          </button>

          {/* Architecture Blueprint Button (Desktop) */}
          <button
            onClick={onOpenArchitecture}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm"
            title="Lihat Arsitektur Sistem"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Arsitektur</span>
          </button>

          {/* Export Button (Always visible) */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor</span>
          </button>

          {/* Mobile Menu Button (< lg) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen((prev) => !prev);
            }}
            className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isMobileMenuOpen
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title="Menu Navigasi & Proyek"
            aria-label="Buka Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Action Sheet Modal (Direct overlay with click propagation guards) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          {/* Action Sheet Card */}
          <div
            className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 z-50 max-h-[85vh] overflow-y-auto mb-0 sm:my-auto text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-100">Menu Proyek & Alat</h4>
                  <p className="text-[10px] text-zinc-400">obeeVideo Apps AI Director</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Pilih Template Proyek:</label>
              <select
                value={currentProject.id}
                onChange={(e) => {
                  const p = SAMPLE_PROJECTS.find((item) => item.id === e.target.value);
                  if (p) onSelectProject(p);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none cursor-pointer"
              >
                {SAMPLE_PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-video info badge if multiple clips loaded */}
            {videoClipsCount > 1 && (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs flex items-center justify-between text-cyan-300">
                <span>Saat ini mengedit rangkaian:</span>
                <span className="font-bold font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200">
                  {videoClipsCount} Video Tersambung
                </span>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* AI Motion Explainer Generator (Full Width highlight on mobile) */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenExplainer();
                }}
                className="col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 hover:from-cyan-900/60 hover:to-indigo-900/60 border border-cyan-500/40 text-xs text-cyan-200 font-semibold transition-colors cursor-pointer"
              >
                <Presentation className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="text-left flex-1">
                  <div className="flex items-center gap-1.5">
                    <span>{hasActiveExplainer ? 'Edit AI Motion Explainer' : 'Buat Video dari Prompt (AI)'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      GRATIS
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-normal">
                    Animasi infografis + suara narator AI bahasa Indonesia
                  </div>
                </div>
              </button>

              {/* Upload Multiple Videos */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-800/40 text-xs text-cyan-300 font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div>Unggah Video</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Bisa pilih banyak</div>
                </div>
              </button>

              {/* Record Camera */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenRecorder();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs text-rose-300 font-semibold transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="text-left">
                  <div>Rekam Kamera</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Webcam & Mic</div>
                </div>
              </button>

              {/* User Guide Modal */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenGuide();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-800/40 text-xs text-amber-300 font-semibold transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div>Panduan & Link</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Panduan Tim</div>
                </div>
              </button>

              {/* Install PWA */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleInstallApp();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-800/40 text-xs text-emerald-300 font-semibold transition-colors cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div>Install PWA</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Pasang di HP</div>
                </div>
              </button>
            </div>

            {/* Architecture Modal Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenArchitecture();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lihat Blueprint Arsitektur Sistem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInstallGuide(false);
          }}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative text-zinc-100 space-y-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <DownloadCloud className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-100">Instal Aplikasi (PWA)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Untuk menginstal aplikasi ini di browser Anda:
            </p>
            <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <li>Klik ikon <strong className="text-emerald-400">Install</strong> di ujung kanan bilah alamat (address bar) browser.</li>
              <li>Atau buka Menu browser (titik tiga) lalu pilih <strong className="text-zinc-200">"Install OmniCut Studio AI"</strong> atau <strong className="text-zinc-200">"Tambahkan ke Layar Utama"</strong>.</li>
              <li>Aplikasi akan terpasang di perangkat Anda dan dapat diakses dengan cepat.</li>
            </ol>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
