import { useState } from "react";
import { useSearch } from "./hooks/useSearch";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { IdleState } from "./components/IdleState";
import { ResultsPanel } from "./components/ResultsPanel";
import { AgentView } from "./components/AgentView";
import styles from "./App.module.css";

type Tab = "search" | "agent";

export function App() {
  const [tab, setTab] = useState<Tab>("search");
  const { status, data, errorMsg, search } = useSearch();

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "search" ? styles.tabActive : ""}`}
            onClick={() => setTab("search")}
          >
            🔍 Search
          </button>
          <button
            className={`${styles.tab} ${tab === "agent" ? styles.tabActive : ""}`}
            onClick={() => setTab("agent")}
          >
            🤖 Agent
          </button>
        </div>

        {tab === "search" && (
          <>
            <div className={styles.searchContainer}>
              <SearchBar onSearch={search} isLoading={status === "loading"} />
            </div>
            {status === "loading" && <LoadingState />}
            {status === "error" && <ErrorState message={errorMsg} />}
            {status === "success" && data && <ResultsPanel data={data} />}
            {status === "idle" && <IdleState />}
          </>
        )}

        {tab === "agent" && <AgentView />}
      </main>
    </div>
  );
}
