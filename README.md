# Astreya

Astreya is an AI workspace for Indian legal research, drafting, contract review,
litigation support, and compliance. Generation uses Google's Gemma 4 through the
Google AI Studio API. Matters and research history live in Convex. Provider
credentials stay in Next.js Route Handlers and are never sent to the browser.

## Getting started

Copy the example env file and fill in the values you have:

```bash
cp .env.example .env.local
```

Required:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). The default
model is `gemma-4-26b-a4b-it`. Override it with `GEMMA_MODEL` if needed.

Convex is required for the app shell. In a second terminal:

```bash
npx convex dev
```

That writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local`. Without it, the app shows
a missing-URL screen instead of the workspace.

Optional:

- `INDIAN_KANOON_API_KEY` — live case-law retrieval. Research still works without it; the source panel stays empty.
- `ASTREYA_API_KEY` — when set in production, `/api/*` requires this value as a Bearer token or `x-astreya-key` header.
- `NEXT_PUBLIC_SENTRY_DSN` — public Sentry DSN. Safe to expose in the browser.
- `SENTRY_AUTH_TOKEN` — build-time token for source-map uploads. Never commit it.

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Other scripts: `npm run lint`,
`npm test`, `npm run build`.

## Deploy on Vercel

Set these in **Project Settings → Environment Variables** for Production and
Preview, then redeploy:

| Variable | Notes |
| --- | --- |
| `GEMINI_API_KEY` | Required. Do not prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex deployment URL. |
| `INDIAN_KANOON_API_KEY` | Optional case-law retrieval. |
| `NEXT_PUBLIC_SENTRY_DSN` | Public DSN from the `astreya-ai` Sentry project. |
| `SENTRY_AUTH_TOKEN` | Sensitive. Needed so production builds upload source maps. |

`SENTRY_ORG` and `SENTRY_PROJECT` are written by the Sentry Vercel integration.
The org slug is `kit-bq` and the project slug is `astreya-ai`.
