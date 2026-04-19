import styles from "./EmptyState.module.css";

interface Props {
  message: string;
}

export function EmptyState({ message }: Props) {
  return (
    <div className={styles.container}>
      {message}
    </div>
  );
}
