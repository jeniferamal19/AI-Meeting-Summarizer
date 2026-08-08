# Recap — Meeting Summarizer (Frontend)

React + Vite frontend for the AI Meeting Summarizer. Upload a meeting recording,
watch it get transcribed and summarized, and review the decisions, action items,
and topics that came out of it.

This frontend expects a backend running at the URL set in `VITE_API_BASE_URL`
(default `http://localhost:8000`) that exposes:

- `POST /api/process` — multipart form field `file` (audio) → returns
  `{ transcript: string, summary: { summary, key_decisions, action_items, topics_discussed } }`
- `GET /api/health` — optional, used for a basic connectivity check

## Setup

```bash
npm install
cp .env.example .env   # then edit if your backend isn't on localhost:8000
npm run dev
```

Open http://localhost:5173.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Structure

```
src/
├── components/
│   ├── FileUpload.jsx        drag-and-drop + validation
│   ├── ProcessingStatus.jsx  upload/transcribe/summarize step indicator
│   ├── SummaryDisplay.jsx    overview, decisions, topics, transcript
│   ├── ActionItems.jsx       action items table
│   └── Waveform.jsx          shared visual mark
├── api/
│   └── client.js             axios wrapper around the backend
├── App.jsx                   state machine + layout
└── main.jsx                  entry point
```
