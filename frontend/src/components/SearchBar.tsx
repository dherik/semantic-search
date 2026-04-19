import { useState } from "react";
import styles from "./SearchBar.module.css";

const SUGGESTIONS = [
  "make websites load faster",
  "fight hackers and prevent cyberattacks",
  "AI that generates images and video",
  "help machines understand human language",
  "build AI agents in Python",
];

interface Props {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: Props) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) onSearch(query.trim());
  }

  function handleSuggestion(suggestion: string) {
    setQuery(suggestion);
    onSearch(suggestion);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try: "make websites load faster" or "fight hackers and prevent cyberattacks"'
          disabled={isLoading}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={isLoading || query.trim().length < 2}
          className={styles.button}
        >
          {isLoading ? "Searching…" : "Search"}
        </button>
      </form>

      <div className={styles.suggestions}>
        <span className={styles.suggestionsLabel}>Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestion(s)}
            disabled={isLoading}
            className={styles.suggestionButton}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
