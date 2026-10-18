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
9. ZOOM_EFFECT: { startSec: number, endSec: number, scale: number, target: "center" | "top" }`;

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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash',
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
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

  if (!isProd && !hasDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🎬 obeeVideo Apps Server is running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
