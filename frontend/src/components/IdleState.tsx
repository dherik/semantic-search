import styles from "./IdleState.module.css";

const STEPS = [
  { icon: "📝", title: "You type a query", body: "In plain English, describe what you're looking for" },
  { icon: "🧠", title: "Gemini embeds it", body: "Your query becomes a 3072-dim vector capturing meaning" },
  { icon: "📐", title: "ChromaDB finds similar", body: "Cosine distance identifies semantically close jobs" },
];

export function IdleState() {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🔍</div>
      <h2 className={styles.heading}>Search by meaning, not keywords</h2>
      <p className={styles.description}>
        Try searching for a role by describing what you want to work on.
        Semantic search finds jobs that match your intent even when the exact
        words don't appear in the listing.
      </p>
      <div className={styles.stepsGrid}>
        {STEPS.map(({ icon, title, body }) => (
          <div key={title} className={styles.stepCard}>
            <div className={styles.stepIcon}>{icon}</div>
            <div className={styles.stepTitle}>{title}</div>
            <div className={styles.stepBody}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
