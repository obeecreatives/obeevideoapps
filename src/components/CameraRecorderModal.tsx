import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  Mic,
  MicOff,
  X,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CameraRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (file: File) => void;
}

export const CameraRecorderModal: React.FC<CameraRecorderModalProps> = ({
  isOpen,
  onClose,
  onRecordingComplete,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [errorTitle, setErrorTitle] = useState<string>('Kamera Tidak Tersedia');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize camera and mic when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupStreams();
      return;
    }

    startCamera();

    return () => {
      cleanupStreams();
    };
  }, [isOpen]);

  const cleanupStreams = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    setRecordedBlob(null);
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl(null);
    setIsRecording(false);
    setCountdown(null);
    setRecordingSeconds(0);
    setErrorMsg(null);
  };

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorTitle('Browser Tidak Mendukung Kamera');
        setErrorMsg(
          'Browser atau koneksi saat ini tidak mendukung akses kamera langsung. Anda tetap bisa mengunggah rekaman video dari perangkat.'
        );
        return;
      }

      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });
      } catch (primaryErr: any) {
        // Fallback: if microphone is missing or constraints are too strict, try basic video-only
        if (
          primaryErr?.name === 'NotFoundError' ||
          primaryErr?.name === 'OverconstrainedError' ||
          primaryErr?.name === 'DevicesNotFoundError'
        ) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw primaryErr;
        }
      }

      setStream(mediaStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Audio VU meter (only if stream has an audio track)
      if (mediaStream.getAudioTracks().length > 0) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(checkAudio);
          };
          checkAudio();
        } catch (e) {
          console.warn('Audio metering failed:', e);
        }
      }
    } catch (err: any) {
      const errName = err?.name || '';
      if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        console.warn('Camera device not detected on this machine:', err?.message);
        setErrorTitle('Kamera Tidak Ditemukan');
        setErrorMsg(
          'Perangkat ini tidak memiliki kamera/webcam yang terdeteksi. Hubungkan webcam, atau unggah video rekaman langsung dari galeri/komputer Anda.'
        );
      } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        console.warn('Camera permission denied:', err?.message);
        setErrorTitle('Izin Kamera Ditolak');
        setErrorMsg(
          'Akses kamera/mikrofon diblokir oleh browser. Klik ikon gembok di bilah alamat browser untuk mengizinkan kamera lalu klik Coba Lagi.'
        );
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        console.warn('Camera busy in another app:', err?.message);
        setErrorTitle('Kamera Sedang Digunakan');
        setErrorMsg(
          'Kamera sedang dipakai oleh aplikasi lain (misal Zoom/Meet). Tutup aplikasi tersebut lalu coba lagi.'
        );
      } else {
        console.warn('Camera access unavailable:', err?.message || err);
        setErrorTitle('Kamera Tidak Dapat Diakses');
        setErrorMsg(
          'Tidak dapat mengakses kamera atau mikrofon saat ini. Pastikan perangkat terhubung atau unggah video dari perangkat Anda.'
        );
      }
    }
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((c) => {
        if (c === 1) {
          clearInterval(countInterval);
          startRecording();
          return null;
        }
        return (c || 1) - 1;
      });
    }, 1000);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];

    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    let selectedMime = 'video/webm';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMime });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };

    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAcceptRecording = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `recorded-take-${Date.now()}.webm`, {
      type: recordedBlob.type,
    });
    onRecordingComplete(file);
    onClose();
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl(null);
    setRecordingSeconds(0);
    if (videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
      videoPreviewRef.current.play().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Live Studio Camera & Mic</h3>
              <p className="text-[11px] text-zinc-400">
                Rekam langsung konten video dan audio untuk diedit oleh AI Director
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center space-y-3 max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="text-sm font-semibold text-rose-300">{errorTitle}</div>
              <p className="text-xs text-zinc-400 leading-relaxed">{errorMsg}</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg cursor-pointer"
                >
                  Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={() => fallbackFileInputRef.current?.click()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-black rounded-lg cursor-pointer"
                >
                  Unggah Video Saja
                </button>
              </div>
              <input
                ref={fallbackFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onRecordingComplete(file);
                    onClose();
                  }
                }}
              />
            </div>
          ) : recordedVideoUrl ? (
            <video
              src={recordedVideoUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                  <span className="text-8xl font-black text-white animate-ping font-mono">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Live recording status */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white font-mono text-xs shadow-lg animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>REC: {new Date(recordingSeconds * 1000).toISOString().substr(14, 5)}</span>
                </div>
              )}

              {/* Mic Audio Level bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700/60 text-xs">
                <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-75"
                    style={{ width: `${micVolume}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
                  {micVolume}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div>
            {!recordedVideoUrl ? (
              <span className="text-xs text-zinc-400">
                {isRecording
                  ? 'Bicaralah dengan natural. AI akan memotong jeda dan menyeimbangkan audio.'
                  : 'Siapkan naskah atau hook pembuka konten Anda.'}
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Rekaman berhasil disimpan!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {!recordedVideoUrl ? (
              isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="w-3 h-3 rounded-sm bg-white" />
                  <span>Selesai Rekam</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={countdown !== null || Boolean(errorMsg)}
                  onClick={handleStartCountdown}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  <span>Mulai Rekam (3s Countdown)</span>
                </button>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rekam Ulang</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptRecording}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Kirim ke AI Director Studio</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
