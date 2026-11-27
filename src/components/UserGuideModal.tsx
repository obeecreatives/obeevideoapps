import React from 'react';
import {
  X,
  HelpCircle,
  Video,
  Mic,
  Layers,
  Smartphone,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Scissors,
  ExternalLink,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  shareUrl = 'https://ais-pre-uywl2uudm2r3yigxejum7f-421277974915.asia-southeast1.run.app',
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl flex flex-col shadow-2xl text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
                <span>Panduan Lengkap obeeVideo Apps</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  AI DIRECTOR
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Cara menggunakan fitur multimodal video editor dan membagikan link ke tim Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* Share URL Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-indigo-950/60 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-cyan-300 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-cyan-400" />
                Link URL Aplikasi untuk Tim Anda
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Bisa dibuka langsung di HP & PC</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
              <span className="font-mono text-xs text-zinc-300 truncate select-all flex-1">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Tim Anda dapat membuka tautan ini langsung dari browser Google Chrome/Safari tanpa perlu login ke Google Cloud Console.
            </p>
          </div>

          {/* Guide Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Multi-video */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-300 font-mono">
                  1
                </div>
                <span>Unggah Banyak Video Sekaligus</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Klik tombol <strong className="text-cyan-300">"Unggah Video"</strong> di header atau menu. Anda dapat memilih beberapa file video sekaligus (MP4, WebM, MOV). Aplikasi akan otomatis menyambungkan semua klip ke satu timeline berurutan.
              </p>
            </div>

            {/* Step 2: Voice & Text Commands */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-300 font-mono">
                  2
                </div>
                <span>Perintah Suara & Multimodal AI</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Ketik atau klik ikon mikrofon <Mic className="w-3 h-3 inline text-cyan-400" /> lalu katakan:
                <em className="block mt-1 text-[11px] text-amber-300 bg-zinc-900 p-1.5 rounded">
                  "Ubah ke rasio 9:16 dan pasang filter Cyberpunk", "Tambahkan subtitle viral", atau "Beri B-roll teknologi".
                </em>
              </p>
            </div>

            {/* Step 3: Responsive HP Portrait & Landscape */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-300 font-mono">
                  3
                </div>
                <span>Tampilan HP (Portrait & Landscape)</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                • <strong className="text-zinc-200">Mode Tegak (Portrait):</strong> Video di atas, tombol kontrol AI Director dan Perintah Suara dapat dialihkan lewat tab di bawah video.
                <br />
                • <strong className="text-zinc-200">Mode Miring (Landscape):</strong> Layar otomatis terbagi dua secara berdampingan. Video di sebelah kiri dan AI Director/Tools di sebelah kanan tanpa saling menutupi.
              </p>
            </div>

            {/* Step 4: Preview Quality without stutter */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs text-amber-300 font-mono">
                  4
                </div>
                <span>Mode Preview Anti Patah-Patah</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Jika video preview terasa patah-patah di HP atau laptop, klik tombol kualitas di pojok atas video atau buka tab <strong>"Template Layout"</strong>. Pilih:
                <br />
                • <strong className="text-amber-300">🚀 Draft (Cepat):</strong> Sangat ringan & mulus 60 FPS tanpa beban CPU.
                <br />
                • <strong className="text-cyan-300">⚡ Normal (720p):</strong> Kualitas seimbang jernih & responsif.
                <br />
                • <strong className="text-emerald-300">💎 Tinggi (1080p):</strong> Kualitas studio penuh.
              </p>
            </div>

            {/* Step 5: Flexible Template Layouts */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-xs text-purple-300 font-mono">
                  5
                </div>
                <span>Template Layout Fleksibel & Tukar Posisi</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Pilih format <strong>Split Atas-Bawah</strong>, <strong>Split Kiri-Kanan</strong>, atau <strong>PIP Reaksi</strong>.
                <br />
                • <strong className="text-cyan-300">🔄 Tukar Posisi:</strong> Klik tombol "Tukar Posisi" untuk menukar video Slot 1 & Slot 2 secara instan.
                <br />
                • <strong className="text-amber-300">📐 Perbesar / Perkecil:</strong> Gunakan slider rasio (30:70, 50:50, 70:30) atau perbesar ukuran PIP (25% s/d 65%).
              </p>
            </div>

            {/* Step 6: Exporting */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-xs text-rose-300 font-mono">
                  6
                </div>
                <span>Ekspor Video 60 FPS</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Klik tombol <strong className="text-cyan-400">"Ekspor"</strong> warna biru toska di pojok kanan atas. Pilih resolusi 1080p Full HD atau 720p pada 60 FPS, lalu klik "Mulai Render Video" untuk mengunduh hasil video langsung ke galeri/komputer.
              </p>
            </div>
          </div>


          {/* Tips and PWA */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-200">Tips Tambahan:</span>
              <p className="mt-0.5 text-zinc-400">
                Aplikasi ini mendukung Progressive Web App (PWA). Di ponsel, pilih menu browser (titik 3) lalu pilih <strong>"Tambahkan ke Layar Utama" / "Install App"</strong> untuk membukanya seperti aplikasi Android/iOS native tanpa address bar browser.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between text-xs">
          <span className="text-zinc-400">obeeVideo Apps &copy; 2026 AI Multimodal Director</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
