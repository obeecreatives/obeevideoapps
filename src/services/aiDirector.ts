export interface DirectorResponse {
  success: boolean;
  actionSummary: string;
  directorTip?: string;
  actions: Array<{
    type: string;
    payload?: any;
  }>;
}

export async function sendCommandToDirector(
  command: string,
  currentContext: any,
  imageRef?: string
): Promise<DirectorResponse> {
  const res = await fetch('/api/ai/director', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command,
      currentContext,
      imageRef,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI Director request failed: ${res.statusText}`);
  }

  return await res.json();
}

export async function requestSmartCaptions(
  videoDuration: number,
  topic: string,
  style = 'alex-hormozi'
) {
  const res = await fetch('/api/ai/transcribe-captions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoDuration,
      topic,
      style,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate smart captions');
  }

  return await res.json();
}

export async function requestStoryboard(
  concept: string,
  targetAudience: string,
  platform: string
) {
  const res = await fetch('/api/ai/storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concept,
      targetAudience,
      platform,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate storyboard');
  }

  return await res.json();
}
