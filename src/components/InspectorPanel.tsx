import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Subtitles,
  Film,
  FileText,
  History,
  Check,
  Plus,
  Trash2,
  Wand2,
  Loader2,
  Play,
  RotateCcw,
  Palette,
  Columns2,
  Rows2,
  PictureInPicture2,
  Maximize2,
  ArrowLeftRight,
  Move,
  Gauge,
  Layers,
} from 'lucide-react';
import {
  VideoFilterSettings,
  FilterType,
  CaptionItem,
  BrollItem,
  DirectorActionLog,
  StoryboardScene,
  LayoutSettings,
  TemplateLayoutType,
  PipPosition,
  PreviewQuality,
  VideoClip,
} from '../types/editor';
import { FILTER_PRESETS, LAYOUT_TEMPLATES } from '../constants/presets';
import { requestSmartCaptions, requestStoryboard } from '../services/aiDirector';

interface InspectorPanelProps {
  filterSettings: VideoFilterSettings;
  captions: CaptionItem[];
  brolls: BrollItem[];
  actionLogs: DirectorActionLog[];
  duration: number;
  currentTime: number;
  layoutSettings: LayoutSettings;
  previewQuality: PreviewQuality;
  videoClips?: VideoClip[];
  onUpdateLayoutSettings: (settings: LayoutSettings) => void;
  onPreviewQualityChange: (quality: PreviewQuality) => void;
  onUpdateFilter: (settings: VideoFilterSettings) => void;
  onUpdateCaptions: (captions: CaptionItem[]) => void;
  onAddBroll: (item: BrollItem) => void;
  onDeleteBroll: (id: string) => void;
  onDeleteCaption: (id: string) => void;
  onApplyStoryboardScene?: (scene: StoryboardScene) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  filterSettings,
  captions,
  brolls,
  actionLogs,
  duration,
  currentTime,
  layoutSettings,
  previewQuality,
  videoClips,
  onUpdateLayoutSettings,
  onPreviewQualityChange,
  onUpdateFilter,
  onUpdateCaptions,
  onAddBroll,
  onDeleteBroll,
  onDeleteCaption,
  onApplyStoryboardScene,
}) => {
  const [activeTab, setActiveTab] = useState<
    'director' | 'layout' | 'color' | 'captions' | 'broll' | 'storyboard'
  >('director');


  // Storyboard generation state
  const [storyboardConcept, setStoryboardConcept] = useState('Revolusi Pembuatan Video dengan AI Suara');
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardScene[]>([]);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);

  // Captions generation state
  const [captionTopic, setCaptionTopic] = useState('AI Video Director & Automasi');
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  // B-Roll manual generator state
  const [brollPrompt, setBrollPrompt] = useState('Neon cyber matrix digital flow');
  const [brollCategory, setBrollCategory] = useState<'tech' | 'city' | 'nature' | 'abstract'>('tech');

  // Handle Preset Selection
  const handleSelectFilterPreset = (type: FilterType) => {
    onUpdateFilter(FILTER_PRESETS[type]);
  };

  // Handle Generate Subtitles with AI
  const handleGenerateCaptions = async () => {
    setIsGeneratingCaptions(true);
    try {
      const res = await requestSmartCaptions(duration, captionTopic);
      if (res.captions && res.captions.length > 0) {
        const formatted: CaptionItem[] = res.captions.map((c: any, idx: number) => ({
          id: `ai-cap-${Date.now()}-${idx}`,
          text: c.text,
          startSec: c.startSec,
          endSec: c.endSec,
          style: c.style || 'alex-hormozi',
          color: c.color || '#FACC15',
          highlightWord: c.highlightWord,
          emoji: c.emoji,
        }));
        onUpdateCaptions(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Handle Generate Storyboard
  const handleGenerateStoryboard = async () => {
    setIsGeneratingStoryboard(true);
    try {
      const res = await requestStoryboard(
        storyboardConcept,
        'Kreator Konten & Startup Founders',
        'TikTok & Instagram Reels'
      );
      if (res.storyboard) {
        setStoryboardScenes(res.storyboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Handle Add B-Roll at current playhead
  const handleAddBroll = () => {
    const newItem: BrollItem = {
      id: `broll-${Date.now()}`,
      title: brollPrompt.slice(0, 24),
      type: 'image',
      url:
        brollCategory === 'tech'
          ? 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
          : brollCategory === 'city'
          ? 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      startSec: Math.max(0, currentTime),
      duration: 3.5,
      category: brollCategory,
      opacity: 0.88,
      blendMode: 'screen',
    };
    onAddBroll(newItem);
  };

  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950/70 p-1.5 gap-1.5 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('director')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'director'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Director</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'layout'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Template Layout</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}

          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'color'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Color Grading</span>
        </button>

        <button
          onClick={() => setActiveTab('captions')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'captions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Subtitles</span>
        </button>

        <button
          onClick={() => setActiveTab('broll')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'broll'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-purple-400" />
          <span>B-Roll Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('storyboard')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'storyboard'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-rose-400" />
          <span>Storyboard AI</span>
        </button>
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: AI DIRECTOR LOGS & FEEDBACK */}
        {activeTab === 'director' && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 to-zinc-900 border border-cyan-800/40">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Autonomous AI Director Intel</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {actionLogs.length > 0 && actionLogs[0].directorTip
                  ? actionLogs[0].directorTip
                  : 'Siap menerima perintah suara atau teks. AI secara otomatis mengatur ritme pemotongan, color grading, dan penempatan B-roll untuk mencapai retensi penonton 85%+.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Riwayat Instruksi & Tindakan AST ({actionLogs.length})
              </span>
            </div>

            {actionLogs.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                Belum ada tindakan. Ucapkan atau ketik perintah di bawah (misal: "Jadikan sinematik").
              </div>
            ) : (
              <div className="space-y-2">
                {actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-mono text-cyan-400 font-medium">
                        [{log.source.toUpperCase()}] "{log.command}"
                      </span>
                      <span className="text-zinc-500">{log.timestamp}</span>
                    </div>
                    <div className="text-zinc-200 font-sans">{log.actionSummary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEMPLATE LAYOUT & PREVIEW QUALITY */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* 1. Preview Quality Mode (Solusi Preview Patah-patah) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/30 to-zinc-950 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span>Mode Preview Anti Patah-Patah</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  {previewQuality}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Pilih mode preview agar playback video di HP atau browser berjalan lancar tanpa terputus/patah-patah:
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => onPreviewQualityChange('draft')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    previewQuality === 'draft'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>🚀 Draft</span>
                    {previewQuality === 'draft' && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Ringan / Cepat</div>
                </button>

                <button
                  onClick={() => onPreviewQualityChange('normal')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    previewQuality === 'normal'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>⚡ Normal</span>
                    {previewQuality === 'normal' && <Check className="w-3 h-3 text-cyan-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">720p Seimbang</div>
                </button>

                <button
                  onClick={() => onPreviewQualityChange('high')}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    previewQuality === 'high'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>💎 Tinggi</span>
                    {previewQuality === 'high' && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">1080p Studio</div>
                </button>
              </div>
            </div>

            {/* 2. Template Layout Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Columns2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pilih Model Template Layout</span>
                </label>
                <span className="text-[11px] text-zinc-400 capitalize">
                  {layoutSettings.type.replace('-', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_TEMPLATES.map((tmpl) => {
                  const isSelected = layoutSettings.type === tmpl.type;
                  return (
                    <button
                      key={tmpl.type}
                      onClick={() =>
                        onUpdateLayoutSettings({
                          ...layoutSettings,
                          type: tmpl.type,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                          {tmpl.type === 'solo' && <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
                          {tmpl.type === 'split-vertical' && <Rows2 className="w-3.5 h-3.5 text-amber-400" />}
                          {tmpl.type === 'split-horizontal' && <Columns2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {tmpl.type === 'pip' && <PictureInPicture2 className="w-3.5 h-3.5 text-purple-400" />}
                          {tmpl.type === 'reaction-frame' && <Layers className="w-3.5 h-3.5 text-rose-400" />}
                          {tmpl.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2">
                        {tmpl.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Fleksibilitas Posisi: Tombol Tukar Posisi Video */}
            {layoutSettings.type !== 'solo' && (
              <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                    <span>Fleksibilitas Posisi (Tukar Video)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      layoutSettings.swapSlots
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {layoutSettings.swapSlots ? 'Posisi Ditukar' : 'Posisi Standar'}
                  </span>
                </div>

                <button
                  onClick={() =>
                    onUpdateLayoutSettings({
                      ...layoutSettings,
                      swapSlots: !layoutSettings.swapSlots,
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-98"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>🔄 Tukar Posisi Slot 1 ⇄ Slot 2 Sekarang</span>
                </button>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800/80">
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase">
                      {layoutSettings.type === 'split-vertical'
                        ? 'Slot Atas'
                        : layoutSettings.type === 'split-horizontal'
                        ? 'Slot Kiri'
                        : 'Slot Background'}
                    </span>
                    <span className="font-semibold text-cyan-300 flex items-center gap-1">
                      📹 {layoutSettings.swapSlots ? 'Video Sekunder (Klip 2)' : 'Video Utama (Klip 1)'}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-zinc-800 pl-2">
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase">
                      {layoutSettings.type === 'split-vertical'
                        ? 'Slot Bawah'
                        : layoutSettings.type === 'split-horizontal'
                        ? 'Slot Kanan'
                        : 'Slot PIP Mengambang'}
                    </span>
                    <span className="font-semibold text-amber-300 flex items-center gap-1">
                      🎥 {layoutSettings.swapSlots ? 'Video Utama (Klip 1)' : 'Video Sekunder (Klip 2)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Fleksibilitas Ukuran: Slider & Presets Perbesar / Perkecil */}
            {layoutSettings.type !== 'solo' && (
              <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Fleksibilitas Ukuran (Perbesar / Perkecil)</span>
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    {layoutSettings.type.startsWith('split')
                      ? `${Math.round(layoutSettings.splitRatio * 100)}% : ${100 - Math.round(layoutSettings.splitRatio * 100)}%`
                      : `${Math.round(layoutSettings.pipScale * 100)}% Skala`}
                  </span>
                </div>

                {/* For Split Screen: Split Ratio Slider & Presets */}
                {layoutSettings.type.startsWith('split') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.25"
                        max="0.75"
                        step="0.05"
                        value={layoutSettings.splitRatio}
                        onChange={(e) =>
                          onUpdateLayoutSettings({
                            ...layoutSettings,
                            splitRatio: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() =>
                          onUpdateLayoutSettings({
                            ...layoutSettings,
                            splitRatio: 0.35,
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          layoutSettings.splitRatio === 0.35
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        35 : 65 (Bawah Besar)
                      </button>

                      <button
                        onClick={() =>
                          onUpdateLayoutSettings({
                            ...layoutSettings,
                            splitRatio: 0.5,
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          layoutSettings.splitRatio === 0.5
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        50 : 50 (Seimbang)
                      </button>

                      <button
                        onClick={() =>
                          onUpdateLayoutSettings({
                            ...layoutSettings,
                            splitRatio: 0.65,
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          layoutSettings.splitRatio === 0.65
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        65 : 35 (Atas Besar)
                      </button>
                    </div>
                  </div>
                )}

                {/* For PIP: PIP Scale Slider, Presets, and Corner Placement */}
                {layoutSettings.type === 'pip' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Skala Ukuran Jendela PIP</span>
                        <span className="font-mono text-cyan-300">
                          {Math.round(layoutSettings.pipScale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.20"
                        max="0.65"
                        step="0.05"
                        value={layoutSettings.pipScale}
                        onChange={(e) =>
                          onUpdateLayoutSettings({
                            ...layoutSettings,
                            pipScale: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />

                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {[
                          { scale: 0.25, label: 'Kecil 25%' },
                          { scale: 0.35, label: 'Sedang 35%' },
                          { scale: 0.5, label: 'Besar 50%' },
                          { scale: 0.65, label: 'Jumbo 65%' },
                        ].map((s) => (
                          <button
                            key={s.scale}
                            onClick={() =>
                              onUpdateLayoutSettings({
                                ...layoutSettings,
                                pipScale: s.scale,
                              })
                            }
                            className={`py-1 px-1.5 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                              Math.abs(layoutSettings.pipScale - s.scale) < 0.04
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Corner Placement Grid */}
                    <div className="space-y-1.5 pt-1 border-t border-zinc-800">
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-1">
                          <Move className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Posisi Sudut PIP</span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 capitalize">
                          {layoutSettings.pipPosition}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'top-left' as PipPosition, label: '↖ Kiri Atas' },
                          { id: 'center' as PipPosition, label: '⏺ Tengah' },
                          { id: 'top-right' as PipPosition, label: '↗ Kanan Atas' },
                          { id: 'bottom-left' as PipPosition, label: '↙ Kiri Bawah' },
                          { id: 'bottom-right' as PipPosition, label: '↘ Kanan Bawah' },
                        ].map((pos) => (
                          <button
                            key={pos.id}
                            onClick={() =>
                              onUpdateLayoutSettings({
                                ...layoutSettings,
                                pipPosition: pos.id,
                              })
                            }
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              layoutSettings.pipPosition === pos.id
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Garis Pembatas (Divider) */}
            {layoutSettings.type !== 'solo' && (
              <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Garis Pembatas Neon</span>
                  <button
                    onClick={() =>
                      onUpdateLayoutSettings({
                        ...layoutSettings,
                        showDivider: !layoutSettings.showDivider,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      layoutSettings.showDivider
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {layoutSettings.showDivider ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {layoutSettings.showDivider && (
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { color: '#06b6d4', name: 'Cyan' },
                      { color: '#f59e0b', name: 'Gold' },
                      { color: '#10b981', name: 'Green' },
                      { color: '#f43f5e', name: 'Rose' },
                      { color: '#a855f7', name: 'Purple' },
                      { color: '#ffffff', name: 'White' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() =>
                          onUpdateLayoutSettings({
                            ...layoutSettings,
                            dividerColor: c.color,
                          })
                        }
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                          layoutSettings.dividerColor === c.color
                            ? 'scale-125 border-white shadow-md'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COLOR GRADING & SHADERS */}
        {activeTab === 'color' && (

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">
                Preset LUT Sinematik
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'cinematic-teal', name: 'Teal & Orange', color: 'from-cyan-500 to-amber-500' },
                    { id: 'cyberpunk', name: 'Cyberpunk Neon', color: 'from-purple-500 to-pink-500' },
                    { id: 'vintage', name: 'Kodak 1980 Vintage', color: 'from-amber-600 to-yellow-500' },
                    { id: 'noir', name: 'Film Noir B&W', color: 'from-zinc-900 to-zinc-400' },
                    { id: 'hdr', name: 'Clean Pop HDR', color: 'from-blue-500 to-emerald-500' },
                    { id: 'none', name: 'Standard / Neutral', color: 'from-zinc-700 to-zinc-600' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectFilterPreset(p.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs font-medium cursor-pointer ${
                      filterSettings.filter === p.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${p.color}`} />
                      <span>{p.name}</span>
                    </div>
                    {filterSettings.filter === p.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2 border-t border-zinc-800 text-xs">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-cyan-400">
                    {Math.round(filterSettings.contrast * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={filterSettings.contrast}
                  onChange={(e) =>
                    onUpdateFilter({
                      ...filterSettings,
                      contrast: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-cyan-400">
                    {Math.round(filterSettings.saturation * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={filterSettings.saturation}
                  onChange={(e) =>
                    onUpdateFilter({
                      ...filterSettings,
                      saturation: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-cyan-400">
                    {Math.round(filterSettings.brightness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.02"
                  value={filterSettings.brightness}
                  onChange={(e) =>
                    onUpdateFilter({
                      ...filterSettings,
                      brightness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Vignette Falloff</span>
                  <span className="font-mono text-cyan-400">
                    {Math.round(filterSettings.vignette * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={filterSettings.vignette}
                  onChange={(e) =>
                    onUpdateFilter({
                      ...filterSettings,
                      vignette: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SMART CAPTIONS & SUBTITLES */}
        {activeTab === 'captions' && (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-200 block">
                Generate Subtitles Otomatis (Gaya Alex Hormozi)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={captionTopic}
                  onChange={(e) => setCaptionTopic(e.target.value)}
                  placeholder="Topik video..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs text-zinc-200 outline-none"
                />
                <button
                  onClick={handleGenerateCaptions}
                  disabled={isGeneratingCaptions}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isGeneratingCaptions ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {/* List of active captions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Daftar Subtitle ({captions.length})</span>
                <button
                  onClick={() => {
                    const newCap: CaptionItem = {
                      id: `cap-${Date.now()}`,
                      text: 'TEKS BARU VIRAL! 🚀',
                      startSec: Math.max(0, currentTime),
                      endSec: Math.min(duration, currentTime + 2.5),
                      style: 'alex-hormozi',
                      color: '#FACC15',
                      emoji: '🔥',
                    };
                    onUpdateCaptions([...captions, newCap]);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Manual</span>
                </button>
              </div>

              {captions.map((cap, i) => (
                <div
                  key={cap.id}
                  className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-amber-400">
                      {cap.startSec.toFixed(1)}s - {cap.endSec.toFixed(1)}s
                    </span>
                    <button
                      onClick={() => onDeleteCaption(cap.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cap.text}
                    onChange={(e) => {
                      const updated = [...captions];
                      updated[i].text = e.target.value;
                      onUpdateCaptions(updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700/60 px-2 py-1 rounded text-zinc-100 font-semibold"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: B-ROLL ASSETS */}
        {activeTab === 'broll' && (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5">
              <label className="text-xs font-semibold text-zinc-200 block">
                Generate & Sisipkan B-Roll AI
              </label>
              <input
                type="text"
                value={brollPrompt}
                onChange={(e) => setBrollPrompt(e.target.value)}
                placeholder="Deskripsi visual B-roll..."
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs text-zinc-200 outline-none"
              />
              <div className="flex gap-2 items-center">
                <select
                  value={brollCategory}
                  onChange={(e: any) => setBrollCategory(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 px-2 py-1.5 rounded-lg text-xs text-zinc-300"
                >
                  <option value="tech">Tech & Cyber</option>
                  <option value="city">Urban City</option>
                  <option value="nature">Cinematic Nature</option>
                  <option value="abstract">Abstract Motion</option>
                </select>
                <button
                  onClick={handleAddBroll}
                  className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sisipkan di Posisi ({currentTime.toFixed(1)}s)</span>
                </button>
              </div>
            </div>

            {/* Active B-Roll list */}
            <div className="space-y-2">
              <span className="text-xs text-zinc-400 font-medium block">
                Klip B-Roll di Proyek ({brolls.length})
              </span>
              {brolls.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {b.url ? (
                      <img src={b.url} alt={b.title} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-cyan-950 flex items-center justify-center text-cyan-400">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-zinc-200">{b.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {b.startSec.toFixed(1)}s - {(b.startSec + b.duration).toFixed(1)}s
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteBroll(b.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: VIRAL STORYBOARD & SCRIPT */}
        {activeTab === 'storyboard' && (
          <div className="space-y-3.5">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-200 block">
                AI Storyboard & Viral Script Generator
              </label>
              <textarea
                value={storyboardConcept}
                onChange={(e) => setStoryboardConcept(e.target.value)}
                rows={2}
                placeholder="Konsep video yang ingin dibuat..."
                className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs text-zinc-200 outline-none resize-none"
              />
              <button
                onClick={handleGenerateStoryboard}
                disabled={isGeneratingStoryboard}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isGeneratingStoryboard ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyusun Naskah Adegan...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Buat Storyboard Adegan per Adegan</span>
                  </>
                )}
              </button>
            </div>

            {/* Storyboard scenes list */}
            {storyboardScenes.length > 0 && (
              <div className="space-y-2">
                {storyboardScenes.map((sc) => (
                  <div
                    key={sc.scene}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-rose-400">
                      <span className="font-semibold">
                        Scene {sc.scene}: {sc.title}
                      </span>
                      <span className="text-zinc-500">{sc.cutTiming}</span>
                    </div>
                    <p className="text-zinc-200 font-sans">
                      <strong className="text-zinc-400">Narasi:</strong> "{sc.narration}"
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      <strong className="text-cyan-400">Visual B-Roll:</strong> {sc.visualBroll}
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      <strong className="text-emerald-400">Audio Cue:</strong> {sc.audioCue}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
