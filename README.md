# Sleep Diary AI - Health Tracking and Analysis System

> ⚠️ **Work in Progress**: This project is actively being developed and refined. Code quality and features may change as development continues.

## Overview

Sleep Diary AI is a Node.js/Express backend that analyzes user input and Fitbit data to produce evidence-based sleep and health insights. The system combines AI analysis with health data to provide personalized morning briefings.

Key components include:
- **OpenRouter** (with model fallbacks) for analysis and structured JSON responses
- **Supabase** for long-term memory storage and semantic search
- **Jina embeddings** for semantic memory retrieval
- **Fitbit OAuth** for sleep and activity data
- **Google Custom Search** for research-backed recommendations

All AI reasoning steps are saved as artifacts for full transparency and debugging.

## The Problem

Many people with ADHD experience "messy sleep reindexing" - a phenomenon where:
- Medications wear off during sleep
- The brain connects unrelated information (like a malfunctioning embedding model)
- Mornings start without clear goals or memory of previous day's priorities
- Important insights from the day before get lost in the overnight mental shuffle

This system aims to surface practical, personalized insights at wake-up to help mitigate these challenges. It's experimental - effectiveness in practice is still being evaluated.

## Key Features

### AI Processing Pipeline
- **JSON Action Executor**: Structured actions including `google_search`, `analyze_results`, `synthesize`, `formulate_response`, `get_fitbit_data`, `get_fitbit_sleep`
- **Model Fallbacks**: Robust OpenRouter integration with configurable fallback chains for both text and JSON-native calls (can run entirely on free models)
- **Memory Integration**: Automatic injection of relevant historical insights using semantic search

### Data Integration
- **Fitbit Integration**: Complete OAuth flow with daily activity summaries and detailed sleep data
- **Long-term Memory**: Supabase + Jina embeddings for storing and retrieving insights across time
- **Research Integration**: Google Custom Search for evidence-based recommendations

### Transparency & Debugging
- **Full Artifact Logging**: All processing steps saved under `backend/api/ai_outputs/<jobId>/`
- **Traceable Reasoning**: Plans, analyses, syntheses, and memory matches preserved for review

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + Express |
| **Database** | Supabase (PostgreSQL) |
| **AI Models** | OpenRouter API (multiple model fallbacks) |
| **Embeddings** | Jina (2000-dimensional vectors) |
| **Search** | Google Programmable Search Engine |
| **Health Data** | Fitbit Web API |
| **Frontend** | Static files (no build process) |

## Getting Started

### Prerequisites

- Node.js v18+
- Supabase project with service-role key
- API keys for: OpenRouter, Jina
- Optional: Google Custom Search Engine (API key + CX ID)
- Fitbit Developer app credentials

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/Xx-uniquedev-xX/AI-Diary-system.git
   cd AI-Diary-system/backend
   npm install
   ```

2. **Environment Configuration**
   
   Create `.env` with these variables:
   ```env
   # Database
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # AI Models (configure fallback chain)
   OPENROUTER_API_KEY=your_openrouter_key
   OPENROUTER_MODEL_1=anthropic/claude-3.5-sonnet
   OPENROUTER_MODEL_2=openai/gpt-4-turbo-preview
   OPENROUTER_MODEL_3=meta-llama/llama-3.1-70b-instruct
   # add more models as needed

   # JSON-specific models
   OPENROUTER_JSON_MODEL_1=anthropic/claude-3.5-sonnet
   OPENROUTER_JSON_MODEL_2=openai/gpt-4-turbo-preview
   # configure JSON model fallbacks

   # AI System Prompts (optional - overrides default prompts)
   AI_BREAKDOWN_SYSTEM_PROMPT="You are a task breakdown specialist. Create numbered actionable health research steps, specific and practical. For all fitbit tasks, query is not needed"
   AI_JSON_EXECUTOR_SYSTEM_PROMPT=""
   AI_PROGRESS_ANALYZER_SYSTEM_PROMPT="You are a health progress analyzer. Evaluate research quality, analyze reliable data, identify gaps, assess completeness, and recommend next action for: {ORIGINAL_QUERY}. Current task: {ACTION_QUERY}"
   AI_SYNTHESIS_SYSTEM_PROMPT="Synthesize findings into coherent insights for: {ORIGINAL_QUERY}. Focus on evidence-based sources and personal data. Current task: {ACTION_QUERY}"
   AI_FINAL_RESPONSE_SYSTEM_PROMPT="Produce a clear, evidence-based final answer for: {ORIGINAL_QUERY}. Include caveats and actionable recommendations."

   # JSON action retry configuration
   JSON_ACTION_MAX_RETRIES=3

   # Note: Leave AI_JSON_EXECUTOR_SYSTEM_PROMPT empty to use the robust default prompt in code.

   # Embeddings
   JINA_API_KEY=your_jina_api_key

   # Search (Optional)
   GOOGLE_CSE_API_KEY=your_google_api_key
   GOOGLE_CSE_CX=your_custom_search_engine_id

   # Fitbit OAuth
   FITBIT_CLIENT_ID=your_fitbit_client_id
   FITBIT_CLIENT_SECRET=your_fitbit_client_secret
   FITBIT_REDIRECT_URL=http://localhost:8040/api/auth/fitbit/callback

   # Server Configuration
   PORT=8040
   ```

3. **Fitbit API Setup**
   
   Register at Fitbit's developer portal, create a developer account, and set up an app. Add the redirect URL as `localhost:8040/api/auth/fitbit/callback` (or adjust for your desired port).

4. **Database Setup**
   
   Apply the SQL schema files in Supabase SQL editor:
   ```bash
   # Run these files in sequence:
   # 1. supabase_part1_core_tables.sql
   # 2. supabase_part2_functions_indexes.sql  
   # 3. supabase_part3_no_rls.sql
   ```

### Running the Application

```bash
cd backend
npm start
```

The server will be available at:
- **API**: `http://localhost:8040/api`
- **Static Frontend**: `http://localhost:8040/`

## API Endpoints

### Core Processing
- `POST /api/process-and-save` - Main analysis endpoint

### Memory Management  
- `POST /api/memory/store` - Store new insights
- `POST /api/memory/search` - Semantic search of stored memories
- `POST /api/memory/test-embedding` - Test embedding generation

### Fitbit Integration
- `GET /api/auth/fitbit` - Initiate OAuth flow
- `GET /api/auth/fitbit/status` - Check authentication status
- `GET /api/auth/fitbit/callback` - OAuth callback handler

## Project Status

### Currently Working
- Core AI processing pipeline
- Fitbit data integration  
- Memory storage and retrieval
- Artifact logging system

### Cost-Effective Setup
This project can run entirely on free tiers:
- OpenRouter's free model tiers
- Supabase free tier (up to 500MB database)
- Jina's free embedding tier
- Google Custom Search free tier (100 searches/day)

### In Development
- Frontend interface improvements (currently just static HTML)
- Error handling and recovery systems (because things break, obviously)
- Performance optimizations
- More sophisticated memory ranking algorithms

### Future Considerations
- Support for additional wearable devices (Samsung watches)
- Mobile app integration (Android-first approach)
- Calendar integration (Google Calendar API)

## Contributing

This is primarily a personal learning project. Feedback is welcome on:
- The ADHD/sleep reindexing concept and whether it resonates with your experience
- Bug reports if you try running the system
- Suggestions for better health data interpretation
- Stories from others experiencing similar morning challenges
- Ideas for making insights more actionable

Open issues for discussion rather than formal pull requests. Conversations about the concept and approach are more valuable than code contributions at this stage.

## License

This project is currently unlicensed while the best approach is being determined. If you're interested in using or building upon this code, please reach out to discuss.

## Disclaimer

This project is for experimental and educational purposes. It is not intended to provide medical advice or replace consultation with healthcare professionals. The system is a work in progress - a learning project that combines structured development with experimental approaches (some parts are held together with hope and coffee🫠). While technical knowledge is sufficient to avoid major issues, this is not a cure-all or miracle solution. Always consult with qualified medical professionals for health-related decisions.