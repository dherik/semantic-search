import styles from "./ColumnHeader.module.css";

interface Props {
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  count: number;
}

export function ColumnHeader({ title, subtitle, color, badge, count }: Props) {
  return (
    <div className={styles.header} style={{ borderBottomColor: `${color}20` }}>
      <span className={styles.badge} style={{ background: color }}>
        {badge}
      </span>
      <div>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>
          {subtitle} · {count} result{count !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
