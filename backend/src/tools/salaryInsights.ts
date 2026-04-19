import { tool } from "ai";
import { z } from "zod";

export const salaryInsightsTool = tool({
  description:
    "Parse and analyze salary ranges from job listings to provide " +
    "market rate insights. Use this when the user asks about compensation, " +
    "salary ranges, or pay for specific roles. " +
    "Provide the raw salary strings extracted from search results.",

  inputSchema: z.object({
    salaryStrings: z
      .array(z.string())
      .describe(
        "Raw salary strings from job listings. " +
          "Example: ['$160k–$220k', '$140k–$190k', 'CAD $160k–$210k']"
      ),
    role: z
      .string()
      .describe("The role or category being analyzed, e.g. 'AI Engineer'"),
  }),

  execute: async ({ salaryStrings, role }) => {
    const parsed: Array<{ min: number; max: number }> = [];

    for (const s of salaryStrings) {
      const match = s.match(/\$?([\d.]+)k?[–\-–]([\$]?[\d.]+)k?/i);
      if (!match) continue;

      let min = parseFloat(match[1]);
      let max = parseFloat(match[2]);

      if (min < 10000) min *= 1000;
      if (max < 10000) max *= 1000;

      if (s.includes("CAD")) {
        min *= 0.73;
        max *= 0.73;
      }

      parsed.push({ min, max });
    }

    if (parsed.length === 0) {
      return `Could not parse salary data for ${role} from the provided listings.`;
    }

    const allMins = parsed.map((p) => p.min);
    const allMaxes = parsed.map((p) => p.max);
    const allMids = parsed.map((p) => (p.min + p.max) / 2);

    const fmt = (n: number) =>
      `$${Math.round(n / 1000)}k`;

    const avg = (arr: number[]) =>
      arr.reduce((a, b) => a + b, 0) / arr.length;

    return [
      `SALARY INSIGHTS FOR: ${role.toUpperCase()}`,
      `Based on ${parsed.length} listing(s)`,
      "",
      `Range:      ${fmt(Math.min(...allMins))} – ${fmt(Math.max(...allMaxes))}`,
      `Avg low:    ${fmt(avg(allMins))}`,
      `Avg high:   ${fmt(avg(allMaxes))}`,
      `Avg midpoint: ${fmt(avg(allMids))}`,
      "",
      "Note: Figures are approximate and USD-normalized.",
    ].join("\n");
  },
});
