import { useState } from "react";
import type { SearchResponse } from "../types";

type Status = "idle" | "loading" | "success" | "error";

interface UseSearchReturn {
  status: Status;
  data: SearchResponse | null;
  errorMsg: string;
  search: (query: string) => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function search(query: string) {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=5`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Search failed");
      }

      const json: SearchResponse = await res.json();
      setData(json);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  return { status, data, errorMsg, search };
}
