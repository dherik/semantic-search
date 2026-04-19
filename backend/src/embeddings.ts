// ─────────────────────────────────────────────────────────────────────────────
// embeddings.ts — Wrapper around the Google Gemini Embedding API
//
// ── WHAT IS AN EMBEDDING? ────────────────────────────────────────────────────
//
// An embedding converts text into a fixed-size list of numbers (a vector)
// that encodes the *meaning* of the text. Similar meanings → similar vectors.
//
// Think of it as coordinates in a high-dimensional "meaning space":
//
//   "autonomous AI agents for workflow automation" → [0.23, -0.91, 0.44, ...]
//   "LLM-powered bots that handle business tasks"  → [0.21, -0.89, 0.46, ...]
//   "baking sourdough bread at home"               → [-0.72, 0.35, -0.88, ...]
//
// The first two land close together in space. The third is far away.
// That spatial relationship is what makes semantic search work — we find
// documents near the query vector, regardless of exact word matches.
//
// ── GEMINI EMBEDDING MODEL ───────────────────────────────────────────────────
//
// We use gemini-embedding-001, Google's production embedding model.
// It produces 3072-dimensional vectors (3072 numbers per text).
// Free tier: 1,000 requests/day — plenty for a portfolio project.
//
// ── TASK TYPES ───────────────────────────────────────────────────────────────
//
// Unlike simpler embedding APIs, Gemini accepts a `taskType` that optimizes
// the vector for a specific use case. This is important:
//
//   RETRIEVAL_DOCUMENT → use when embedding content you want to be searchable
//   RETRIEVAL_QUERY    → use when embedding the user's search query
//
// Internally, Gemini prepends different hidden prompts based on task type,
// nudging the model to produce vectors better suited for that role.
// You MUST use the matching task type on both sides — a mismatch degrades
// retrieval quality significantly.
//
// ── BATCHING ────────────────────────────────────────────────────────────────
//
// The Gemini embedding API takes ONE text per request (unlike Voyage AI which
// can batch many). For ingest, we loop through texts sequentially with a small
// delay to stay within rate limits. This is fine for 30 jobs.
//
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-embedding-001";

// Lazily-initialized client — created once on first use
let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.\n" +
          "Get a free key at: https://aistudio.google.com/apikey"
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Embed a single piece of content that will be stored/indexed.
// Use this at ingest time for each job description.
async function embedDocument(text: string): Promise<number[]> {
  const response = await getClient().models.embedContent({
    model: MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_DOCUMENT", // optimizes for being retrieved later
    },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) throw new Error("Gemini returned no embedding for document");
  return embedding;
}

// Embed a batch of documents sequentially with a small delay between requests.
// Gemini's free tier supports 1,500 RPM, so 50ms delay is plenty of safety margin.
export async function embedDocuments(
  texts: string[],
  onProgress?: (i: number, total: number) => void
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    results.push(await embedDocument(texts[i]));
    onProgress?.(i + 1, texts.length);
    // Small delay to be polite to the API rate limiter
    if (i < texts.length - 1) await sleep(50);
  }

  return results;
}

// Embed a user's search query.
// The task type here is RETRIEVAL_QUERY — different from RETRIEVAL_DOCUMENT.
// This asymmetry is intentional and improves retrieval accuracy.
export async function embedQuery(text: string): Promise<number[]> {
  const response = await getClient().models.embedContent({
    model: MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_QUERY", // optimizes for searching stored documents
    },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) throw new Error("Gemini returned no embedding for query");
  return embedding;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
