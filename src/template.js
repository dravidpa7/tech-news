// src/template.js
// Generates an Anthropic-styled HTML email

/**
 * Format a date string nicely
 */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * A pill badge for the source name
 */
function sourceBadge(name, accent) {
  return `
    <span style="
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      background: ${accent}18;
      border: 1px solid ${accent}44;
      color: ${accent};
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-family: 'SF Mono', 'Fira Code', monospace;
    ">${name}</span>`;
}

/**
 * A single article card
 */
function articleCard(article, index) {
  const { source, sourceAccent, title, tldr, link, pubDate } = article;
  const date = formatDate(pubDate);

  return `
  <!-- Article ${index + 1} -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
    <tr>
      <td style="
        background: #ffffff;
        border: 1px solid #e8e8e6;
        border-radius: 12px;
        padding: 24px 28px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      ">
        <!-- Badge + date row -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 14px;">
          <tr>
            <td>${sourceBadge(source, sourceAccent)}</td>
            <td align="right" style="
              font-size: 12px;
              color: #a09f9b;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">${date}</td>
          </tr>
        </table>

        <!-- Title -->
        <h2 style="
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: 650;
          line-height: 1.4;
          color: #1a1915;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -0.02em;
        ">${title}</h2>

        <!-- TLDR -->
        <p style="
          margin: 0 0 20px 0;
          font-size: 14.5px;
          line-height: 1.65;
          color: #5c5b57;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${tldr}</p>

        <!-- CTA Button -->
        <a href="${link}" style="
          display: inline-block;
          padding: 9px 20px;
          background: #1a1915;
          color: #f5f4f0;
          text-decoration: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 550;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -0.01em;
        ">Read article →</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Full email HTML
 */
export function buildEmailHtml(articles) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const cards = articles.map((a, i) => articleCard(a, i)).join('\n');

  const sources = [...new Set(articles.map((a) => a.source))];
  const sourcePills = sources
    .map((s) => {
      const a = articles.find((x) => x.source === s);
      return sourceBadge(s, a.sourceAccent);
    })
    .join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Tech Digest — ${today}</title>
</head>
<body style="margin:0; padding:0; background:#f5f4f0; -webkit-font-smoothing: antialiased;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0; padding: 40px 16px 60px;">
    <tr>
      <td align="center">

        <!-- Inner container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Wordmark -->
                    <div style="
                      display: inline-flex;
                      align-items: center;
                      gap: 8px;
                      margin-bottom: 28px;
                    ">
                      <div style="
                        width: 28px; height: 28px;
                        background: #1a1915;
                        border-radius: 7px;
                        display: inline-block;
                        vertical-align: middle;
                      "></div>
                      <span style="
                        font-size: 15px;
                        font-weight: 600;
                        color: #1a1915;
                        letter-spacing: -0.02em;
                        vertical-align: middle;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        margin-left: 8px;
                      ">Tech Digest</span>
                    </div>

                    <!-- Hero headline -->
                    <h1 style="
                      margin: 0 0 8px 0;
                      font-size: 34px;
                      font-weight: 700;
                      color: #1a1915;
                      letter-spacing: -0.04em;
                      line-height: 1.15;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    ">Your morning<br/>tech briefing.</h1>

                    <p style="
                      margin: 0 0 20px 0;
                      font-size: 15px;
                      color: #7a7974;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    ">${today} · Top ${articles.length} stories</p>

                    <!-- Source pills -->
                    <div style="margin-bottom: 0;">${sourcePills}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 28px;">
              <div style="height:1px; background: #dddcd8;"></div>
            </td>
          </tr>

          <!-- ═══ ARTICLES ═══ -->
          <tr>
            <td>${cards}</td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="padding-top: 20px;">
              <div style="height:1px; background: #dddcd8; margin-bottom: 24px;"></div>
              <p style="
                margin: 0;
                font-size: 12px;
                color: #a09f9b;
                line-height: 1.6;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                text-align: center;
              ">
                Curated by Claude · Sent every morning at 5 AM IST<br/>
                Sources: Wired · TechCrunch · Uber Engineering · Netflix Tech Blog · TechStartups · HackerNoon
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Plain text fallback
 */
export function buildEmailText(articles) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const lines = [
    `TECH DIGEST — ${today}`,
    '='.repeat(50),
    '',
    ...articles.flatMap((a, i) => [
      `${i + 1}. [${a.source}] ${a.title}`,
      a.tldr,
      `→ ${a.link}`,
      '',
    ]),
    '-'.repeat(50),
    'Curated by Claude · Daily at 5 AM IST',
  ];
  return lines.join('\n');
}
