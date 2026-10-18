import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  Mic,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Code2,
  Workflow,
  ShieldCheck,
  Film,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'blueprint' | 'challenges'>('blueprint');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[88vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl flex flex-col shadow-2xl relative text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                <span>Arsitektur Sistem & Preferensi Rekayasa Perangkat Lunak</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  SYSTEM BLUEPRINT
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Prinsip desain, pipeline multimodal, dan preferensi arsitektur pengembang untuk AI Video Editor Real-Time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs in Modal */}
        <div className="flex items-center px-6 pt-3 pb-0 border-b border-zinc-800 bg-zinc-950/40 gap-4 text-xs">
          <button
            onClick={() => setActiveSubTab('blueprint')}
            className={`pb-2.5 font-semibold transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'blueprint'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Blueprint Arsitektur & Pipeline
          </button>
          <button
            onClick={() => setActiveSubTab('challenges')}
            className={`pb-2.5 font-semibold transition-all border-b-2 cursor-pointer ${
              activeSubTab === 'challenges'
                ? 'border-rose-400 text-rose-300 flex items-center gap-1.5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Tantangan Teknis & Mitigasi Pengembang</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-300">
          {activeSubTab === 'challenges' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-1.5">
                <div className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Daftar Tantangan Kritis dalam Pengembangan Video AI Real-Time</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-xs">
                  Mengembangkan aplikasi video AI multimodal di browser membutuhkan keseimbangan antara batasan komputasi klien (VRAM & CPU), sinkronisasi audio-visual sub-milidetik, serta penanganan ketidakpastian bahasa alami dari pengguna.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Challenge 1 */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <span>1. Sinkronisasi Audio/Video & Frame Drift</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong>Tantangan:</strong> Browser tidak menjamin sinkronisasi mutlak antara video element dan Web Audio API saat diolah di Canvas, sering menyebabkan audio mendahului visual setelah beberapa menit pemutaran.
                    <br />
                    <strong>Solusi:</strong> Gunakan <code>AudioContext.currentTime</code> sebagai *Hardware Master Clock*, bukan <code>video.currentTime</code>, serta adopsi WebCodecs API untuk decoding frame secara deterministik.
                  </p>
                </div>

                {/* Challenge 2 */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                    <span>2. Konsumsi Memori & GPU Crash (OOM)</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong>Tantangan:</strong> Rendering frame 4K 60FPS berulang kali ke Canvas dapat menghabiskan VRAM GPU dan memicu crash tab browser karena akumulasi buffer frame yang tidak di-garbage collect.
                    <br />
                    <strong>Solusi:</strong> Terapkan *Canvas Recycling*, batas resolusi proxy untuk viewport pratinjau (720p/1080p), dan selalu panggil <code>URL.revokeObjectURL()</code> untuk setiap blob yang tidak lagi dipakai.
                  </p>
                </div>

                {/* Challenge 3 */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                    <span>3. Ambiguitas Perintah Suara Spontan</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong>Tantangan:</strong> Ucapan pengguna di dunia nyata seringkali tidak terstruktur (misal: <em>"Eh potong pas gue ngomong tadi dong"</em> tanpa menyebut detik spesifik).
                    <br />
                    <strong>Solusi:</strong> Sertakan *Temporal Context Snapshot* (posisi playhead saat tombol mic ditekan) ke payload model Gemini, sehingga LLM tahu persis window waktu yang dimaksud pengguna.
                  </p>
                </div>

                {/* Challenge 4 */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span>4. Fragmentasi Codec Ekspor (WebM vs MP4)</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong>Tantangan:</strong> <code>MediaRecorder</code> browser paling stabil merekam WebM (VP8/VP9), sementara platform seperti Instagram Reels & iPhone menuntut MP4 (H.264/AAC).
                    <br />
                    <strong>Solusi:</strong> Sediakan transmuxer WebAssembly (FFmpeg WASM) di sisi browser untuk remuxing WebM ke MP4 tanpa perlu re-encode penuh, atau serverless worker untuk fast-remux.
                  </p>
                </div>

                {/* Challenge 5 */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                    <span>5. Kebijakan Browser Autoplay & Akses Mic</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong>Tantangan:</strong> Browser modern memblokir otomatis AudioContext dan stream mikrofon jika belum ada interaksi pengguna (*user gesture requirement*).
                    <br />
                    <strong>Solusi:</strong> Desain *audio state resumption pattern* yang otomatis membuka AudioContext pada klik pertama pengguna, serta gracefully fallback ke input teks jika mic ditolak.
                  </p>
                </div>

                {/* Challenge 6 */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                    <span>6. Biaya Token & Latensi Pemanggilan AI</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    <strong>Tantangan:</strong> Mengirim video mentah atau frame kontinu ke model AI akan membuat biaya API membengkak dan menimbulkan delay 3–8 detik per respons.
                    <br />
                    <strong>Solusi:</strong> Hanya kirim metadata ringkas (durasi, timestamps, intent wicara) ke Gemini 3.8 Flash, dan biarkan AST dieksekusi oleh mesin kanvas lokal dalam 1 frame (&lt;16ms).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-indigo-950/40 border border-cyan-800/40 space-y-2">
                <div className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Visi Arsitektur: Latensi Sub-100ms & Kontrol Multimodal Terpadu</span>
                </div>
                <p className="leading-relaxed text-zinc-300">
                  Sebagai pengembang perangkat lunak, preferensi utama kami adalah membangun <strong>Non-Destructive AST (Abstract Syntax Tree) Compositor</strong> di sisi klien (HTML5 Canvas 60FPS + Web Audio API) yang dipadukan dengan <strong>Autonomous AI Director (didukung Gemini 3.8 Flash di backend Express)</strong>. Dengan model ini, video mentah tidak perlu di-encode ulang setiap ada perubahan perintah suara atau teks, melainkan dieksekusi secara instan dan real-time.
                </p>
              </div>

              {/* 5 Core Engineering Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pillar 1 */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Mic className="w-4 h-4" />
                    <span>1. Unified Multimodal Ingestion Pipeline</span>
                  </div>
                  <p className="leading-relaxed text-zinc-400">
                    <strong>Voice (Suara):</strong> Memanfaatkan Web Speech API untuk pengenalan wicara di perangkat (Edge) tanpa latensi jaringan, lalu mengirim transkripsi ke model Gemini untuk interpretasi niat (intent mapping).
                    <br />
                    <strong>Text (Teks):</strong> CLI/Prompt bar alami yang menerjemahkan kalimat bebas ("Potong jeda, beri warna teal orange, pasang caption Hormozi") ke instruksi terstruktur.
                    <br />
                    <strong>Image (Gambar):</strong> Ekstraksi mood warna (LUT) dan referensi komposisi visual secara instan.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Layers className="w-4 h-4" />
                    <span>2. Real-Time Canvas Compositing Engine</span>
                  </div>
                  <p className="leading-relaxed text-zinc-400">
                    Arsitektur rendering menggunakan <strong>HTML5 Canvas 2D / WebGL pipeline</strong> dengan 4 layer independen:
                    <br />
                    • <em>Layer V1:</em> Master Video Stream (dengan zoom/pan keyframe).
                    <br />
                    • <em>Layer V2:</em> AI B-Roll & Visual Overlays (blending modes: screen, overlay).
                    <br />
                    • <em>Layer T1:</em> Dynamic Captions (Alex Hormozi style dengan punch outline dan animated bouncing scale).
                    <br />
                    • <em>Audio Track:</em> Automated Ducking (-14dB) ketika ada narasi.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Workflow className="w-4 h-4" />
                    <span>3. Non-Destructive Editing AST & Reversible State</span>
                  </div>
                  <p className="leading-relaxed text-zinc-400">
                    Setiap aksi pengeditan (potong hening, ubah rasio 9:16, ganti LUT) direpresentasikan sebagai node tindakan dalam <em>Editing State Tree</em>. Hal ini menghasilkan:
                    <br />
                    • <strong>Zero Render Lag:</strong> Pratinjau langsung 60fps tanpa proses buffering server.
                    <br />
                    • <strong>Infinite Undo/Redo:</strong> Pengguna dapat membatalkan atau merevisi perintah suara sebelumnya kapan saja tanpa merusak aset asli.
                  </p>
                </div>

                {/* Pillar 4 */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>4. Server-Side AI Orchestration (Gemini 3.8 Flash)</span>
                  </div>
                  <p className="leading-relaxed text-zinc-400">
                    Backend Express menangani:
                    <br />
                    • <strong>AI Director Endpoint:</strong> Menerjemahkan instruksi wicara bahasa alami menjadi AST perintah video JSON presisi.
                    <br />
                    • <strong>Dynamic Subtitle Generator:</strong> Pembagian kata kunci, emoji, dan timing otomatis.
                    <br />
                    • <strong>Storyboard AI:</strong> Naskah viral scene-by-scene lengkap dengan audio cue dan saran visual B-roll.
                  </p>
                </div>
              </div>

              {/* Data Flow Diagram */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Alur Eksekusi Data (Dataflow Architecture)</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto border border-zinc-800">
                  {`[User Input: Voice / Text / Image] 
       │
       ▼
[Client Web Speech / Multimodal Bar] ──► [Server /api/ai/director (Gemini 3.8 Flash)]
                                                       │
                                                       ▼
[Client Canvas 60FPS Compositor] ◄── [Structured JSON AST Actions]
   ├── Base Video + Shaders (Teal & Orange, Cyberpunk)
   ├── B-Roll Asset Overlays
   ├── Dynamic Alex Hormozi Captions
   └── Audio Ducking Engine
       │
       ▼
[Client MediaRecorder Engine] ──► [Instant Export MP4/WebM Full HD]`}
                </div>
              </div>

              {/* Software Engineer's Recommendations */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Preferensi Pengembang untuk Efisiensi Alur Kerja Tertinggi</span>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 leading-relaxed">
                  <li>
                    <strong>Prioritaskan Responsifitas Lokal:</strong> Semua feedback visual harus tampil dalam &lt;16ms (1 frame pada 60fps), sementara model AI berjalan asinkron di latar belakang.
                  </li>
                  <li>
                    <strong>Micro-Feedback Loop:</strong> Tampilkan status instruksi suara secara langsung (interim results) agar kreator tahu sistem sedang memahami maksud mereka.
                  </li>
                  <li>
                    <strong>Standar Format Viral Ready:</strong> Preset otomatis untuk 9:16 (TikTok/Reels/Shorts) dengan caption bold punchy meningkatkan retensi penonton hingga 40%.
                  </li>
                  <li>
                    <strong>Client-Side Export:</strong> Ekspor video instan menggunakan MediaRecorder dari canvas stream menghemat biaya server dan memungkinkan ekspor tanpa kuota cloud rendering.
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>obeeVideo Apps v2.4 • Production Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-all cursor-pointer"
          >
            Tutup Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
