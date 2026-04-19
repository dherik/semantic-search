import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Tech Jobs</h1>
          <span className={styles.badge}>Semantic Search & AI Agent</span>
        </div>
        <p className={styles.subtitle}>
          Powered by Gemini embeddings + ChromaDB · Compare semantic vs keyword search, or ask an AI agent to find jobs, analyze skill gaps, and compute salary insights
        </p>
      </div>
    </header>
  );
}
