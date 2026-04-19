import { useState } from "react";
import type { SearchResult } from "../types";
import styles from "./JobCard.module.css";

interface Props {
  result: SearchResult;
  rank: number;
}

function scoreTier(score: number): "high" | "mid" | "low" {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "mid";
  return "low";
}

const badgeClass = {
  high: styles.scoreHigh,
  mid: styles.scoreMid,
  low: styles.scoreLow,
};

const barFillClass = {
  high: styles.barFillHigh,
  mid: styles.barFillMid,
  low: styles.barFillLow,
};

const DESCRIPTION_THRESHOLD = 150;

export function JobCard({ result, rank }: Props) {
  const { job, score } = result;
  const tier = scoreTier(score);
  const [expanded, setExpanded] = useState(false);
  const isLong = job.description.length > DESCRIPTION_THRESHOLD;

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <span className={styles.rank}>#{rank}</span>
        <div className={styles.main}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{job.title}</h3>
            <span className={`${styles.scoreBadge} ${badgeClass[tier]}`}>
              {Math.round(score * 100)}% match
            </span>
          </div>
          <div className={styles.meta}>
            {job.company} · {job.location}
          </div>
        </div>
      </div>

      <div className={styles.scoreBar}>
        <div
          className={`${styles.barFill} ${barFillClass[tier]}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>

      <div className={styles.salary}>💰 {job.salary}</div>

      <p className={expanded ? styles.descriptionExpanded : styles.description}>
        {job.description}
      </p>
      {isLong && (
        <button className={styles.toggleButton} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      <div className={styles.tags}>
        {job.tags.map((tag) => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
