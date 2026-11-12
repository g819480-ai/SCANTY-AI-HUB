# SCANTY AI HUB

A futuristic, mobile-first AI hub starter.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open http://localhost:3000

## AI provider

Set these variables in `.env`:

- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL`

The `/api/chat` endpoint uses an OpenAI-compatible chat request format, so it can be connected to a compatible provider.

## Included

- Futuristic SCANTY AI HUB interface
- Responsive mobile/desktop layout
- Working chat UI
- `/api/health`
- `/api/chat`
- Tool hub cards ready for expansion
- Environment-based AI configuration
