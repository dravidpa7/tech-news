// src/fetcher.js
// Fetches and normalises RSS feeds from all sources

import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'TechDigestBot/1.0 (Daily newsletter digest)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: ['media:content', 'content:encoded', 'description'],
  },
});

/**
 * Fetch a single RSS feed, return normalised articles.
 * @param {import('./sources.js').SOURCES[0]} source
 * @returns {Promise<Array>}
 */
async function fetchFeed(source) {
  try {
    const feed = await parser.parseURL(source.feed);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // last 24 h

    return feed.items
      .filter((item) => {
        const pub = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
        return pub >= cutoff;
      })
      .slice(0, 10) // max 10 per source before ranking
      .map((item) => ({
        source: source.name,
        sourceSlug: source.slug,
        sourceColor: source.color,
        sourceAccent: source.accent,
        title: item.title?.trim() ?? 'Untitled',
        link: item.link ?? item.guid ?? '',
        pubDate: item.pubDate ?? new Date().toISOString(),
        rawContent: stripHtml(
          item['content:encoded'] || item.content || item.description || ''
        ).slice(0, 1500), // send only first 1500 chars to Claude
      }));
  } catch (err) {
    console.warn(`⚠️  Failed to fetch ${source.name}: ${err.message}`);
    return [];
  }
}

/**
 * Fetch all feeds in parallel.
 */
export async function fetchAllFeeds(sources) {
  const results = await Promise.allSettled(sources.map(fetchFeed));
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
