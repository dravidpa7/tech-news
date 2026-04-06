// src/ranker.js
// Uses OpenRouter (free tier) to pick the top 10 articles and generate TLDRs
//
// OpenRouter setup (one-time, free):
//   1. Sign up at https://openrouter.ai
//   2. Dashboard → Keys → Create Key
//   3. Add OPENROUTER_API_KEY to GitHub Secrets
//
// Default model: mistralai/mistral-7b-instruct (free, no credit needed)
// Other free models: meta-llama/llama-3-8b-instruct, google/gemma-3-4b-it
// See full free list: https://openrouter.ai/models?q=free

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models on OpenRouter — change to any model you prefer
const MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

/**
 * Call OpenRouter's OpenAI-compatible chat endpoint.
 */
async function callOpenRouter(userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY environment variable.');

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/tech-digest',  // shown in OR dashboard
      'X-Title': 'Tech Digest',
    },
    body: JSON.stringify({
      model: MODEL,
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
 * Given a flat list of articles, ask the LLM to pick the best 10
 * and generate a 1-2 sentence TLDR for each.
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

Respond ONLY with a valid JSON array (no markdown fences, no preamble) in this exact shape:
[
  { "id": <original id number>, "tldr": "<1-2 sentence summary>" },
  ...
]`;

  console.log(`   🤖 Using model: ${MODEL}`);
  const text = await callOpenRouter(prompt);

  let picks;
  try {
    picks = JSON.parse(text.trim());
  } catch {
    // Fallback: extract JSON array from partial/wrapped response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('OpenRouter returned unparseable response:\n' + text);
    picks = JSON.parse(match[0]);
  }

  // Merge TLDR back into original article objects
  return picks.slice(0, 10).map((pick) => ({
    ...articles[pick.id],
    tldr: pick.tldr,
  }));
}
