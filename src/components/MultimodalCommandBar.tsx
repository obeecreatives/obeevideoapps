import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Image as ImageIcon,
  Sparkles,
  X,
  Loader2,
  Wand2,
  SlidersHorizontal,
} from 'lucide-react';
import { VOICE_COMMAND_SUGGESTIONS, REFERENCE_IMAGE_PRESETS } from '../constants/presets';

interface MultimodalCommandBarProps {
  onExecuteCommand: (command: string, imageRef?: string) => Promise<void>;
  isProcessing: boolean;
  statusMessage?: string;
}

export const MultimodalCommandBar: React.FC<MultimodalCommandBarProps> = ({
  onExecuteCommand,
  isProcessing,
  statusMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'id-ID'; // Indonesian native speech recognition

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('Mendengarkan instruksi suara...');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInterimTranscript(transcript);

        if (event.results[0].isFinal) {
          setInputText(transcript);
          // Auto execute after short pause
          setTimeout(() => {
            handleVoiceSubmit(transcript);
          }, 400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Browser Anda belum mendukung Web Speech API secara native. Silakan gunakan input teks.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }
  };

  const handleVoiceSubmit = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsListening(false);
    await onExecuteCommand(transcript, selectedImage || undefined);
    setInputText('');
    setInterimTranscript('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const cmd = inputText.trim() || 'Terapkan gaya dan warna dari referensi gambar';
    await onExecuteCommand(cmd, selectedImage || undefined);
    setInputText('');
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowImagePicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetImage = (url: string) => {
    setSelectedImage(url);
    setShowImagePicker(false);
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-xl backdrop-blur-lg flex flex-col gap-2.5">
      {/* Top Banner: Active Image Reference or Interim Speech */}
      {(selectedImage || interimTranscript) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/80 rounded-lg border border-zinc-800 text-xs">
          {interimTranscript && (
            <div className="flex items-center gap-2 text-cyan-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>🎙️ {interimTranscript}</span>
            </div>
          )}

          {selectedImage && (
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-400">Referensi Visual:</span>
              <img
                src={selectedImage}
                alt="Ref"
                className="w-7 h-7 rounded object-cover border border-cyan-500/50"
              />
              <span className="text-cyan-400 font-mono text-[11px]">Foto Aktif</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                title="Hapus referensi foto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Command Bar Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        {/* Voice Command Button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={isProcessing}
          className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-voice-pulse'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
          }`}
          title={isListening ? 'Hentikan rekaman suara' : 'Perintah Suara AI (Bicara langsung)'}
        >
          {isListening ? (
            <Mic className="w-5 h-5 animate-bounce" />
          ) : (
            <Mic className="w-5 h-5 text-cyan-400" />
          )}
        </button>

        {/* Image Reference Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowImagePicker(!showImagePicker)}
            disabled={isProcessing}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              selectedImage
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
            title="Unggah Foto / Pilih Moodboard Referensi Gaya Visual"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Reference Image Modal / Dropdown */}
          {showImagePicker && (
            <div className="absolute bottom-12 left-0 w-80 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Referensi Visual / Moodboard
                </span>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2.5 max-h-48 overflow-y-auto">
                {REFERENCE_IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPresetImage(p.url)}
                    className="group relative rounded-lg overflow-hidden border border-zinc-800 hover:border-cyan-500 transition-all text-left"
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-1.5 bg-zinc-950/90">
                      <div className="text-[11px] font-semibold text-zinc-200 truncate">
                        {p.name}
                      </div>
                      <div className="text-[9px] text-zinc-400 line-clamp-1">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                <label className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium flex items-center gap-1">
                  <span>+ Unggah Gambar Sendiri</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Natural Language Prompt Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Sedang mendengarkan ucapanmu...'
                : 'Instruksikan AI Director... (cth: "Potong jeda, beri warna teal & orange, pasang caption Alex Hormozi")'
            }
            disabled={isProcessing}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-zinc-100 placeholder-zinc-500 px-4 py-2.5 rounded-xl text-sm font-sans outline-none transition-all"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Execute Button */}
        <button
          type="submit"
          disabled={isProcessing || (!inputText.trim() && !selectedImage)}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all cursor-pointer ${
            isProcessing
              ? 'bg-cyan-900/50 text-cyan-300 cursor-wait'
              : !inputText.trim() && !selectedImage
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 active:scale-95'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>AI Edit</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-zinc-500 text-[11px] font-mono shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Cepat:
        </span>
        {VOICE_COMMAND_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={isProcessing}
            onClick={() => onExecuteCommand(item.command, selectedImage || undefined)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer text-[11px]"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Processing Status Banner */}
      {statusMessage && (
        <div className="text-[11px] text-cyan-400/90 font-mono px-2 py-0.5 bg-cyan-950/30 rounded border border-cyan-800/30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
