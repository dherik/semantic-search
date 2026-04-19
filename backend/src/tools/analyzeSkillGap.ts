import { tool } from "ai";
import { z } from "zod";

export const analyzeSkillGapTool = tool({
  description:
    "Analyze the gap between a user's current skills and the skills required " +
    "by job listings they are interested in. " +
    "Use this AFTER searching for jobs, when the user provides their background " +
    "or asks what skills they need to develop. " +
    "Returns a breakdown of skills they already have, skills they're missing, " +
    "and prioritized learning recommendations.",

  inputSchema: z.object({
    userSkills: z
      .array(z.string())
      .describe(
        "List of skills the user currently has. " +
          "Example: ['TypeScript', 'React', 'Node.js', 'PostgreSQL']"
      ),
    jobDescriptions: z
      .array(z.string())
      .describe(
        "List of job descriptions or skill requirements from search results. " +
          "Each entry should be a job's required skills or description text."
      ),
  }),

  execute: async ({ userSkills, jobDescriptions }) => {
    const userSkillsLower = new Set(userSkills.map((s) => s.toLowerCase()));

    const skillKeywords = [
      "python", "typescript", "javascript", "go", "rust", "java", "c++", "c#",
      "ruby", "kotlin", "swift", "scala", "haskell",
      "langchain", "langgraph", "rag", "embeddings", "fine-tuning", "pytorch",
      "tensorflow", "transformers", "llm", "agents", "vector database",
      "semantic kernel", "openai api", "anthropic", "gemini",
      "chromadb", "pinecone", "faiss", "mcp",
      "react", "next.js", "vue", "angular", "svelte", "webgl", "tailwind",
      "fastapi", "express", "node.js", "graphql", "grpc", "rest api",
      "postgresql", "mysql", "mongodb", "redis",
      "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
      "ci/cd", "kafka", "spark",
      "system design", "distributed systems", "microservices",
      "testing", "tdd", "agile",
    ];

    const skillFrequency: Record<string, number> = {};
    const allText = jobDescriptions.join(" ").toLowerCase();

    for (const skill of skillKeywords) {
      const count = allText.split(skill).length - 1;
      if (count > 0) {
        skillFrequency[skill] = count;
      }
    }

    const sortedRequired = Object.entries(skillFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([skill]) => skill);

    const alreadyHave = sortedRequired.filter((s) =>
      userSkillsLower.has(s.toLowerCase())
    );

    const missing = sortedRequired.filter(
      (s) => !userSkillsLower.has(s.toLowerCase())
    );

    const topGaps = missing.slice(0, 5);

    const result = [
      `SKILLS YOU ALREADY HAVE (${alreadyHave.length}):`,
      alreadyHave.length > 0 ? alreadyHave.join(", ") : "None detected",
      "",
      `SKILLS YOU'RE MISSING (${missing.length} total, showing top gaps):`,
      topGaps.length > 0 ? topGaps.join(", ") : "No significant gaps found",
      "",
      "LEARNING PRIORITY:",
      ...topGaps.slice(0, 3).map(
        (skill, i) =>
          `  ${i + 1}. ${skill} — appears in ${skillFrequency[skill]} job(s) you're targeting`
      ),
    ].join("\n");

    return result;
  },
});
