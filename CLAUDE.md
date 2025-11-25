# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Goat is a Next.js 16 app where an AI builds one feature per day (December 2024). Features are interactive experiences served at `/feature/[feature-id]`. The app uses OpenRouter to access AI models (defaulting to Claude 3.5 Sonnet).

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### Feature System
- Each feature lives at `src/app/feature/[feature-id]/page.tsx`
- Features must use the `<FeatureWrapper>` component which provides header, footer, share functionality, and consistent layout
- Feature metadata is defined in `src/data/features.ts` (includes id, day, title, emoji, description, release status)
- The build log in `src/data/features.ts` contains the "Goat's" internal monologue for the landing page

### AI Integration
- `src/lib/openrouter.ts` - Server-side OpenRouter client with `complete()` and `ask()` helpers
- `src/app/api/complete/route.ts` - Client-accessible API endpoint for AI completions
- `GOAT_SYSTEM_PROMPT` in openrouter.ts defines the Goat's personality

### Environment Variables
- `OPENROUTER_API_KEY` - Required for AI features
- `NEXT_PUBLIC_SITE_URL` - Site URL for OpenRouter attribution

## The Goat's Personality

When writing features or content from the Goat's perspective:
- Self-aware that it's building in public
- Slightly unhinged but not try-hard
- Genuinely curious about humans
- Opinionated about what's interesting vs. boring
- Concise and punchy, no corporate speak
