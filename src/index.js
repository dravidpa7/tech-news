// src/index.js
// Orchestrates: fetch → rank → template → send

import { SOURCES } from './sources.js';
import { fetchAllFeeds } from './fetcher.js';
import { rankAndSummarise } from './ranker.js';
import { buildEmailHtml, buildEmailText } from './template.js';
import { sendEmail } from './mailer.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('🚀 Tech Digest starting…');
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── 1. Fetch all RSS feeds ──────────────────────────────────────────────
  console.log(`📡 Fetching ${SOURCES.length} feeds…`);
  const articles = await fetchAllFeeds(SOURCES);
  console.log(`   Found ${articles.length} articles from the last 24 hours.`);

  if (articles.length === 0) {
    console.warn('⚠️  No articles found. Exiting.');
    process.exit(0);
  }

  // ── 2. Rank & summarise with Claude ────────────────────────────────────
  console.log('🧠 Asking Claude to pick top 10 and generate TLDRs…');
  const top10 = await rankAndSummarise(articles);
  console.log(`   Selected ${top10.length} articles.`);
  top10.forEach((a, i) =>
    console.log(`   ${i + 1}. [${a.source}] ${a.title.slice(0, 70)}…`)
  );

  // ── 3. Build email ──────────────────────────────────────────────────────
  const subject = `Tech Digest · ${today} · ${top10.length} stories`;
  const html = buildEmailHtml(top10);
  const text = buildEmailText(top10);

  // ── 4. Send (or preview in dry-run) ────────────────────────────────────
  if (isDryRun) {
    console.log('\n📋 DRY RUN — email NOT sent. HTML written to ./digest-preview.html');
    const { writeFileSync } = await import('fs');
    writeFileSync('./digest-preview.html', html, 'utf8');
    console.log('\nSubject:', subject);
    console.log('\nPlain text preview:\n' + text);
  } else {
    console.log('📬 Sending email…');
    await sendEmail({ html, text, subject });
  }

  console.log('✅ Done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
