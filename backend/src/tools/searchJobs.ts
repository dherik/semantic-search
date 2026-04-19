import { tool } from "ai";
import { z } from "zod";
import { embedQuery } from "../embeddings.js";
import { querySimilarJobs } from "../chroma.js";

export const searchJobsTool = tool({
  description:
    "Search for tech job listings using semantic similarity. " +
    "Use this when the user wants to find jobs matching a role, skill set, or interest. " +
    "The search understands meaning — 'build AI agents' will find jobs that mention " +
    "'LLM orchestration' or 'autonomous systems' even without exact word matches. " +
    "Returns the top matching jobs with similarity scores.",

  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "A natural language description of what the user is looking for. " +
          "Example: 'AI engineer roles using Python and LLMs'"
      ),
    limit: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Number of results to return (default 5)"),
  }),

  execute: async ({ query, limit }) => {
    const queryVector = await embedQuery(query);

    const results = await querySimilarJobs(queryVector, limit);

    const jobs = (results.ids[0] ?? []).map((id, i) => {
      const meta = results.metadatas?.[0]?.[i] as Record<string, string>;
      const distance = results.distances?.[0]?.[i] ?? 1;
      const score = Math.round((1 - distance / 2) * 100);

      return (
        `[${score}% match] ${meta.title} at ${meta.company}\n` +
        `  Location: ${meta.location} | Salary: ${meta.salary}\n` +
        `  Skills: ${meta.tags}\n` +
        `  ${meta.description.slice(0, 200)}...`
      );
    });

    if (jobs.length === 0) {
      return "No matching jobs found for that query.";
    }

    return `Found ${jobs.length} matching jobs:\n\n${jobs.join("\n\n")}`;
  },
});
