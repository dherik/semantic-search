// ─────────────────────────────────────────────────────────────────────────────
// server.ts — Express API server
//
// Endpoints:
//   GET /health           → connection check + collection size
//   GET /search?q=...     → semantic + keyword search, returns both
//
// ── THE SEARCH PIPELINE ──────────────────────────────────────────────────────
//
// When a user types "build AI agents in Python", here's what happens:
//
//   1. The query text → Gemini embedding API (taskType: RETRIEVAL_QUERY)
//      Returns a 3072-dimensional vector representing query meaning
//
//   2. That query vector → ChromaDB .query()
//      ChromaDB computes cosine distance against all 30 stored job vectors
//      Returns top 5 closest (most semantically similar) jobs
//
//   3. Keyword search runs in parallel (no API calls needed):
//      Tokenize query → check each job's text for matching words
//      Score = fraction of query words found in the job text
//
//   4. Both result sets returned to the frontend
//
// The key insight: semantic search finds the "AI Engineer – Agent Systems"
// job at Microsoft even though it uses "Semantic Kernel" and "orchestration"
// instead of "build AI agents in Python". The meanings are close in vector
// space. Keyword search might miss it entirely.
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { embedQuery } from "./embeddings.js";
import { querySimilarJobs, getCollectionCount } from "./chroma.js";
import { runAgent } from "./runner.js";
import type { Job, SearchResult, SearchResponse } from "./types.js";
import type { AgentRequest } from "./agentTypes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3001;

// Load the full dataset into memory for keyword search.
// At 30 jobs this is trivial; even at 10,000 jobs it's fine.
const dataPath = process.env.DATA_PATH ?? join(__dirname, "../../../data/jobs.json");
const allJobs: Job[] = JSON.parse(readFileSync(dataPath, "utf-8"));

const app = express();
app.use(cors()); // Required for the React frontend on a different port
app.use(express.json());

// ── GET /health ──────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    const count = await getCollectionCount();
    res.json({
      status: "ok",
      collectionSize: count,
      message:
        count === 0
          ? "⚠️  Collection is empty — run `npm run ingest` first"
          : `✅ ${count} jobs indexed and ready to search`,
    });
  } catch {
    res.status(503).json({
      status: "error",
      message:
        "Cannot connect to ChromaDB. Make sure it is running:\n" +
        "  docker run -p 8000:8000 chromadb/chroma",
    });
  }
});

// ── GET /search?q=<query>&limit=<n> ──────────────────────────────────────────
app.get("/search", async (req, res) => {
  const query = (req.query.q as string)?.trim();
  const limit = Math.min(parseInt((req.query.limit as string) ?? "5"), 10);

  if (!query || query.length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters" });
    return;
  }

  const start = Date.now();

  try {
    // ── Semantic Search ──────────────────────────────────────────────────────

    // Step 1: Embed the query with Gemini (RETRIEVAL_QUERY task type)
    const queryVector = await embedQuery(query);

    // Step 2: Find similar vectors in ChromaDB
    const chromaResults = await querySimilarJobs(queryVector, limit);

    // Step 3: Map ChromaDB raw results → our SearchResult format
    const semanticResults: SearchResult[] = (chromaResults.ids[0] ?? []).map(
      (id: string, i: number) => {
        const meta = chromaResults.metadatas[0][i] as Record<
          string,
          string
        >;
        const distance = chromaResults.distances[0][i] ?? 1;

        // ChromaDB returns cosine *distance* (0=identical, 2=opposite).
        // We convert to a similarity score between 0 and 1:
        //   similarity = 1 - (distance / 2)
        const score = parseFloat((1 - distance / 2).toFixed(3));

        return {
          job: {
            id,
            title: meta.title,
            company: meta.company,
            location: meta.location,
            salary: meta.salary,
            // Deserialize tags back from comma-separated string → array
            tags: meta.tags ? meta.tags.split(",") : [],
            description: meta.description,
          },
          score,
          matchType: "semantic",
        };
      }
    );

    // ── Keyword Search ───────────────────────────────────────────────────────
    // Classic full-text search: count how many query words appear in each job.
    // This is what pre-neural search engines did.
    // It fails when the user's words don't match the document's words exactly.

    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2); // skip very short words (a, at, is...)

    const keywordResults: SearchResult[] = allJobs
      .map((job) => {
        const haystack =
          `${job.title} ${job.company} ${job.tags.join(" ")} ${job.description}`.toLowerCase();

        const matchCount = queryWords.filter((word) =>
          haystack.includes(word)
        ).length;

        const score =
          queryWords.length > 0
            ? parseFloat((matchCount / queryWords.length).toFixed(3))
            : 0;

        return { job, score, matchType: "keyword" as const };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const response: SearchResponse = {
      query,
      semanticResults,
      keywordResults,
      durationMs: Date.now() - start,
    };

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[/search] Error:`, message);
    res.status(500).json({ error: message });
  }
});

// ── POST /agent ──────────────────────────────────────────────────────────────
app.post("/agent", async (req, res) => {
  const { userMessage, userSkills = [] } = req.body as AgentRequest;

  if (!userMessage?.trim()) {
    res.status(400).json({ error: "userMessage is required" });
    return;
  }

  console.log(`\n[agent] New request`);
  console.log(`  Message: "${userMessage}"`);
  if (userSkills.length > 0) {
    console.log(`  Skills:  ${userSkills.join(", ")}`);
  }

  await runAgent(userMessage.trim(), userSkills, res);
});

app.listen(PORT, () => {
  console.log(`\n🚀  Server ready at http://localhost:${PORT}`);
  console.log(`    Health: http://localhost:${PORT}/health`);
  console.log(`    Search: http://localhost:${PORT}/search?q=autonomous+AI+agents`);
  console.log(`    Agent:  POST http://localhost:${PORT}/agent\n`);
});
