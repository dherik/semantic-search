import styles from "./ResultBadge.module.css";

type Variant = "semantic" | "keyword";

interface Props {
  variant: Variant;
}

export function ResultBadge({ variant }: Props) {
  const label = variant === "semantic" ? "✦ semantic only" : "✦ keyword only";
  return (
    <div className={`${styles.badge} ${styles[variant]}`}>
      {label}
    </div>
  );
}
