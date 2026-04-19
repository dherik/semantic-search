import { generateText, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { Response } from "express";
import { searchJobsTool } from "./tools/searchJobs.js";
import { analyzeSkillGapTool } from "./tools/analyzeSkillGap.js";
import { salaryInsightsTool } from "./tools/salaryInsights.js";
import type { AgentStep, StreamEvent } from "./agentTypes.js";

const SYSTEM_PROMPT = `You are a helpful tech career advisor with access to a database of tech job listings.

Your goal is to help users find relevant jobs, understand skill requirements, and plan their career development.

You have three tools available:
- search_jobs: Find semantically similar jobs from the database
- analyze_skill_gap: Compare user skills against job requirements
- salary_insights: Analyze compensation ranges from search results

STRATEGY:
1. Always start by searching for relevant jobs based on the user's goal
2. If the user mentions their skills or asks about gaps, run analyze_skill_gap after searching
3. If the user asks about salary/compensation, run salary_insights after searching
4. Combine insights from multiple tools into a clear, actionable response

Be specific, cite the actual job titles and companies you found, and give concrete advice.
Keep your final answer focused and practical — not more than 3-4 paragraphs.`;

function sendEvent(res: Response, event: StreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export async function runAgent(
  userMessage: string,
  userSkills: string[],
  res: Response
): Promise<void> {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const model = openrouter.chat(
      process.env.AGENT_MODEL ?? "google/gemini-2.0-flash-exp:free"
    );

    const fullUserMessage =
      userSkills.length > 0
        ? `${userMessage}\n\nMy current skills: ${userSkills.join(", ")}`
        : userMessage;

    await generateText({
      model,
      stopWhen: stepCountIs(10),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: fullUserMessage }],

      tools: {
        search_jobs: searchJobsTool,
        analyze_skill_gap: analyzeSkillGapTool,
        salary_insights: salaryInsightsTool,
      },

      experimental_onStepStart({ stepNumber }) {
        if (stepNumber > 0) {
          const step: AgentStep = {
            type: "thinking",
            text: "Thinking...",
          };
          sendEvent(res, { event: "step", data: step });
        }
      },

      onStepFinish({ toolCalls, toolResults, text }) {
        for (const call of toolCalls) {
          const toolCallStep: AgentStep = {
            type: "tool_call",
            tool: call.toolName,
            input: call.input as Record<string, unknown>,
          };
          sendEvent(res, { event: "step", data: toolCallStep });
        }

        for (const result of toolResults) {
          const toolResultStep: AgentStep = {
            type: "tool_result",
            tool: result.toolName,
            result:
              typeof result.output === "string"
                ? result.output
                : JSON.stringify(result.output),
          };
          sendEvent(res, { event: "step", data: toolResultStep });
        }

        const resultToolNames = new Set(toolResults.map((r) => r.toolName));
        for (const call of toolCalls) {
          if (!resultToolNames.has(call.toolName)) {
            const toolResultStep: AgentStep = {
              type: "tool_result",
              tool: call.toolName,
              result: "Tool completed successfully — result consumed by the agent.",
            };
            sendEvent(res, { event: "step", data: toolResultStep });
          }
        }

        if (text && toolCalls.length === 0) {
          const finalStep: AgentStep = {
            type: "final_answer",
            text,
          };
          sendEvent(res, { event: "step", data: finalStep });
        }
      },
    });

    sendEvent(res, { event: "done" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[agent] Error:", message);
    sendEvent(res, { event: "error", message });
  } finally {
    res.end();
  }
}
