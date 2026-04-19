import styles from "./ErrorState.module.css";

interface Props {
  message: string;
}

export function ErrorState({ message }: Props) {
  return (
    <div className={styles.container}>
      <strong>Error: </strong>{message}
      {message.includes("ChromaDB") && (
        <div className={styles.hint}>
          Make sure ChromaDB is running:{" "}
          <code className={styles.code}>docker run -p 8000:8000 chromadb/chroma</code>
        </div>
      )}
    </div>
  );
}
