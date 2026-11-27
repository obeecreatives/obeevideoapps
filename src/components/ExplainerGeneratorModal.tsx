import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Volume2,
  Presentation,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Columns2,
  Maximize2,
  RefreshCw,
  Trash2,
  Edit3,
} from 'lucide-react';
import {
  AspectRatio,
  ExplainerProject,
  ExplainerTheme,
  ExplainerVoiceName,
} from '../types/editor';
import {
  generateMotionExplainer,
  regenerateExplainerVoiceover,
} from '../services/aiExplainer';

interface ExplainerGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAspectRatio: AspectRatio;
  activeExplainer: ExplainerProject | null;
  onApplyExplainer: (
    explainer: ExplainerProject,
    options: {
      aspectRatio: AspectRatio;
      compositionMode: 'fullscreen' | 'split-presenter';
      audioWarning?: string | null;
    }
  ) => void;
  onUpdateExplainer: (explainer: ExplainerProject | null) => void;
}

const PROMPT_PRESETS = [
  {
    label: 'Tutorial: Product-Market Fit',
    videoType: 'tutorial' as const,
    theme: 'smartboard-dark' as ExplainerTheme,
    prompt:
      'Jelaskan apa itu Product-Market Fit dengan gaya smartboard interaktif: mulai dari mengenal Customer Profile (Jobs, Pains, Gains), lalu mencocokkannya dengan Value Proposition (Produk, Pain Reliever, Gain Creator) hingga tercapai Market Fit.',
  },
  {
    label: 'Iklan: Aplikasi Belajar AI',
    videoType: 'iklan' as const,
    theme: 'cyber-neon' as ExplainerTheme,
    prompt:
      'Buat video iklan singkat yang menarik untuk aplikasi belajar otomatis "BelajarKilat": soroti masalah sulit atur waktu dan materi menumpuk, tampilkan fitur jadwal otomatis & rangkuman instan, akhiri dengan ajakan unduh gratis.',
  },
  {
    label: 'Editorial: 3 Tren Video AI',
    videoType: 'editorial' as const,
    theme: 'editorial-warm' as ExplainerTheme,
    prompt:
      'Buat video editorial singkat membahas 3 tren utama produksi konten video modern: otomatisasi skrip & narasi, format visual multi-layar, dan kecepatan publikasi harian untuk kreator & tim marketing.',
  },
];

const VOICE_OPTIONS: { id: ExplainerVoiceName; label: string; desc: string }[] = [
  { id: 'Kore', label: 'Kore (Wanita)', desc: 'Ramah, jelas & edukatif' },
  { id: 'Zephyr', label: 'Zephyr (Wanita)', desc: 'Ceria, ringan & modern' },
  { id: 'Puck', label: 'Puck (Pria)', desc: 'Energik & cocok untuk iklan' },
  { id: 'Charon', label: 'Charon (Pria)', desc: 'Tenang, berwibawa & editorial' },
  { id: 'Fenrir', label: 'Fenrir (Pria)', desc: 'Tegas, meyakinkan & kuat' },
];

const THEME_OPTIONS: {
  id: ExplainerTheme;
  label: string;
  swatch: string;
}[] = [
  {
    id: 'smartboard-dark',
    label: 'Smartboard Gelap',
    swatch: 'from-[#0b162a] to-[#112240] border-cyan-500/60',
  },
  {
    id: 'corporate-clean',
    label: 'Studio Bersih',
    swatch: 'from-slate-100 to-slate-300 border-slate-400',
  },
  {
    id: 'editorial-warm',
    label: 'Editorial Hangat',
    swatch: 'from-[#1c1512] to-[#3a2820] border-amber-500/60',
  },
  {
    id: 'cyber-neon',
    label: 'Cyber Neon',
    swatch: 'from-[#09051a] to-[#230c42] border-purple-500/60',
  },
];

export const ExplainerGeneratorModal: React.FC<ExplainerGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentAspectRatio,
  activeExplainer,
  onApplyExplainer,
  onUpdateExplainer,
}) => {
  const [modeTab, setModeTab] = useState<'create' | 'edit'>(
    activeExplainer?.active ? 'edit' : 'create'
  );
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0].prompt);
  const [videoType, setVideoType] = useState<'tutorial' | 'iklan' | 'editorial'>('tutorial');
  const [theme, setTheme] = useState<ExplainerTheme>('smartboard-dark');
  const [voiceName, setVoiceName] = useState<ExplainerVoiceName>('Kore');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(currentAspectRatio || '16:9');
  const [durationTarget, setDurationTarget] = useState<number>(18);
  const [compositionMode, setCompositionMode] = useState<'fullscreen' | 'split-presenter'>(
    'fullscreen'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRegeneratingVoice, setIsRegeneratingVoice] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Tuliskan topik atau deskripsi video terlebih dahulu.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setProgressStage('1/2 Menyusun skrip, slide infografis & animasi...');

    const stageTimer = setTimeout(() => {
      setProgressStage('2/2 Merekam suara narator AI (Bahasa Indonesia)...');
    }, 3500);

    try {
      const result = await generateMotionExplainer({
        prompt: prompt.trim(),
        videoType,
        theme,
        voiceName,
        durationTarget,
      });

      clearTimeout(stageTimer);

      if (result.success && result.explainer) {
        onApplyExplainer(result.explainer, {
          aspectRatio,
          compositionMode,
          audioWarning: result.audioWarning,
        });
        onClose();
      } else {
        setErrorMsg(result.error || 'Gagal membuat video explainer.');
      }
    } catch (err: any) {
      clearTimeout(stageTimer);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menghubungi AI.');
    } finally {
      setIsGenerating(false);
      setProgressStage('');
    }
  };

  const handleRegenerateVoice = async () => {
    if (!activeExplainer) return;
    setErrorMsg(null);
    setIsRegeneratingVoice(true);
    try {
      const fullNarration = activeExplainer.slides
        .map((s) => s.narration.trim())
        .filter(Boolean)
        .join(' ');
      const res = await regenerateExplainerVoiceover(
        fullNarration,
        activeExplainer.voiceName,
        activeExplainer.videoType
      );
      if (res.success && res.audioUrl) {
        onUpdateExplainer({
          ...activeExplainer,
          fullNarration,
          audioUrl: res.audioUrl,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membuat ulang suara narator AI.');
    } finally {
      setIsRegeneratingVoice(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  AI Motion Explainer & Voiceover
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  GRATIS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Buat video tutorial, iklan, atau editorial lengkap dengan animasi infografis & narator AI
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs if an explainer already exists */}
        {activeExplainer && (
          <div className="px-5 pt-3 bg-zinc-900 border-b border-zinc-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModeTab('create')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                modeTab === 'create'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Buat Baru dari Prompt
            </button>
            <button
              type="button"
              onClick={() => setModeTab('edit')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                modeTab === 'edit'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Slide & Suara Aktif ({activeExplainer.slides.length})
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {modeTab === 'create' ? (
            <>
              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Contoh Prompt Siap Pakai
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPrompt(preset.prompt);
                        setVideoType(preset.videoType);
                        setTheme(preset.theme);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-[11px] text-zinc-300 transition-colors cursor-pointer"
                    >
                      ✨ {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-200 block">
                  Prompt Topik / Naskah Video
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Jelaskan 3 cara memilih kopi specialty untuk pemula dengan gaya tutorial santai..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Video Type & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">Jenis Video</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'tutorial', label: 'Tutorial' },
                        { id: 'iklan', label: 'Iklan' },
                        { id: 'editorial', label: 'Editorial' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setVideoType(t.id)}
                        className={`py-2 px-2 rounded-lg border font-semibold transition-all cursor-pointer ${
                          videoType === t.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">
                    Target Durasi & Rasio
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={durationTarget}
                      onChange={(e) => setDurationTarget(Number(e.target.value))}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value={12}>Ringkas (~12 detik • 3 slide)</option>
                      <option value={18}>Standar (~18 detik • 4 slide)</option>
                      <option value={26}>Lengkap (~26 detik • 5 slide)</option>
                    </select>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Reels / TikTok</option>
                      <option value="1:1">1:1 Square</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">Tema Papan Presentasi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        theme === t.id
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`h-6 w-full rounded-md bg-gradient-to-r border ${t.swatch}`}
                      />
                      <span className="font-semibold text-[11px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voiceover Narrator Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Suara Narator AI (Bahasa Indonesia)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {VOICE_OPTIONS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVoiceName(v.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        voiceName === v.id
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">{v.label}</div>
                      <div className="text-[10px] text-zinc-500">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Composition Mode */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">
                  Mode Tampilan di Editor
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompositionMode('fullscreen')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      compositionMode === 'fullscreen'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">Full Motion Explainer</div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        100% animasi papan infografis + narator AI + subtitle otomatis.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompositionMode('split-presenter')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      compositionMode === 'split-presenter'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-200'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Columns2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">Split dengan Video Presenter</div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Video presenter Anda berdampingan dengan papan animasi AI (bisa ditukar posisi).
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          ) : activeExplainer ? (
            /* Edit Active Explainer Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-cyan-300 text-sm">{activeExplainer.title}</div>
                  <div className="text-[11px] text-zinc-400">
                    {activeExplainer.slides.length} slide • {activeExplainer.totalDuration.toFixed(1)} detik • Suara:{' '}
                    {activeExplainer.voiceName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={activeExplainer.theme}
                    onChange={(e) =>
                      onUpdateExplainer({
                        ...activeExplainer,
                        theme: e.target.value as ExplainerTheme,
                      })
                    }
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 outline-none cursor-pointer"
                  >
                    {THEME_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={activeExplainer.voiceName}
                    onChange={(e) =>
                      onUpdateExplainer({
                        ...activeExplainer,
                        voiceName: e.target.value as ExplainerVoiceName,
                      })
                    }
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 outline-none cursor-pointer"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={isRegeneratingVoice}
                    onClick={handleRegenerateVoice}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isRegeneratingVoice ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Rekam Ulang Suara</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {activeExplainer.slides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        SLIDE {idx + 1} • {slide.startSec.toFixed(1)}s – {slide.endSec.toFixed(1)}s
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase">{slide.layout}</span>
                    </div>

                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => {
                        const updatedSlides = activeExplainer.slides.map((s) =>
                          s.id === slide.id ? { ...s, title: e.target.value } : s
                        );
                        onUpdateExplainer({ ...activeExplainer, slides: updatedSlides });
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-100 outline-none focus:border-cyan-500"
                    />

                    <textarea
                      value={slide.narration}
                      rows={2}
                      onChange={(e) => {
                        const updatedSlides = activeExplainer.slides.map((s) =>
                          s.id === slide.id ? { ...s, narration: e.target.value } : s
                        );
                        onUpdateExplainer({
                          ...activeExplainer,
                          slides: updatedSlides,
                          fullNarration: updatedSlides.map((s) => s.narration).join(' '),
                        });
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateExplainer(null);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Matikan Mode Explainer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selesai Edit
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer for Create mode */}
        {modeTab === 'create' && (
          <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 font-medium">{progressStage}</span>
                </>
              ) : (
                <span>Otomatis sinkron dengan timeline, subtitle & ekspor video.</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isGenerating}
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membuat Video...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Video Explainer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
