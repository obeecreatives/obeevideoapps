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
} from 'lucide-react';
import {
  VideoFilterSettings,
  FilterType,
  CaptionItem,
  BrollItem,
  DirectorActionLog,
  StoryboardScene,
} from '../types/editor';
import { FILTER_PRESETS } from '../constants/presets';
import { requestSmartCaptions, requestStoryboard } from '../services/aiDirector';

interface InspectorPanelProps {
  filterSettings: VideoFilterSettings;
  captions: CaptionItem[];
  brolls: BrollItem[];
  actionLogs: DirectorActionLog[];
  duration: number;
  currentTime: number;
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
  onUpdateFilter,
  onUpdateCaptions,
  onAddBroll,
  onDeleteBroll,
  onDeleteCaption,
  onApplyStoryboardScene,
}) => {
  const [activeTab, setActiveTab] = useState<
    'director' | 'color' | 'captions' | 'broll' | 'storyboard'
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
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950/70 p-1 gap-1 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('director')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
            activeTab === 'director'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Director</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
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

        {/* TAB 2: COLOR GRADING & SHADERS */}
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
