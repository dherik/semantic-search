# Tech Jobs — Semantic Search & AI Agent

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Node](https://img.shields.io/badge/Node-22+-green) ![React](https://img.shields.io/badge/React-19-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

A full-stack semantic search engine for tech job listings, with an AI agent that can search jobs, analyze skill gaps, and compute salary insights. The app has two modes:

- **Search tab** — demonstrates the difference between **semantic search** (meaning-based, powered by Gemini embeddings) and **keyword search** (word-matching) side by side
- **Agent tab** — an AI agent (powered by OpenRouter + Vercel AI SDK) that uses tools to autonomously search, analyze, and synthesize career advice

Built with Node.js + TypeScript, React, Google Gemini Embeddings, ChromaDB, and OpenRouter.

---

## What it looks like

### Search tab

You search for: `"make websites load faster"`

**Semantic search** finds:
- Senior Frontend Engineer (Vercel) → understands "load faster" matches web performance, SSR, and edge computing
- The query describes the *goal* — Vercel's job describes the *tools*. Same intent, different words.

**Keyword search** finds:
- Nothing — none of the words "make", "websites", "load", or "faster" appear in Vercel's listing
- The keyword column shows "No keyword matches found" entirely

That's the demo. The ✦ "semantic only" badge highlights results that semantic search uniquely found.

### Agent tab

You ask: `"Find me AI engineer roles and tell me what skills are most in demand"` with your skills: `TypeScript`

The agent:
1. Searches the job database using the same semantic search infrastructure
2. Analyzes the skill gap between your skills and the job requirements
3. Returns a structured response with in-demand skills, your gaps, and learning priorities

You see each step in real time — tool calls, thinking, and the final markdown-formatted answer.

---

## How to read the search results

Each search shows two columns side by side — **Semantic Search** (left) and **Keyword Search** (right). Each returns up to 5 results.

### Score labels

| Label | Column | Meaning |
|-------|--------|---------|
| `N% match` | Semantic | Cosine similarity between your query's vector and the job's vector. Measures how close the *meaning* is, even if no words overlap. |
| `N% match` | Keyword | Fraction of query words (longer than 2 chars) found in the job's title, company, tags, and description. Pure word overlap. |

The score bar color indicates match strength: **green** (≥75%), **amber** (50–74%), **gray** (<50%).

### Badges on results

| Badge | Meaning |
|-------|---------|
| `✦ semantic only` | This job appears in the semantic results but **not** in the keyword results. Semantic search found it by meaning alone. |
| `✦ keyword only` | This job appears in the keyword results but **not** in the semantic results. It matched by exact words but wasn't a strong semantic fit. |
| No badge | This job appears in **both** columns — both search methods agreed it's relevant. |

### Stats bar

The bar above the results shows counts like:

> ✦ 3 results found only by semantic search

This means 3 of the 5 semantic results were **not** found by keyword search. The other 2 appeared in both columns. The same logic applies in reverse for keyword search. This overlap/non-overlap is the key insight of the demo: the two methods often find *different* results for the same query.

---

## The Agent tab

The agent is an LLM (default: `google/gemini-2.0-flash-exp:free` via OpenRouter) that has access to three tools:

| Tool | What it does | When the agent uses it |
|------|-------------|----------------------|
| `search_jobs` | Semantic search over the job listings using the same ChromaDB + Gemini pipeline | Always — the agent starts by searching for relevant jobs |
| `analyze_skill_gap` | Compares user skills against job requirements, identifies missing skills and learning priorities | When the user mentions their skills or asks about gaps |
| `salary_insights` | Parses salary strings from job listings, computes ranges, averages, and midpoints | When the user asks about compensation |

### How the agent works

```
User asks a question (+ optional skills)
      ↓
Agent (LLM) decides what to do
      ↓
┌──────────────────────────────────────┐
│  Step loop (managed by Vercel AI SDK)│
│                                      │
│  LLM → "I need to search jobs"       │
│    → SDK calls search_jobs tool      │
│    → Tool queries ChromaDB           │
│    → SDK feeds result to LLM         │
│                                      │
│  LLM → "Now analyze skill gap"       │
│    → SDK calls analyze_skill_gap     │
│    → Tool compares skills vs jobs    │
│    → SDK feeds result to LLM         │
│                                      │
│  LLM → "Here's my final answer"      │
│    → No tool calls → loop ends       │
└──────────────────────────────────────┘
      ↓
Final answer streamed to user via SSE
```

Each step is streamed to the frontend in real time, showing tool calls, thinking indicators, and the final markdown response.

### Example prompts

- `"Find me AI engineer roles and tell me what skills are most in demand"` (with skills: TypeScript)
- `"What's the salary range for machine learning engineers?"`
- `"I know React and Node.js, what backend roles am I qualified for?"`
- `"What skills do I need to learn to become an AI engineer?"`

---

## Architecture

```
semantic-search/
├── data/
│   └── jobs.json              ← 30 tech job listings (the dataset)
│
├── backend/
│   └── src/
│       ├── types.ts            ← Shared interfaces (Job, SearchResult, SearchResponse)
│       ├── embeddings.ts       ← Gemini API wrapper (embed documents + queries)
│       ├── chroma.ts           ← ChromaDB wrapper (upsert + query)
│       ├── ingest.ts           ← One-time script: embed all jobs → store in ChromaDB
│       ├── server.ts           ← Express API: /health, /search, and /agent endpoints
│       ├── agentTypes.ts       ← Agent step/event types
│       ├── runner.ts           ← Agent loop with OpenRouter + Vercel AI SDK v6
│       └── tools/
│           ├── searchJobs.ts         ← Semantic job search tool (reuses chroma + embeddings)
│           ├── analyzeSkillGap.ts    ← Skill gap analysis tool
│           └── salaryInsights.ts     ← Salary parsing/analysis tool
│
└── frontend/
    └── src/
        ├── main.tsx            ← React entry point
        ├── App.tsx             ← Root component with tab navigation
        ├── types.ts            ← Types mirrored from backend
        ├── hooks/
        │   ├── useSearch.ts    ← Search API hook
        │   └── useAgent.ts     ← SSE streaming hook for agent
        └── components/
            ├── Header.tsx            ← App header
            ├── SearchBar.tsx         ← Input + suggestion chips
            ├── ResultsPanel.tsx      ← Side-by-side semantic vs keyword columns
            ├── JobCard.tsx           ← Individual job result card with score bar
            ├── AgentView.tsx         ← Agent tab (input form, example prompts, trace)
            └── AgentTrace.tsx        ← Step-by-step agent visualization
```

### How a search works

```
User types query
      ↓
embedQuery(query)           → Gemini API (taskType: RETRIEVAL_QUERY)
      ↓                        returns 3072-dimensional vector
querySimilarJobs(vector)    → ChromaDB cosine similarity search
      ↓                        returns top 5 closest stored vectors
keyword search runs         → in-memory word matching (no API call)
      ↓
Both results returned       → frontend renders side by side
```

---

## Quick Start

The fastest way to get started. Everything runs in Docker with a single command.

**Prerequisites:** Docker, a free [Gemini API key](https://aistudio.google.com/apikey), and a free [OpenRouter API key](https://openrouter.ai/keys).

```bash
# 1. Set your API keys
cp .env.example .env
# Open .env and set:
#   GEMINI_API_KEY=your_gemini_key
#   OPENROUTER_API_KEY=your_openrouter_key

# 2. Start everything
docker compose up --build
```

This starts ChromaDB, runs ingestion automatically, and launches both the backend and frontend. Open **http://localhost:5173** once you see the server is ready.

- Free Gemini tier: 1,000 embedding requests/day (needed for search + agent)
- Free OpenRouter tier: limited requests/day (needed for agent tab only)
- `AGENT_MODEL` defaults to `google/gemini-2.0-flash-exp:free` — change in `.env` if desired

---

## Manual Setup

If you prefer to run each component individually (or don't want to use Docker Compose):

### Prerequisites

- Node.js 18+
- Docker (for ChromaDB)
- A free Google Gemini API key
- A free OpenRouter API key (for agent tab)

### 1. Get API keys

- **Gemini** (free, no credit card): https://aistudio.google.com/apikey → Create API key → copy it. Free tier: 1,000 embedding requests/day
- **OpenRouter** (free tier available): https://openrouter.ai/keys → Create key → copy it. Needed for the agent tab.

### 2. Start ChromaDB

```bash
docker run -p 8000:8000 chromadb/chroma
```

ChromaDB stores the job vectors on disk inside the container. Leave this running while you use the app.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
# Open .env and set:
#   GEMINI_API_KEY=your_gemini_key
#   OPENROUTER_API_KEY=your_openrouter_key
#   AGENT_MODEL=google/gemini-2.0-flash-exp:free  (optional, this is the default)
```

### 5. Run ingest (once)

```bash
npm run ingest
```

This embeds all 30 jobs via Gemini and stores them in ChromaDB. Takes ~30 seconds. You'll see each job logged as it processes:

```
[1/30] ✓ AI Engineer at Stealth AI Startup
[2/30] ✓ Senior Frontend Engineer at Vercel
...
✅ ChromaDB collection "tech_jobs" now has 30 documents
```

You only need to run ingest once. Re-running it is safe (uses upsert).

### 6. Start the backend

```bash
npm run dev
# Server ready at http://localhost:3001
```

Verify it's working:
```bash
curl http://localhost:3001/health
# → {"status":"ok","collectionSize":30,"message":"✅ 30 jobs indexed and ready to search"}
```

### 7. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Queries that demonstrate semantic search best

These queries show the contrast between the two methods. Semantic search ranks the most relevant jobs higher by understanding meaning, while keyword search relies on exact word overlap.

| Query | What semantic search ranks highest | Keyword score |
|-------|-------------------------------------|---------------|
| `fight hackers prevent cyberattacks` | Security Engineer (CrowdStrike) | 0% — no words match |
| `make websites load faster` | Senior Frontend Engineer (Vercel) | 33% matches |
| `AI that generates images and video` | Computer Vision Engineer (Runway) | ~40% matches |
| `help machines understand human language` | NLP Engineer (Cohere) | ~20% — only "language" matches |
| `build AI agents in Python` | Senior AI Engineer (Stealth) | 100% matches - has all keywords|

> **Note:** Exact scores depend on Gemini's embeddings and may vary. The first query show the strongest contrast: keyword search finds nothing at all, while semantic search finds the right job immediately.

---

## Extending the project

**Add more jobs:** Edit `data/jobs.json` and re-run `npm run ingest`.

**Change the embedding model:** In `embeddings.ts`, swap `gemini-embedding-001` for another model. Note: if you change models, you must re-ingest (vectors from different models are incompatible).

**Add filters:** Extend the `/search` endpoint to accept `?location=Remote` and filter ChromaDB results by metadata.

**Add a new agent tool:** Create a new file in `backend/src/tools/`, define a tool with `description`, `inputSchema`, and `execute`, then register it in `runner.ts` under `tools`. The LLM will automatically learn when to use it based on the description.
