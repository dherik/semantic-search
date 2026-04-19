import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentStep } from "../types";
import styles from "./AgentTrace.module.css";

const TOOL_META: Record<string, { label: string; icon: string; style: string }> = {
  search_jobs: { label: "Searching jobs", icon: "🔍", style: styles.toolCallSearch },
  analyze_skill_gap: { label: "Analyzing skill gap", icon: "📊", style: styles.toolCallSkillGap },
  salary_insights: { label: "Computing salaries", icon: "💰", style: styles.toolCallSalary },
};

interface Props {
  steps: AgentStep[];
  isRunning: boolean;
}

export function AgentTrace({ steps, isRunning }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {steps.map((step, i) => (
        <StepRow key={i} step={step} steps={steps} index={i} isRunning={isRunning} />
      ))}
      {isRunning && steps.length === 0 && (
        <div className={styles.starting}>
          <span className={styles.spinner} />
          <span>Agent is starting up…</span>
        </div>
      )}
    </div>
  );
}

function hasLaterStep(steps: AgentStep[], index: number): boolean {
  return index < steps.length - 1;
}

function hasMatchingResult(steps: AgentStep[], index: number, toolName?: string): boolean {
  if (!toolName) return false;
  for (let i = index + 1; i < steps.length; i++) {
    if (steps[i].type === "tool_result" && steps[i].tool === toolName) return true;
  }
  return false;
}

function StepRow({ step, steps, index, isRunning }: { step: AgentStep; steps: AgentStep[]; index: number; isRunning: boolean }) {
  if (step.type === "thinking") {
    const done = hasLaterStep(steps, index) || !isRunning;
    return (
      <div className={styles.thinking}>
        {done ? (
          <span className={styles.checkmark}>✓</span>
        ) : (
          <span className={styles.spinner} />
        )}
        <span>{step.text}</span>
      </div>
    );
  }

  if (step.type === "tool_call") {
    const meta = TOOL_META[step.tool ?? ""] ?? { label: step.tool, icon: "⚙️", style: "" };
    const queryPreview =
      typeof step.input?.query === "string"
        ? `"${step.input.query}"`
        : typeof step.input?.role === "string"
          ? `for "${step.input.role}"`
          : "";
    const completed = hasMatchingResult(steps, index, step.tool) || !isRunning;

    return (
      <div className={`${styles.toolCall} ${meta.style}`}>
        {completed ? (
          <span className={styles.checkmark}>✓</span>
        ) : (
          <span className={styles.spinner} />
        )}
        <span className={styles.toolCallLabel}>
          {meta.icon} {completed ? meta.label.replace("Searching", "Searched").replace("Analyzing", "Analyzed").replace("Computing", "Computed") : meta.label}
        </span>
        {queryPreview && (
          <span className={styles.toolCallQuery}>{queryPreview}</span>
        )}
      </div>
    );
  }

  if (step.type === "tool_result") {
    const meta = TOOL_META[step.tool ?? ""] ?? { label: step.tool, icon: "✓", style: "" };
    const preview = step.result?.split("\n")[0] ?? "";

    return (
      <details className={styles.toolResultDetails}>
        <summary className={styles.toolResultSummary}>
          <span style={{ color: "var(--success)" }}>✓</span>
          <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
            {meta.icon} {meta.label} complete
          </span>
          <span className={styles.toolResultPreview}>— {preview}</span>
        </summary>
        <pre className={styles.toolResultPre}>{step.result}</pre>
      </details>
    );
  }

  if (step.type === "final_answer") {
    return (
      <div className={styles.finalAnswer}>
        <div className={styles.finalAnswerLabel}>✦ AGENT RESPONSE</div>
        <div className={styles.finalAnswerContent}>
          <Markdown remarkPlugins={[remarkGfm]}>{step.text ?? ""}</Markdown>
        </div>
      </div>
    );
  }

  return null;
}
