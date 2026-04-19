// ─────────────────────────────────────────────────────────────────────────────
// chroma.ts — ChromaDB wrapper
//
// ── WHAT IS A VECTOR DATABASE? ──────────────────────────────────────────────
//
// A regular SQL database finds rows by exact matches:
//   SELECT * FROM jobs WHERE title = 'AI Engineer'
//
// A vector database finds rows by *similarity*. You give it a query vector and
// it returns the N stored vectors most geometrically similar to it.
//
// ChromaDB stores, for each job:
//   - The embedding vector (what gets searched)
//   - The original document text (retrieved with results)
//   - Arbitrary metadata (id, title, company, etc.)
//
// ── COSINE SIMILARITY ────────────────────────────────────────────────────────
//
// ChromaDB measures similarity using cosine distance:
//
//   cosine_distance(A, B) = 1 - (A · B) / (|A| × |B|)
//
// Distance 0 = identical direction = perfect semantic match
// Distance 2 = opposite direction = completely unrelated
//
// We convert to a 0–1 similarity score for display:
//   similarity = 1 - (distance / 2)
//

import { ChromaClient } from "chromadb";
import type { Collection } from "chromadb";
import type { Job } from "./types.js";

const COLLECTION_NAME = "tech_jobs";

// Module-level singletons — initialized once, reused across requests
let chromaClient: ChromaClient | null = null;
let collection: Collection | null = null;

function parseChromaUrl(url: string): { host: string; port: number; ssl: boolean } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || (parsed.protocol === "https:" ? 443 : 80),
    ssl: parsed.protocol === "https:",
  };
}

function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    const url = process.env.CHROMA_URL ?? "http://localhost:8000";
    const { host, port, ssl } = parseChromaUrl(url);
    chromaClient = new ChromaClient({ host, port, ssl });
  }
  return chromaClient;
}

// Get or create the jobs collection.
// `getOrCreateCollection` is idempotent — calling it multiple times is safe.
export async function getCollection(): Promise<Collection> {
  if (!collection) {
    collection = await getChromaClient().getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: undefined,
      metadata: {
        description: "Tech job listings embedded with Gemini gemini-embedding-001",
      },
    });
  }
  return collection;
}

// Upsert jobs + their vectors into ChromaDB.
// Upsert = insert if new, update if id already exists. Safe to re-run.
export async function upsertJobs(
  jobs: Job[],
  embeddings: number[][]
): Promise<void> {
  const col = await getCollection();

  // ChromaDB's upsert uses parallel arrays: each index across ids, embeddings,
  // documents, and metadatas corresponds to the same job. For example:
  // ids[0], embeddings[0], documents[0], metadatas[0] all belong to the first job.
  await col.upsert({
    // Chroma requires unique string IDs
    ids: jobs.map((j) => j.id),

    // The raw embedding vectors. This is what Chroma indexes for ANN search
    embeddings,

    // The text we embedded. Stored as-is for retrieval
    documents: jobs.map(
      (j) => `${j.title} at ${j.company}. ${j.description}`
    ),

    // Structured metadata, returned alongside results so we don't need
    // a separate lookup. Tags are serialized to a comma-separated string
    // because Chroma metadata values must be strings, numbers, or booleans.
    metadatas: jobs.map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location,
      salary: j.salary,
      tags: j.tags.join(","),
      description: j.description,
    })),
  });
}

// Query for the top-K most semantically similar jobs.
interface ChromaQueryResult {
  ids: string[][];
  distances: (number | null)[][];
  metadatas: (Record<string, unknown> | null)[][];
  documents: (string | null)[][];
}

export async function querySimilarJobs(
  queryEmbedding: number[],
  topK: number = 5
): Promise<ChromaQueryResult> {
  const col = await getCollection();

  return col.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    // Request all fields back so we can reconstruct full job objects
    include: ["metadatas", "documents", "distances"],
  });
}

export async function getCollectionCount(): Promise<number> {
  const col = await getCollection();
  return col.count();
}
