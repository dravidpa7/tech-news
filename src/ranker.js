// src/ranker.js
// Uses OpenRouter (free tier) to pick the top 10 articles and generate TLDRs
//
// OpenRouter setup (one-time, free):
//   1. Sign up at https://openrouter.ai
//   2. Dashboard → Keys → Create Key
//   3. Add OPENROUTER_API_KEY to GitHub Secrets
//
// Default model: openrouter/free (auto-selects from available free models)
// Override via OPENROUTER_MODEL secret, e.g. meta-llama/llama-4-maverick:free
// See full free list: https://openrouter.ai/models?q=free

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Primary model — openrouter/free auto-picks from available free models
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

// Fallback chain — tried in order if the primary model returns unparseable output
const FALLBACK_MODELS = [
  'meta-llama/llama-4-maverick:free',
  'deepseek/deepseek-chat-v3.1:free',
  'qwen/qwen3-235b-a22b:free',
];

/**
 * Call OpenRouter's OpenAI-compatible chat endpoint.
 */
async function callOpenRouter(userPrompt, model = MODEL) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY environment variable.');

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/tech-digest',
      'X-Title': 'Tech Digest',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Try to extract a valid JSON array from a raw LLM response.
 * Handles markdown fences, preamble text, and trailing content.
 */
function extractJsonArray(text) {
  if (!text || !text.trim()) throw new Error('Empty response from model.');

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  // Try direct parse first
  try { return JSON.parse(stripped); } catch {}

  // Find the first [...] array in the text
  const match = stripped.match(/\[[\s\S]*\]/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  throw new Error(`Unparseable response (first 500 chars):\n---\n${text.slice(0, 500)}\n---`);
}

/**
 * Given a flat list of articles, ask the LLM to pick the best 10
 * and generate a 1-2 sentence TLDR for each.
 * Retries with fallback models if the response can't be parsed.
 *
 * @param {Array} articles  – normalised articles from fetcher
 * @returns {Promise<Array>} – top 10 with .tldr added
 */
export async function rankAndSummarise(articles) {
  if (articles.length === 0) throw new Error('No articles to rank.');

  const payload = articles.map((a, i) => ({
    id: i,
    source: a.source,
    title: a.title,
    content: a.rawContent,
  }));

  const prompt = `You are a senior tech editor curating a daily digest for developers and tech founders.

Here are ${payload.length} articles fetched from top tech blogs today:

${JSON.stringify(payload, null, 2)}

Task:
1. Pick the 10 most insightful, impactful, and varied articles. Prefer technical depth, startup news, product launches, and engineering case studies over opinion pieces or ads.
2. For each chosen article return a 1-2 sentence TLDR that is factual, punchy, and jargon-light.
3. Ensure diversity across sources — don't pick more than 3 from the same source if possible.

Respond ONLY with a valid JSON array. No markdown fences, no preamble, no explanation — just the raw JSON array.
[
  { "id": <original id number>, "tldr": "<1-2 sentence summary>" },
  ...
]`;

  const modelsToTry = [MODEL, ...FALLBACK_MODELS];
  let lastError;

  for (const model of modelsToTry) {
    console.log(`   🤖 Trying model: ${model}`);
    try {
      const text = await callOpenRouter(prompt, model);
      const picks = extractJsonArray(text);
      console.log(`   ✅ Got valid response from: ${model}`);

      // Merge TLDR back into original article objects
      return picks.slice(0, 10).map((pick) => ({
        ...articles[pick.id],
        tldr: pick.tldr,
      }));
    } catch (err) {
      console.warn(`   ⚠️  Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError.message}`);
}
