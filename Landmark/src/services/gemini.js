const DEFAULT_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.0-pro',
  'gemini-pro',
];

function buildEndpoint(modelId) {
  return `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent`;
}

function buildPrompt(landmarkName) {
  return (
    `give me information about ${landmarkName}. Respond with 2-3 sentences that cover where it is located, ` +
    'one notable historical or cultural fact, and one fun fact or visitor tip.'
  );
}

function extractTextFromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return null;
  }

  const text = parts
    .map((part) => part?.text || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text || null;
}

async function requestDescription(modelId, payload, apiKey) {
  const endpoint = buildEndpoint(modelId);
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const isNotFound = response.status === 404 || errorPayload?.error?.code === 404;
    const message = errorPayload?.error?.message || 'Gemini request failed.';
    const error = new Error(message);
    if (isNotFound) {
      error.code = 'MODEL_NOT_FOUND';
    }
    throw error;
  }

  const data = await response.json();
  const text = extractTextFromResponse(data);
  if (text) {
    return text;
  }

  if (data?.promptFeedback?.blockReason) {
    const reason = data.promptFeedback.blockReason.replace(/_/g, ' ').toLowerCase();
    const error = new Error(`Gemini blocked the response (${reason}).`);
    error.code = 'BLOCKED';
    throw error;
  }

  const noContentError = new Error('Gemini did not return any content.');
  noContentError.code = 'NO_CONTENT';
  throw noContentError;
}

export async function describeLandmark(landmarkName) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key.');
  }

  if (!landmarkName) {
    throw new Error('Landmark name is required.');
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: buildPrompt(landmarkName) }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 256,
    },
  };

  const preferredModel = import.meta.env.VITE_GEMINI_MODEL;
  const modelsToTry = preferredModel
    ? [preferredModel, ...DEFAULT_MODELS.filter((model) => model !== preferredModel)]
    : DEFAULT_MODELS;

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      return await requestDescription(model, payload, apiKey);
    } catch (error) {
      lastError = error;
      if (!['MODEL_NOT_FOUND', 'NO_CONTENT', 'BLOCKED'].includes(error?.code)) {
        break;
      }
    }
  }

  if (preferredModel) {
    throw lastError || new Error('Gemini model request failed.');
  }

  const supportedList = DEFAULT_MODELS.join(', ');
  throw new Error(
    `Gemini request failed. None of the fallback models responded (tried: ${supportedList}). Set VITE_GEMINI_MODEL to a supported model or verify API access. Last error: ${lastError?.message || 'unknown'}.`,
  );
}
