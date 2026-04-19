import type { SearchResponse } from "../types";
import { JobCard } from "./JobCard";
import { ColumnHeader } from "./ColumnHeader";
import { EmptyState } from "./EmptyState";
import { ResultBadge } from "./ResultBadge";
import styles from "./ResultsPanel.module.css";

interface Props {
  data: SearchResponse;
}

export function ResultsPanel({ data }: Props) {
  const { semanticResults, keywordResults, durationMs, query } = data;

  const semanticIds = new Set(semanticResults.map((r) => r.job.id));
  const keywordIds = new Set(keywordResults.map((r) => r.job.id));

  const onlyInSemantic = semanticResults.filter((r) => !keywordIds.has(r.job.id));
  const onlyInKeyword = keywordResults.filter((r) => !semanticIds.has(r.job.id));

  return (
    <div>
      <div className={styles.statsBar}>
        <span>Query: <strong className={styles.statsQuery}>"{query}"</strong></span>
        <span>⏱ {durationMs}ms total</span>
        {onlyInSemantic.length > 0 && (
          <span className={styles.statsSemanticOnly}>
            ✦ {onlyInSemantic.length} result{onlyInSemantic.length > 1 ? "s" : ""} found only by semantic search
          </span>
        )}
        {onlyInKeyword.length > 0 && (
          <span className={styles.statsKeywordOnly}>
            ✦ {onlyInKeyword.length} result{onlyInKeyword.length > 1 ? "s" : ""} found only by keyword search
          </span>
        )}
      </div>

      <div className={styles.grid}>
        <div>
          <ColumnHeader
            title="Semantic Search"
            subtitle="Powered by Gemini embeddings"
            color="#3b82f6"
            badge="AI"
            count={semanticResults.length}
          />
          {semanticResults.length === 0 ? (
            <EmptyState message="No semantic results" />
          ) : (
            semanticResults.map((result, i) => (
              <div key={result.job.id} className={styles.resultWrapper}>
                {!keywordIds.has(result.job.id) && (
                  <ResultBadge variant="semantic" />
                )}
                <JobCard result={result} rank={i + 1} />
              </div>
            ))
          )}
        </div>

        <div>
          <ColumnHeader
            title="Keyword Search"
            subtitle="Traditional word matching"
            color="#f59e0b"
            badge="Classic"
            count={keywordResults.length}
          />
          {keywordResults.length === 0 ? (
            <EmptyState message="No keyword matches found" />
          ) : (
            keywordResults.map((result, i) => (
              <div key={result.job.id} className={styles.resultWrapper}>
                {!semanticIds.has(result.job.id) && (
                  <ResultBadge variant="keyword" />
                )}
                <JobCard result={result} rank={i + 1} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
