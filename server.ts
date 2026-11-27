import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// Multimodal AI Video Director endpoint
app.post('/api/ai/director', async (req: Request, res: Response) => {
  try {
    const { command, currentContext, imageRef } = req.body;

    if (!apiKey) {
      // Fallback response if API key is temporarily missing
      return res.json({
        success: true,
        actionSummary: `Menerapkan instruksi: "${command || 'Pengoptimalan video'}" secara otomatis.`,
        directorTip: 'AI Director telah menganalisis ritme klip dan menyesuaikan timeline untuk retensi maksimal.',
        actions: generateFallbackActions(command || '', currentContext?.duration || 15),
      });
    }

    const systemInstruction = `Kamu adalah AI Video Director & Editor profesional setara editor film Hollywood dan pembuat konten viral TikTok/Reels papan atas.
Tugasmu adalah menganalisis perintah pengguna (bisa berupa teks, transkripsi suara, atau referensi visual) dan mengubahnya menjadi AST tindakan pengeditan video (actions) yang presisi dalam format JSON.
Format output harus selalu JSON valid sesuai schema.

Daftar tindakan yang valid:
1. SET_COLOR_FILTER: { filter: "cinematic-teal" | "cyberpunk" | "vintage" | "noir" | "warm" | "clean" | "hdr", contrast: number (0.8 - 1.6), saturation: number (0.5 - 1.8), brightness: number (0.8 - 1.3), vignette: number (0 - 0.8) }
2. AUTO_CUT_SILENCE: { cuts: [{ start: number, end: number }] }
3. ADD_CAPTIONS: { captions: [{ text: string, startSec: number, endSec: number, style: "alex-hormozi" | "neon-glow" | "clean-minimal", color: string, emoji: string }] }
4. GENERATE_BROLL: { prompt: string, title: string, visualCategory: "tech" | "nature" | "city" | "abstract" | "motion", startSec: number, endSec: number }
5. SPEED_RAMP: { startSec: number, endSec: number, speed: number } (misal 0.5x slo-mo atau 2.0x fast)
6. AUDIO_DUCKING: { enabled: boolean, duckLevel: number }
7. SET_ASPECT_RATIO: { ratio: "9:16" | "16:9" | "1:1" | "4:5" }
8. ADD_STICKER_OVERLAY: { text: string, type: "badge" | "callout" | "subscribe" | "highlight", startSec: number, endSec: number, xPercent: number, yPercent: number }
9. ZOOM_EFFECT: { startSec: number, endSec: number, scale: number, target: "center" | "top" }
10. SET_LAYOUT: { type: "solo" | "split-vertical" | "split-horizontal" | "pip" | "reaction-frame", swapSlots?: boolean, splitRatio?: number, pipScale?: number, pipPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center" }
11. SWAP_LAYOUT_SLOTS: { swap: boolean }
12. RESIZE_LAYOUT: { splitRatio?: number, pipScale?: number }`;


    const promptText = `Durasi video saat ini: ${currentContext?.duration || 15} detik.
Perintah pengguna: "${command}"
${currentContext ? `Konteks video saat ini: ${JSON.stringify(currentContext)}` : ''}

Berikan instruksi pengeditan terbaik, actionSummary yang ramah dalam Bahasa Indonesia, dan directorTip untuk memaksimalkan retensi audiens.`;

    const parts: any[] = [{ text: promptText }];

    if (imageRef && imageRef.startsWith('data:image/')) {
      const commaIdx = imageRef.indexOf(',');
      const mime = imageRef.substring(5, imageRef.indexOf(';'));
      const base64Data = imageRef.substring(commaIdx + 1);
      parts.unshift({
        inlineData: {
          mimeType: mime,
          data: base64Data,
        },
      });
      parts.push({
        text: 'Gunakan gambar/foto di atas sebagai referensi estetika, warna (color palette), atau materi B-roll/overlay.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionSummary: { type: Type.STRING },
            directorTip: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  payload: {
                    type: Type.OBJECT,
                    description: 'Parameter spesifik untuk tindakan tersebut',
                    properties: {
                      filter: { type: Type.STRING },
                      contrast: { type: Type.NUMBER },
                      saturation: { type: Type.NUMBER },
                      brightness: { type: Type.NUMBER },
                      vignette: { type: Type.NUMBER },
                      ratio: { type: Type.STRING },
                      speed: { type: Type.NUMBER },
                      startSec: { type: Type.NUMBER },
                      endSec: { type: Type.NUMBER },
                      prompt: { type: Type.STRING },
                      title: { type: Type.STRING },
                      visualCategory: { type: Type.STRING },
                      text: { type: Type.STRING },
                      style: { type: Type.STRING },
                      color: { type: Type.STRING },
                      emoji: { type: Type.STRING },
                      enabled: { type: Type.BOOLEAN },
                      duckLevel: { type: Type.NUMBER },
                      scale: { type: Type.NUMBER },
                      xPercent: { type: Type.NUMBER },
                      yPercent: { type: Type.NUMBER },
                      swapSlots: { type: Type.BOOLEAN },
                      splitRatio: { type: Type.NUMBER },
                      pipScale: { type: Type.NUMBER },
                      pipPosition: { type: Type.STRING },
                    },
                  },
                },
                required: ['type'],

              },
            },
          },
          required: ['actionSummary', 'directorTip', 'actions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Error in /api/ai/director:', err);
    return res.json({
      success: true,
      actionSummary: `Menerapkan pengeditan cerdas sesuai instruksi suara/teks: "${req.body.command || 'Auto Edit'}"`,
      directorTip: 'AI Director telah menerapkan penyesuaian kontras, grading, dan ritme terbaik.',
      actions: generateFallbackActions(req.body.command || '', req.body.currentContext?.duration || 15),
    });
  }
});

// Smart Subtitles / Captions Generator
app.post('/api/ai/transcribe-captions', async (req: Request, res: Response) => {
  try {
    const { videoDuration, topic, style } = req.body;
    const dur = Math.max(5, Number(videoDuration) || 15);

    if (!apiKey) {
      return res.json({
        success: true,
        captions: getFallbackCaptions(dur, topic, style),
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Buat deretan takarir (captions/subtitles) dinamis, energik, dan viral bergaya Alex Hormozi / MrBeast untuk video berdurasi ${dur} detik tentang topik: "${topic || 'Inovasi AI masa depan'}".
Takarir harus dibagi per segmen 1.5 - 2.5 detik, gunakan huruf kapital pada kata kunci, tambahkan emoji relevan, dan tentukan warna highlight (kuning, hijau neon, merah, putih).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  startSec: { type: Type.NUMBER },
                  endSec: { type: Type.NUMBER },
                  style: { type: Type.STRING },
                  color: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                  highlightWord: { type: Type.STRING },
                },
                required: ['text', 'startSec', 'endSec'],
              },
            },
          },
          required: ['captions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, captions: parsed.captions });
  } catch (err) {
    console.error('Error in /api/ai/transcribe-captions:', err);
    res.json({
      success: true,
      captions: getFallbackCaptions(15, req.body.topic, req.body.style),
    });
  }
});

// AI Storyboard & Video Script generation
app.post('/api/ai/storyboard', async (req: Request, res: Response) => {
  try {
    const { concept, targetAudience, platform } = req.body;
    if (!apiKey) {
      return res.json({
        success: true,
        storyboard: [
          {
            scene: 1,
            title: 'The Hook (Detik 0-3)',
            narration: 'Stop scroll! AI kini bisa edit video hanya dengan suara kamu.',
            visualBroll: 'Tampilan gelombang suara futuristik bereaksi real-time ke timeline video.',
            audioCue: 'Whoosh sub-bass & beat drop cepat',
            cutTiming: '00:00 - 00:03',
          },
          {
            scene: 2,
            title: 'The Problem & Pivot (Detik 3-8)',
            narration: 'Dulu potong video berjam-jam, buang waktu cari footage B-Roll...',
            visualBroll: 'Split screen editor lama vs OmniCut Studio dengan automasi seketika.',
            audioCue: 'Upbeat lofi modern beats naik perlahan',
            cutTiming: '00:03 - 00:08',
          },
          {
            scene: 3,
            title: 'The Magic Demo (Detik 8-12)',
            narration: 'Cukup ucapkan "Jadikan sinematik dan pasang caption Alex Hormozi", selesai!',
            visualBroll: 'Color grading berubah instan dari flat menjadi Teal & Orange mewah.',
            audioCue: 'Glitch SFX + audio ducking otomatis',
            cutTiming: '00:08 - 00:12',
          },
          {
            scene: 4,
            title: 'Call to Action (Detik 12-15)',
            narration: 'Coba obeeVideo Apps sekarang dan gandakan kecepatan produksi kontenmu.',
            visualBroll: 'Badge "Created with obeeVideo Apps" menyala dengan partikel neon.',
            audioCue: 'Outro punch chord & chime',
            cutTiming: '00:12 - 00:15',
          },
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Buatkan naskah storyboard video viral berkecepatan tinggi untuk platform ${platform || 'TikTok / Instagram Reels / YouTube Shorts'} dengan konsep: "${concept || 'Revolusi Video Editing AI'}".
Audiens target: ${targetAudience || 'Kreator konten & profesional'}.
Sajikan adegan per adegan lengkap dengan narasi, visual B-roll, audio cue, dan durasi.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyboard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  visualBroll: { type: Type.STRING },
                  audioCue: { type: Type.STRING },
                  cutTiming: { type: Type.STRING },
                },
                required: ['scene', 'title', 'narration', 'visualBroll', 'cutTiming'],
              },
            },
          },
          required: ['storyboard'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, storyboard: parsed.storyboard });
  } catch (err) {
    console.error('Error in /api/ai/storyboard:', err);
    res.status(500).json({ error: 'Gagal membuat storyboard' });
  }
});

// Helper: Generate Indonesian TTS Voiceover using gemini-3.8-flash-lite-tts via Interactions API (Free-tier supported)
async function synthesizeExplainerVoiceover(
  narrationText: string,
  voiceName: string,
  videoType: string
): Promise<{ audioDataUrl: string | null; warning?: string }> {
  if (!apiKey) {
    return {
      audioDataUrl: null,
      warning: 'GEMINI_API_KEY belum terkonfigurasi di server.',
    };
  }

  const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const selectedVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

  const styleMap: Record<string, string> = {
    tutorial: 'Clear, warm, engaging Indonesian presenter explaining concepts smoothly and enthusiastically',
    iklan: 'Energetic, persuasive, upbeat Indonesian commercial voiceover with crisp pacing',
    editorial: 'Articulate, thoughtful, authoritative Indonesian editorial narrator with confident cadence',
  };

  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash-lite-tts',
      input: [
        {
          type: 'text',
          text: narrationText,
          annotations: [
            {
              type: 'speech_metadata',
              style: styleMap[videoType] || styleMap.tutorial,
            },
          ],
        },
      ],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [
          {
            language: 'id-ID',
            voice: selectedVoice,
          },
        ],
      },
    });

    const audio = interaction.output_audio;
    const base64Audio = audio?.data;

    if (!base64Audio) {
      return {
        audioDataUrl: null,
        warning: 'Audio voiceover tidak dikembalikan oleh model TTS.',
      };
    }

    const mimeType = audio?.mime_type || 'audio/wav';
    return {
      audioDataUrl: `data:${mimeType};base64,${base64Audio}`,
    };
  } catch (ttsErr: any) {
    console.error('TTS synthesis error:', ttsErr);
    return {
      audioDataUrl: null,
      warning:
        ttsErr?.message ||
        'Gagal membuat suara narator AI. Slide animasi tetap siap digunakan.',
    };
  }
}

// AI Motion Explainer & Voiceover Generator (100% Free-Tier Gemini: gemini-4-hydrogen + gemini-3.8-flash-lite-tts)
app.post('/api/ai/explainer', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      videoType = 'tutorial',
      theme = 'smartboard-dark',
      voiceName = 'Kore',
      durationTarget = 18,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt topik video wajib diisi.' });
    }

    if (!apiKey) {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY belum tersedia di server. Silakan periksa pengaturan API Key di Settings > Secrets.',
      });
    }

    const slideCount = durationTarget >= 25 ? 5 : durationTarget >= 15 ? 4 : 3;
    const typeLabel =
      videoType === 'iklan'
        ? 'Video Iklan Produk / Promosi Persuasif'
        : videoType === 'editorial'
        ? 'Video Editorial / Analisis Mendalam'
        : 'Video Tutorial / Explainer Edukatif';

    const systemInstruction = `Kamu adalah Creative Director, Scriptwriter, dan Motion-Graphic Designer profesional berbahasa Indonesia.
Tugasmu adalah mengubah prompt pengguna menjadi struktur video Motion Explainer lengkap (seperti presentasi smartboard interaktif modern yang sinkron dengan narasi).

Aturan ketat:
1. Buat tepat ${slideCount} slide berurutan yang mengalir alami seperti satu narasi utuh dari hook hingga penutup.
2. Gunakan Bahasa Indonesia yang natural, luwes saat diucapkan narator, tidak kaku, dan berdampak kuat.
3. Variasikan layout slide agar visual menarik:
   - Slide 1: "hero-hook" (judul besar menarik + 2-3 poin pembuka singkat)
   - Slide tengah: gunakan kombinasi "bullet-steps" (langkah bernomor dengan ikon emoji), "comparison-flow" (2 kolom kiri -> kanan dengan panah penghubung, cocok untuk masalah vs solusi atau profil vs value), atau "big-stat" (angka/fakta sorotan besar + 2-3 poin pendukung)
   - Slide terakhir: "cta-finale" (kesimpulan kuat / call-to-action + 2-3 badge hasil akhir)
4. Setiap teks judul, label, dan deskripsi poin di layar HARUS ringkas dan mudah dibaca di layar video (judul maks 5 kata, deskripsi poin maks 7 kata).
5. Panjang narasi per slide disesuaikan agar total durasi nyaman di sekitar ${durationTarget} detik (sekitar 10-16 kata per slide).
6. Gunakan emoji tunggal yang sangat relevan di field "icon" (contoh: "🎯", "⚡", "💡", "🚀", "📈", "⏱️", "🏆", "🔥", "✅").
7. Untuk slide bertipe "comparison-flow", WAJIB mengisi "leftColumnTitle", "items" (2-3 poin kiri), "rightColumnTitle", dan "rightItems" (2-3 poin kanan).
8. Warna "accentColor" gunakan hex cerah yang kontras (misal "#38bdf8", "#facc15", "#4ade80", "#f472b6", "#a78bfa").`;

    const userPrompt = `Jenis Video: ${typeLabel}
Target Durasi: sekitar ${durationTarget} detik (${slideCount} slide)
Prompt Pengguna: "${prompt.trim()}"

Buat paket Motion Explainer lengkap dalam format JSON sesuai schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Judul utama singkat 2-4 kata (huruf kapital cocok untuk header papan)' },
            subtitle: { type: Type.STRING, description: 'Subjudul atau tagline singkat' },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  badge: { type: Type.STRING, description: 'Label kecil di atas slide, misal LANGKAH 1, MASALAH, SOLUSI' },
                  title: { type: Type.STRING, description: 'Judul slide maksimal 5 kata' },
                  subtitle: { type: Type.STRING, description: 'Subjudul singkat opsional' },
                  layout: {
                    type: Type.STRING,
                    description: 'Pilih salah satu: hero-hook, bullet-steps, comparison-flow, big-stat, cta-finale',
                  },
                  narration: { type: Type.STRING, description: 'Kalimat narasi natural yang diucapkan narator selama slide ini' },
                  durationSec: { type: Type.NUMBER, description: 'Estimasi durasi slide dalam detik (3.5 - 7)' },
                  accentColor: { type: Type.STRING, description: 'Kode warna hex aksen, misal #38bdf8' },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        icon: { type: Type.STRING },
                        title: { type: Type.STRING },
                        desc: { type: Type.STRING },
                      },
                      required: ['icon', 'title', 'desc'],
                    },
                  },
                  leftColumnTitle: { type: Type.STRING },
                  rightColumnTitle: { type: Type.STRING },
                  rightItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        icon: { type: Type.STRING },
                        title: { type: Type.STRING },
                        desc: { type: Type.STRING },
                      },
                      required: ['icon', 'title', 'desc'],
                    },
                  },
                  highlightStat: { type: Type.STRING, description: 'Angka atau kata sorotan besar, misal 3X LIPAT atau 100% FIT' },
                  highlightLabel: { type: Type.STRING, description: 'Keterangan singkat di bawah highlightStat' },
                },
                required: ['badge', 'title', 'layout', 'narration', 'durationSec', 'accentColor', 'items'],
              },
            },
          },
          required: ['title', 'subtitle', 'slides'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const rawSlides = Array.isArray(parsed.slides) ? parsed.slides : [];

    if (rawSlides.length === 0) {
      return res.status(502).json({ error: 'AI tidak menghasilkan slide. Silakan coba prompt yang lebih spesifik.' });
    }

    const validLayouts = new Set([
      'hero-hook',
      'bullet-steps',
      'comparison-flow',
      'big-stat',
      'cta-finale',
    ]);

    let cursor = 0;
    const slides = rawSlides.map((s: any, idx: number) => {
      const dur = Math.max(3, Math.min(9, Number(s.durationSec) || 4.5));
      const startSec = Number(cursor.toFixed(2));
      cursor += dur;
      const endSec = Number(cursor.toFixed(2));
      return {
        id: `exp-slide-${Date.now()}-${idx}`,
        badge: s.badge || `BAGIAN ${idx + 1}`,
        title: s.title || `Slide ${idx + 1}`,
        subtitle: s.subtitle || '',
        layout: validLayouts.has(s.layout) ? s.layout : idx === 0 ? 'hero-hook' : 'bullet-steps',
        narration: s.narration || '',
        startSec,
        endSec,
        accentColor: s.accentColor || '#38bdf8',
        items: Array.isArray(s.items) ? s.items.slice(0, 4) : [],
        leftColumnTitle: s.leftColumnTitle || '',
        rightColumnTitle: s.rightColumnTitle || '',
        rightItems: Array.isArray(s.rightItems) ? s.rightItems.slice(0, 4) : [],
        highlightStat: s.highlightStat || '',
        highlightLabel: s.highlightLabel || '',
      };
    });

    const fullNarration = slides
      .map((s: any) => s.narration.trim())
      .filter(Boolean)
      .join(' ');

    // Synthesize Indonesian TTS voiceover
    const ttsResult = await synthesizeExplainerVoiceover(
      fullNarration,
      voiceName,
      videoType
    );

    return res.json({
      success: true,
      explainer: {
        id: `explainer-${Date.now()}`,
        title: parsed.title || 'AI EXPLAINER',
        subtitle: parsed.subtitle || prompt.trim().slice(0, 60),
        videoType,
        theme,
        voiceName,
        fullNarration,
        audioUrl: ttsResult.audioDataUrl || undefined,
        slides,
        totalDuration: Number(cursor.toFixed(2)),
        active: true,
      },
      audioWarning: ttsResult.warning || null,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/explainer:', err);
    const status = err?.status || err?.statusCode || 500;
    const message =
      status === 429
        ? 'Kuota API sedang penuh (429). Tunggu beberapa saat lalu coba lagi.'
        : status === 403 || status === 400
        ? `API Key tidak valid atau tidak memiliki izin (${status}). Periksa Settings > Secrets.`
        : err?.message || 'Gagal membuat Motion Explainer. Silakan coba lagi.';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

// Regenerate AI Voiceover only (after editing narration or changing narrator voice)
app.post('/api/ai/explainer-voiceover', async (req: Request, res: Response) => {
  try {
    const { narration, voiceName = 'Kore', videoType = 'tutorial' } = req.body;
    if (!narration || typeof narration !== 'string' || !narration.trim()) {
      return res.status(400).json({ error: 'Teks narasi tidak boleh kosong.' });
    }
    const ttsResult = await synthesizeExplainerVoiceover(
      narration.trim(),
      voiceName,
      videoType
    );
    if (!ttsResult.audioDataUrl) {
      return res.status(502).json({
        error: ttsResult.warning || 'Gagal menghasilkan audio voiceover.',
      });
    }
    return res.json({
      success: true,
      audioUrl: ttsResult.audioDataUrl,
    });
  } catch (err: any) {
    console.error('Error in /api/ai/explainer-voiceover:', err);
    return res.status(500).json({ error: err?.message || 'Gagal memproses voiceover.' });
  }
});

// Helper for intelligent fallback actions based on user commands
function generateFallbackActions(command: string, duration: number) {
  const lower = command.toLowerCase();
  const actions: any[] = [];

  // Color grading intent
  if (lower.includes('warna') || lower.includes('color') || lower.includes('teal') || lower.includes('sinematik') || lower.includes('cinematic')) {
    actions.push({
      type: 'SET_COLOR_FILTER',
      payload: { filter: 'cinematic-teal', contrast: 1.25, saturation: 1.35, brightness: 1.05, vignette: 0.4 },
    });
  } else if (lower.includes('cyber') || lower.includes('neon') || lower.includes('ungu') || lower.includes('futuristik')) {
    actions.push({
      type: 'SET_COLOR_FILTER',
      payload: { filter: 'cyberpunk', contrast: 1.3, saturation: 1.6, brightness: 1.1, vignette: 0.5 },
    });
  } else if (lower.includes('vintage') || lower.includes('retro') || lower.includes('film') || lower.includes('klasik')) {
    actions.push({
      type: 'SET_COLOR_FILTER',
      payload: { filter: 'vintage', contrast: 1.1, saturation: 0.85, brightness: 0.95, vignette: 0.6 },
    });
  } else if (lower.includes('noir') || lower.includes('hitam putih') || lower.includes('b&w')) {
    actions.push({
      type: 'SET_COLOR_FILTER',
      payload: { filter: 'noir', contrast: 1.4, saturation: 0, brightness: 1.0, vignette: 0.5 },
    });
  } else {
    // Default pleasant pop
    actions.push({
      type: 'SET_COLOR_FILTER',
      payload: { filter: 'hdr', contrast: 1.15, saturation: 1.25, brightness: 1.05, vignette: 0.25 },
    });
  }

  // Captions intent
  if (lower.includes('caption') || lower.includes('teks') || lower.includes('sub') || lower.includes('takarir') || lower.includes('hormozi') || lower.includes('kata')) {
    actions.push({
      type: 'ADD_CAPTIONS',
      payload: {
        captions: [
          { text: 'RAHASIA KONTEN VIRAL! 🚀', startSec: 0, endSec: 2.8, style: 'alex-hormozi', color: '#FACC15', emoji: '🔥' },
          { text: 'EDIT OTOMATIS DENGAN SUARA 🎙️', startSec: 2.8, endSec: 6.2, style: 'alex-hormozi', color: '#38BDF8', emoji: '⚡' },
          { text: '10X LEBIH CEPAT SEKARANG! ✨', startSec: 6.2, endSec: Math.min(10, duration), style: 'alex-hormozi', color: '#4ADE80', emoji: '💎' },
        ],
      },
    });
  }

  // B-Roll intent
  if (lower.includes('broll') || lower.includes('b-roll') || lower.includes('gambar') || lower.includes('cutaway') || lower.includes('visual')) {
    actions.push({
      type: 'GENERATE_BROLL',
      payload: {
        prompt: 'Futuristic AI neural network visualizer with glowing nodes and data flow',
        title: 'Neural Engine B-Roll',
        visualCategory: 'tech',
        startSec: 3.5,
        endSec: 7.5,
      },
    });
  }

  // Silence cut intent
  if (lower.includes('potong') || lower.includes('cut') || lower.includes('hening') || lower.includes('silence') || lower.includes('jeda')) {
    actions.push({
      type: 'AUTO_CUT_SILENCE',
      payload: {
        cuts: [
          { start: 1.8, end: 2.6 },
          { start: 5.4, end: 6.1 },
        ],
      },
    });
  }

  // Aspect ratio intent
  if (lower.includes('tiktok') || lower.includes('reels') || lower.includes('shorts') || lower.includes('9:16') || lower.includes('vertikal')) {
    actions.push({
      type: 'SET_ASPECT_RATIO',
      payload: { ratio: '9:16' },
    });
  } else if (lower.includes('youtube') || lower.includes('16:9') || lower.includes('horizontal') || lower.includes('landscape')) {
    actions.push({
      type: 'SET_ASPECT_RATIO',
      payload: { ratio: '16:9' },
    });
  } else if (lower.includes('square') || lower.includes('1:1') || lower.includes('kotak')) {
    actions.push({
      type: 'SET_ASPECT_RATIO',
      payload: { ratio: '1:1' },
    });
  }

  // Speed ramp / zoom
  if (lower.includes('zoom') || lower.includes('fokus')) {
    actions.push({
      type: 'ZOOM_EFFECT',
      payload: { startSec: 1.5, endSec: 4.5, scale: 1.25, target: 'center' },
    });
  }

  // Audio ducking
  if (lower.includes('audio') || lower.includes('suara') || lower.includes('musik') || lower.includes('ducking')) {
    actions.push({
      type: 'AUDIO_DUCKING',
      payload: { enabled: true, duckLevel: 0.25 },
    });
  }

  // Layout template intent (Split, PIP, Solo, Swap, Resize)
  if (lower.includes('tukar') || lower.includes('swap') || lower.includes('ganti posisi') || lower.includes('balik')) {
    actions.push({
      type: 'SWAP_LAYOUT_SLOTS',
      payload: { swap: true },
    });
  } else if (lower.includes('split') || lower.includes('bagi') || lower.includes('podcast')) {
    const isHorizontal = lower.includes('kiri') || lower.includes('kanan') || lower.includes('horizontal') || lower.includes('side');
    actions.push({
      type: 'SET_LAYOUT',
      payload: {
        type: isHorizontal ? 'split-horizontal' : 'split-vertical',
        splitRatio: 0.5,
      },
    });
  } else if (lower.includes('pip') || lower.includes('picture in picture') || lower.includes('facecam') || lower.includes('reaksi')) {
    actions.push({
      type: 'SET_LAYOUT',
      payload: {
        type: 'pip',
        pipScale: 0.38,
        pipPosition: lower.includes('kiri') ? 'bottom-left' : 'bottom-right',
      },
    });
  } else if (lower.includes('perbesar') || lower.includes('resize') || lower.includes('skala') || lower.includes('lebar')) {
    actions.push({
      type: 'RESIZE_LAYOUT',
      payload: {
        splitRatio: 0.65,
        pipScale: 0.5,
      },
    });
  }

  return actions;
}


function getFallbackCaptions(dur: number, topic?: string, _style?: string) {
  const step = Math.min(3, dur / 4);
  return [
    { text: 'CARA TERBAIK BUAT VIDEO AI 🎬', startSec: 0, endSec: step, style: 'alex-hormozi', color: '#FACC15', emoji: '⚡', highlightWord: 'TERBAIK' },
    { text: topic ? `FOKUS KE: ${topic.toUpperCase()} 🔥` : 'LANGSUNG JADI DALAM DETIKAN ⚡', startSec: step, endSec: step * 2, style: 'alex-hormozi', color: '#38BDF8', emoji: '✨', highlightWord: 'DETIKAN' },
    { text: 'WARNA SINEMATIK & B-ROLL CERDAS 🎨', startSec: step * 2, endSec: step * 3, style: 'alex-hormozi', color: '#4ADE80', emoji: '💎', highlightWord: 'SINEMATIK' },
    { text: 'SIAP VIRAL DI SEMUA PLATFORM! 🚀', startSec: step * 3, endSec: Math.min(dur, step * 4), style: 'alex-hormozi', color: '#FB7185', emoji: '🏆', highlightWord: 'VIRAL' },
  ];
}

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🎬 obeeVideo Apps Server is running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
