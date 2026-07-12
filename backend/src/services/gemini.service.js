const { GoogleGenAI } = require('@google/genai');
const AppError = require('../utils/AppError');

// NOTE: gemini-1.5-flash (this project's original default) has been fully
// shut down by Google and now 404s. gemini-2.5-flash is the current stable,
// generally-available replacement. Override via GEMINI_MODEL in .env.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured. Missing GEMINI_API_KEY.', 503);
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripJsonFences = (text) => text.replace(/```json/gi, '').replace(/```/g, '').trim();

const extractJson = (text) => {
  const cleaned = stripJsonFences(text);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('No JSON object found in the AI response.');
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
};

const isRetriableError = (err) => {
  const status = err?.status || err?.response?.status || err?.code;
  if (!status) return true; // network hiccup / unknown - worth a retry
  return status === 429 || (Number(status) >= 500 && Number(status) < 600);
};

/**
 * Sends a prompt to Gemini and returns the parsed JSON object, retrying
 * transient failures (rate limits, 5xx) with exponential backoff.
 *
 * @param {string} prompt
 * @param {{ temperature?: number }} [options]
 * @returns {Promise<{ parsed: object, raw: string }>}
 */
exports.generateStructuredJson = async (prompt, { temperature = 0.4 } = {}) => {
  const ai = getClient();

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          temperature,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response?.text;
      if (!rawText || !rawText.trim()) {
        throw new Error('The AI model returned an empty response.');
      }

      const jsonString = extractJson(rawText);
      const parsed = JSON.parse(jsonString);
      return { parsed, raw: rawText };
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === MAX_RETRIES;
      if (isLastAttempt || !isRetriableError(err)) break;
      // eslint-disable-next-line no-await-in-loop
      await sleep(BASE_DELAY_MS * attempt);
    }
  }

  console.error('[Gemini] Request failed after retries:', lastError?.message || lastError);
  throw new AppError('The AI service is temporarily unavailable. Please try again shortly.', 503);
};
