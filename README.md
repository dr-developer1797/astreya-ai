# Astreya

Astreya is an AI workspace for Indian legal research, drafting, contract review,
litigation support, and compliance. The hosted application uses Google's Gemma 4
through the Google AI Studio API. Provider credentials remain in Next.js Route
Handlers and are never sent to the browser.

## Getting Started

Create `.env.local` in the project root:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key

# Optional overrides
GEMMA_MODEL=gemma-4-26b-a4b-it
INDIAN_KANOON_API_KEY=your_indian_kanoon_key
```

Get a Gemma API key from
[Google AI Studio](https://aistudio.google.com/apikey). Indian Kanoon is optional;
without it, Gemma research remains available but the live case-law source panel
will not be populated.

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Deploy on Vercel

Add `GEMINI_API_KEY` in **Vercel → Project Settings → Environment Variables**,
enable it for Production and Preview, then redeploy. Add
`INDIAN_KANOON_API_KEY` the same way if live case-law retrieval is required.

Do not prefix either key with `NEXT_PUBLIC_`; that would expose it in the client
bundle.
