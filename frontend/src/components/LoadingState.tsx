import styles from "./LoadingState.module.css";

export function LoadingState() {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>⏳</div>
      <div className={styles.message}>Embedding your query with Gemini…</div>
      <div className={styles.detail}>Searching 30 jobs in ChromaDB</div>
    </div>
  );
}
