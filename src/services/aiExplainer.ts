import {
  ExplainerProject,
  ExplainerTheme,
  ExplainerVoiceName,
} from '../types/editor';

export interface GenerateExplainerParams {
  prompt: string;
  videoType: 'tutorial' | 'iklan' | 'editorial';
  theme: ExplainerTheme;
  voiceName: ExplainerVoiceName;
  durationTarget: number;
}

export interface GenerateExplainerResponse {
  success: boolean;
  explainer?: ExplainerProject;
  audioWarning?: string | null;
  error?: string;
}

export async function generateMotionExplainer(
  params: GenerateExplainerParams
): Promise<GenerateExplainerResponse> {
  const res = await fetch('/api/ai/explainer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Gagal membuat Motion Explainer (HTTP ${res.status})`);
  }
  return data;
}

export async function regenerateExplainerVoiceover(
  narration: string,
  voiceName: ExplainerVoiceName,
  videoType: 'tutorial' | 'iklan' | 'editorial'
): Promise<{ success: boolean; audioUrl: string }> {
  const res = await fetch('/api/ai/explainer-voiceover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ narration, voiceName, videoType }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Gagal membuat suara narator AI (HTTP ${res.status})`);
  }
  return data;
}
