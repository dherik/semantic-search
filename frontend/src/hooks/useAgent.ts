import { useState, useRef, useCallback } from "react";
import type { AgentStep, AgentStatus, StreamEvent } from "../types";

interface UseAgentReturn {
  status: AgentStatus;
  steps: AgentStep[];
  errorMsg: string;
  run: (message: string, skills: string) => void;
}

export function useAgent(): UseAgentReturn {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (userMessage: string, skillsInput: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setSteps([]);
    setErrorMsg("");
    setStatus("running");

    const userSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage, userSkills }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const json = line.slice(6).trim();
          if (!json) continue;

          const event: StreamEvent = JSON.parse(json);

          if (event.event === "step") {
            setSteps((prev) => [...prev, event.data!]);
          } else if (event.event === "done") {
            setStatus("done");
          } else if (event.event === "error") {
            setErrorMsg(event.message ?? "Unknown error");
            setStatus("error");
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  return { status, steps, errorMsg, run };
}
