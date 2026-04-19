// ─────────────────────────────────────────────────────────────────────────────
// ingest.ts — One-time script: embed all jobs and store them in ChromaDB
//
// Run once before starting the server:
//   npm run ingest
//
// ── WHAT THIS SCRIPT DOES ────────────────────────────────────────────────────
//
//  1. Load jobs.json (tech job listings)
//  2. Build a rich text string per job (title + company + description)
//  3. Send each to Gemini Embedding API -> get back a 3072-dim vector
//  4. Store all jobs + vectors in ChromaDB
//
// After this runs once, the vectors persist on disk inside Docker's volume.
// You don't need to re-run unless you change the dataset.
//
// ── WHY WE EMBED title + company + description ──────────────────────────────
//
// We could embed just the description, but including the title and company
// gives the model more signal. "AI Engineer at Anthropic" in the text helps
// the model place the document in the right region of the semantic space
// before it even reads the description.
//
// ── GEMINI'S SINGLE-TEXT LIMITATION ─────────────────────────────────────────
//
// Unlike Voyage AI, Gemini's embedding API processes one text per request.
// For 30 jobs this means 30 API calls. That's fine for a portfolio project
// and still well within the free tier (1,000 req/day).
// If you scale to thousands of documents, batch with the Batch API instead.
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { embedDocuments } from "./embeddings.js";
import { upsertJobs, getCollectionCount } from "./chroma.js";
import type { Job } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function ingest() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Tech Jobs Semantic Search — Ingest");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── Step 1: Load the dataset ───────────────────────────────────────────────
  const dataPath = process.env.DATA_PATH ?? join(__dirname, "../../data/jobs.json");
  const jobs: Job[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  console.log(`📦  Loaded ${jobs.length} jobs from jobs.json`);

  // ── Step 2: Build text to embed ────────────────────────────────────────────
  // We concatenate title + company + tags + description into one rich string.
  // More signal in the text → better embedding quality.
  const textsToEmbed = jobs.map(
    (j) =>
      `${j.title} at ${j.company} — ${j.location}. ` +
      `Skills: ${j.tags.join(", ")}. ` +
      j.description
  );

  console.log(`\n📡  Sending to Gemini (gemini-embedding-001)...`);
  console.log(`    Note: Gemini processes one text at a time.`);
  console.log(`    Embedding ${textsToEmbed.length} jobs sequentially:\n`);

  // ── Step 3: Get embeddings from Gemini ────────────────────────────────────
  const startTime = Date.now();

  const embeddings = await embedDocuments(
    textsToEmbed,
    // Progress callback — called after each successful embedding
    (i, total) => {
      const job = jobs[i - 1];
      console.log(`    [${i}/${total}] ✓ ${job.title} at ${job.company}`);
    }
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅  Got ${embeddings.length} embeddings in ${elapsed}s`);
  console.log(
    `    Each vector: ${embeddings[0].length} dimensions (gemini-embedding-001 default)\n`
  );

  // ── Step 4: Store in ChromaDB ──────────────────────────────────────────────
  console.log(`💾  Upserting into ChromaDB...`);
  await upsertJobs(jobs, embeddings);

  const count = await getCollectionCount();
  console.log(`✅  ChromaDB collection "${" tech_jobs"}" now has ${count} documents\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Ingest complete! Start the server with:");
  console.log("    npm run dev");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

ingest().catch((err) => {
  console.error("\n❌  Ingest failed:", err.message);
  if (err.message.includes("GEMINI_API_KEY")) {
    console.error("   → Did you copy .env.example to .env and add your key?");
  }
  if (err.message.includes("ECONNREFUSED")) {
    console.error(
      "   → Is ChromaDB running? Try: docker run -p 8000:8000 chromadb/chroma"
    );
  }
  process.exit(1);
});
