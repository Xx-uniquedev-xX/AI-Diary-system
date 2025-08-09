# Sleep Diary AI - Health Tracking and Analysis System

## Overview
Sleep Diary AI is a backend-focused Node.js/Express service that analyzes user input and Fitbit data to produce evidence-based sleep and health insights. It integrates:
- OpenRouter (with model fallbacks) for analysis, synthesis, and JSON action execution
- Supabase (server-side client with service-role key) for long‑term memory storage/search
- Jina embeddings for semantic memory
- Fitbit OAuth and data retrieval (activity and sleep)

The server also saves job artifacts to disk for traceability.

## Key Features

- **JSON Action Executor**: Fixed action types only — `google_search`, `analyze_results`, `synthesize`, `formulate_response`, `get_fitbit_data`, `get_fitbit_sleep`.
- **Model Fallbacks**: Text and JSON-native OpenRouter calls with configurable fallback model lists.
- **Long‑Term Memory**: Supabase + Jina embeddings for storing and retrieving insights; memory context is injected automatically.
- **Fitbit Integration**: OAuth flow, daily activity summary, and sleep data retrieval.
- **Artifacts**: All steps (plans, analyses, syntheses, final responses, memory matches) saved under `ai/backend/api/ai_outputs/<jobId>/`.

## Technologies Used

- **Backend**: Node.js + Express
- **Storage/DB**: Supabase (PostgreSQL) via server-side client (service-role key only)
- **Embeddings**: Jina (2000-dim vectors)
- **AI**: OpenRouter API (text + JSON models with fallbacks)
- **Search**: Google Custom Search (optional)
- **Frontend**: Static files in `ai/frontend` (optional; no React/Tailwind in this repo)

## Getting Started

### Prerequisites
- Node.js v18+
- Supabase project (URL + service-role key)
- API keys: OpenRouter, Jina
- Optional: Google CSE (API key + CX) for `google_search`
- Fitbit Developer credentials (Client ID/Secret) and redirect URL

### Installation

1) Install backend dependencies
```bash
cd ai/backend
npm install
```

2) Environment variables (create `ai/.env`)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENROUTER_API_KEY=...
OPENROUTER_MODEL_1=...
OPENROUTER_MODEL_2=...
OPENROUTER_MODEL_3=...
OPENROUTER_MODEL_4=...
OPENROUTER_MODEL_5=...

OPENROUTER_JSON_MODEL_1=...
OPENROUTER_JSON_MODEL_2=...
OPENROUTER_JSON_MODEL_3=...
OPENROUTER_JSON_MODEL_4=...
OPENROUTER_JSON_MODEL_5=...

JINA_API_KEY=...

# Optional for Google search
GOOGLE_CSE_API_KEY=...
GOOGLE_CSE_CX=...

# Fitbit OAuth
FITBIT_CLIENT_ID=...
FITBIT_CLIENT_SECRET=...
FITBIT_REDIRECT_URL=http://localhost:8040/api/auth/fitbit/callback

# Server
PORT=8040
```

3) Database
- Apply the SQL schema files under `ai/` (e.g., `supabase_part1_core_tables.sql`, `supabase_part2_functions_indexes.sql`, `supabase_part3_no_rls.sql`).
- This project uses a server-side Supabase client (service-role key only), no anon client.

### Running the Application

Start the backend server:
```bash
cd ai/backend
npm start
```

By default it serves:
- API: `http://localhost:<PORT>/api`
- Static frontend (if present): `http://localhost:<PORT>/`

Primary API routes include:
- `POST /api/process-and-save`
- `POST /api/memory/store`, `POST /api/memory/search`, `POST /api/memory/test-embedding`
- `GET /api/auth/fitbit`, `GET /api/auth/fitbit/status`, `GET /api/auth/fitbit/callback`
