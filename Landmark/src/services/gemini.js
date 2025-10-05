// Fallbacks removed — single configured model only

function buildEndpoint(modelId) {
  return `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent`;
}

function buildPrompt(landmarkName, coords) {
  const where = coords?.latitude && coords?.longitude
    ? ` (approx. lat ${coords.latitude.toFixed(3)}, lon ${coords.longitude.toFixed(3)})`
    : '';
  const target = landmarkName ? `${landmarkName}${where}` : `this location${where}`;

  return (
    `You are a concise travel guide. In 2-3 sentences, describe ${target} for a general audience. ` +
    `Then add one short fun fact. Respond ONLY as minified JSON with keys: ` +
    `{"description": string, "funFact": string}.`
  );
}

function tryParseJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const seen = new Set();
  const candidates = [];
  const trimmed = text.trim();

  const addCandidate = (value) => {
    if (!value || typeof value !== 'string') return;
    const candidate = value.trim();
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    candidates.push(candidate);
  };

  // Raw text
  addCandidate(trimmed);

  // Strip Markdown fences if present
  const fenceMatch = trimmed.match(/```(?:json)?([\s\S]*?)```/i);
  if (fenceMatch) {
    addCandidate(fenceMatch[1]);
  }

  // Extract first JSON-looking block
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    addCandidate(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        const d = typeof parsed.description === 'string' ? parsed.description.trim() : '';
        const f = typeof parsed.funFact === 'string' ? parsed.funFact.trim() : '';
        if (d || f) return { description: d, funFact: f };
      }
    } catch (_) {
      // try next candidate
    }
  }
  return null;
}

function extractTextFromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((p) => {
      if (typeof p?.text === 'string') {
        return p.text;
      }
      if (p?.functionCall?.args) {
        try {
          return JSON.stringify(p.functionCall.args);
        } catch (_) {
          return '';
        }
      }
      if (p?.inlineData?.data) {
        try {
          const decoded = atob(p.inlineData.data);
          return decoded || '';
        } catch (_) {
          return '';
        }
      }
      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

async function requestGuide(modelId, payload, apiKey) {
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
    if (isNotFound) error.code = 'MODEL_NOT_FOUND';
    throw error;
  }

  const data = await response.json();
  const raw = extractTextFromResponse(data);
  if (raw) {
    const parsed = tryParseJsonFromText(raw);
    if (parsed) return parsed;

    // Fallback: derive description/fun fact from plain text
    let description = raw;
    let funFact = '';
    const funMatch = raw.match(/fun fact[:\-]\s*(.+)$/i);
    if (funMatch) {
      funFact = funMatch[1].trim();
      description = raw.slice(0, funMatch.index).trim();
    }
    console.log(description, funFact);
    if (description || funFact) {
      return {
        description,
        funFact,
      };
    }
  }

  if (data?.promptFeedback?.blockReason) {
    const reason = data.promptFeedback.blockReason.replace(/_/g, ' ').toLowerCase();
    const error = new Error(`Gemini blocked the response (${reason}).`);
    error.code = 'BLOCKED';
    throw error;
  }

  const noContentError = new Error('Gemini did not return usable content.');
  noContentError.code = 'NO_CONTENT';
  throw noContentError;
}

export async function chatAboutLocation(landmarkName, coords) {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API key (VITE_GEMINI_KEY).');
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: buildPrompt(landmarkName, coords) }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1500,
    },
  };

  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro';
  try {
    return await requestGuide('gemini-2.5-flash', payload, apiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const e = new Error(`Gemini chat failed for model ${model}: ${message}`);
    if (err && typeof err === 'object' && 'code' in err) {
      // preserve error code if present (e.g., MODEL_NOT_FOUND)
      e.code = err.code;
    }
    throw e;
  }
}