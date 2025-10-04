import serviceAccount from '../../lankdmark-9ee814893a33.json';

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const TOKEN_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

let cachedToken = null;
let tokenPromise = null;
let signingKeyPromise = null;

function extractBase64(imageDataUrl) {
  const parts = imageDataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Invalid image data.');
  }
  return parts[1];
}

function toBase64UrlFromBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toBase64UrlFromString(value) {
  const encoder = new TextEncoder();
  return toBase64UrlFromBytes(encoder.encode(value));
}

function pemToArrayBuffer(pem) {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getSigningKey(privateKeyPem) {
  if (!signingKeyPromise) {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      throw new Error('Secure context required for Vision authentication.');
    }
    signingKeyPromise = window.crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKeyPem),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign'],
    );
  }
  return signingKeyPromise;
}

async function createJwtAssertion(nowSeconds = Math.floor(Date.now() / 1000)) {
  const { client_email: clientEmail, private_key: privateKey } = serviceAccount;
  if (!clientEmail || !privateKey) {
    throw new Error('Service account credentials are not configured correctly.');
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const payload = {
    iss: clientEmail,
    scope: TOKEN_SCOPE,
    aud: TOKEN_ENDPOINT,
    exp: nowSeconds + 3600,
    iat: nowSeconds,
  };

  const encodedHeader = toBase64UrlFromString(JSON.stringify(header));
  const encodedPayload = toBase64UrlFromString(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getSigningKey(privateKey);
  const signatureBuffer = await window.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const signature = toBase64UrlFromBytes(new Uint8Array(signatureBuffer));

  return `${signingInput}.${signature}`;
}

async function fetchAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    const assertion = await createJwtAssertion(Math.floor(now / 1000));
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const message = errorPayload?.error_description || errorPayload?.error || 'Failed to obtain Vision access token.';
      throw new Error(message);
    }

    const data = await response.json();
    const expiresAt = Date.now() + Math.max((data.expires_in || 3600) - 60, 60) * 1000;
    cachedToken = { token: data.access_token, expiresAt };
    return cachedToken.token;
  })()
    .catch((error) => {
      cachedToken = null;
      throw error;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
}

function buildVisionPayload(base64Content) {
  return {
    requests: [
      {
        image: { content: base64Content },
        features: [
          {
            type: 'LANDMARK_DETECTION',
            maxResults: 5,
          },
        ],
      },
    ],
  };
}

async function callVisionApi(payload, token, apiKey) {
  const endpoint = apiKey ? `${VISION_ENDPOINT}?key=${apiKey}` : VISION_ENDPOINT;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const message = errorPayload?.error?.message || errorPayload?.error?.status || 'Vision API request failed.';
    throw new Error(message);
  }

  return response.json();
}

export async function detectLandmarks(imageDataUrl) {
  const base64Content = extractBase64(imageDataUrl);
  const payload = buildVisionPayload(base64Content);

  const hasServiceAccount = Boolean(serviceAccount?.private_key && serviceAccount?.client_email);
  const apiKey = hasServiceAccount ? null : import.meta.env.VITE_GOOGLE_VISION_KEY;

  if (!hasServiceAccount && !apiKey) {
    throw new Error('No Vision credentials available.');
  }

  const token = hasServiceAccount ? await fetchAccessToken() : null;
  const data = await callVisionApi(payload, token, apiKey);
  const annotations = data?.responses?.[0]?.landmarkAnnotations || [];

  return annotations.map((annotation) => {
    const location = annotation.locations?.[0]?.latLng;
    return {
      description: annotation.description,
      score: typeof annotation.score === 'number' ? annotation.score : null,
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : null,
    };
  });
}
