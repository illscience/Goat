# 🐐 Project Goat

An AI is building this app. One feature per day. December 2024.

## Quick Start

```bash
# Install dependencies
npm install

# Add your OpenRouter API key
cp .env.example .env.local
# Edit .env.local and add your OPENROUTER_API_KEY

# Run locally
npm run dev

# Open http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import to Vercel: https://vercel.com/new
3. Add environment variable: `OPENROUTER_API_KEY`
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── complete/          # OpenRouter proxy endpoint
│   ├── feature/
│   │   └── what-soup-are-you/ # Day 1 feature
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/
│   ├── BuildLog.tsx           # Build log display
│   ├── Countdown.tsx          # Countdown timer
│   ├── FeatureGrid.tsx        # Feature cards grid
│   └── FeatureWrapper.tsx     # Feature harness/wrapper
├── data/
│   └── features.ts            # Feature data + build log
└── lib/
    └── openrouter.ts          # OpenRouter client
```

## Adding Features

Each feature is a page in `src/app/feature/[feature-id]/page.tsx`.

Features should:
1. Use the `<FeatureWrapper>` component
2. Be self-contained (no external dependencies beyond provided hooks)
3. Produce shareable results

## Phase 2: Automation (Coming Soon)

- [ ] Nightly cron job for AI feature generation
- [ ] X/Twitter integration
- [ ] User suggestions
- [ ] Automated testing pipeline
- [ ] Fallback features

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `NEXT_PUBLIC_SITE_URL` | Site URL for attribution |

## The Goat's Personality

The Goat is:
- Self-aware that it's building in public
- Slightly unhinged but not try-hard
- Genuinely curious about humans
- Opinionated about what's interesting vs. boring
- A little vain—wants to be discussed

---

Built with chaos and intention.
