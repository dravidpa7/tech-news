# 📬 Tech Digest — Daily Email via GitHub Actions

A zero-server, zero-cost daily tech newsletter that:
1. **Fetches** the last 24 h of posts from 6 top tech blogs via RSS
2. **Ranks & summarises** the best 10 with Claude (Sonnet)
3. **Emails** a clean, Anthropic-styled digest at **5 AM IST** every day

---

## Folder structure

```
tech-digest/
├── .github/
│   └── workflows/
│       └── daily-digest.yml      ← GitHub Actions schedule (5 AM IST)
├── src/
│   ├── index.js                  ← Orchestrator (entry point)
│   ├── sources.js                ← RSS feed URLs + brand colours
│   ├── fetcher.js                ← Parallel RSS fetcher
│   ├── ranker.js                 ← Claude: pick top 10 + TLDRs
│   ├── template.js               ← HTML + plain-text email builder
│   └── mailer.js                 ← Resend email sender
├── package.json
└── README.md
```

---

## Setup (one-time, ~5 minutes)

### 1 · Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tech-digest.git
cd tech-digest
npm install
```

### 2 · Get your free API keys

| Service | Purpose | Cost |
|---------|---------|------|
| [OpenRouter](https://openrouter.ai) | LLM summarisation (Mistral 7B) | **Free** |
| Gmail App Password | Email delivery via SMTP | **Free** |

### 3 · Gmail App Password (one-time)

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sign in → Select app: **Mail** → Generate
3. Copy the **16-character password** (you'll use it as `GMAIL_APP_PASSWORD`)

> Gmail allows ~500 free emails/day via SMTP — more than enough.

### 4 · Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `OPENROUTER_API_KEY` | From [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | *(optional)* e.g. `meta-llama/llama-3-8b-instruct:free` |
| `GMAIL_USER` | `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-char App Password from step 3 |
| `TO_EMAIL` | Recipient email (can be same as `GMAIL_USER`) |

### 5 · Test locally (dry run — no email sent)

```bash
OPENROUTER_API_KEY=sk-or-... \
GMAIL_USER=you@gmail.com \
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx" \
TO_EMAIL=you@gmail.com \
node src/index.js --dry-run
```

This writes a `digest-preview.html` you can open in a browser.

### 6 · Test the GitHub Action

Go to **Actions → Daily Tech Digest → Run workflow** to trigger it manually.

---

## How it works

```
GitHub Actions cron (5 AM IST)
        │
        ▼
  fetchAllFeeds()          ← RSS from 6 sources in parallel
        │
        ▼
  rankAndSummarise()       ← Claude picks top 10 + writes TLDRs
        │
        ▼
  buildEmailHtml()         ← Anthropic-styled HTML email
        │
        ▼
  sendEmail()              ← Resend API delivers to your inbox
```

---

## Email design

The email follows Anthropic's design language:

- **Background**: warm off-white `#f5f4f0`
- **Cards**: white with subtle border & shadow
- **Source badge**: pill with source-brand colour (e.g. Netflix red, TechCrunch green)
- **Title**: large, tight-tracked heading
- **TLDR**: concise body copy
- **CTA**: dark pill button → full article

---

## Customisation

### Change the schedule

Edit `.github/workflows/daily-digest.yml`:

```yaml
- cron: '30 23 * * *'   # UTC — currently 5:00 AM IST
```

Use [crontab.guru](https://crontab.guru) to compute your UTC offset.

### Add / remove sources

Edit `src/sources.js`. Each source needs:
```js
{
  name: 'Display Name',
  slug: 'url-safe-slug',
  feed: 'https://example.com/feed.rss',
  color: '#hex',     // card border (optional use)
  accent: '#hex',    // badge colour
}
```

### Change the number of articles

In `src/ranker.js`, update the prompt (`top 10`) and `picks.slice(0, 10)`.

---

## Cost estimate

| Item | Cost |
|------|------|
| OpenRouter — Mistral 7B free tier | **$0.00** |
| Gmail SMTP (500 emails/day free) | **$0.00** |
| GitHub Actions (< 2 min/day) | **$0.00** |
| **Total** | **$0.00 / year** |

### Free OpenRouter models you can use

Set `OPENROUTER_MODEL` secret to any of these:

| Model | Speed | Quality |
|---|---|---|
| `mistralai/mistral-7b-instruct:free` | Fast | Good (default) |
| `meta-llama/llama-3-8b-instruct:free` | Fast | Great |
| `google/gemma-3-4b-it:free` | Fast | Good |
| `deepseek/deepseek-r1:free` | Slower | Excellent |

See the full list at [openrouter.ai/models?q=free](https://openrouter.ai/models?q=free).
