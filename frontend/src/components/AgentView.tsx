import { useState } from "react";
import { AgentTrace } from "./AgentTrace";
import { useAgent } from "../hooks/useAgent";
import styles from "./AgentView.module.css";

const EXAMPLE_PROMPTS = [
  "Find me AI engineer roles and tell me what skills are most in demand",
  "What are the best paying roles for a TypeScript developer?",
  "I want to work on distributed systems — what jobs should I target?",
  "Find roles focused on RAG and retrieval systems",
  "What's the salary range for machine learning engineers?",
];

export function AgentView() {
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState("");
  const { status, steps, errorMsg, run } = useAgent();
  const isRunning = status === "running";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim()) run(message.trim(), skills);
  }

  function handleExample(prompt: string) {
    setMessage(prompt);
    run(prompt, skills);
  }

  return (
    <>
      <div className={styles.form}>
        <form onSubmit={handleSubmit}>
          <label className={styles.label}>What are you looking for?</label>
          <div className={styles.inputRow}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='e.g. "Find AI engineer roles and tell me what skills I need to develop"'
              disabled={isRunning}
              rows={2}
              className={styles.textarea}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isRunning || !message.trim()}
              className={styles.submitBtn}
            >
              {isRunning ? "Running…" : "Ask Agent"}
            </button>
          </div>
          <div>
            <label className={styles.skillsLabel}>
              Your current skills (optional — enables gap analysis)
            </label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. TypeScript, React, Node.js, PostgreSQL"
              disabled={isRunning}
              className={styles.skillsInput}
            />
          </div>
        </form>
        <div className={styles.examples}>
          <span className={styles.examplesLabel}>Try:</span>
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleExample(p)}
              disabled={isRunning}
              className={styles.exampleBtn}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {(steps.length > 0 || isRunning) && (
        <div className={styles.traceContainer}>
          <div className={styles.traceLabel}>AGENT TRACE</div>
          <AgentTrace steps={steps} isRunning={isRunning} />
        </div>
      )}

      {status === "error" && (
        <div className={styles.errorBox}>
          <strong>Error: </strong>{errorMsg}
        </div>
      )}

      {status === "idle" && (
        <div className={styles.idleContainer}>
          <div className={styles.idleIcon}>🤖</div>
          <h2 className={styles.idleTitle}>Ask me anything about tech jobs</h2>
          <p className={styles.idleSubtitle}>
            I'll search the job database, analyze skill gaps, and compute salary
            ranges — deciding which tools to use on my own.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔍</div>
              <div className={styles.featureTitle}>Semantic search</div>
              <div className={styles.featureBody}>
                Finds relevant jobs by meaning using the same ChromaDB + Gemini index
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔧</div>
              <div className={styles.featureTitle}>Tool orchestration</div>
              <div className={styles.featureBody}>
                Decides which tools to call and in what order — no hardcoded flow
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📡</div>
              <div className={styles.featureTitle}>Streaming steps</div>
              <div className={styles.featureBody}>
                Each tool call streams to the UI in real time via Server-Sent Events
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
