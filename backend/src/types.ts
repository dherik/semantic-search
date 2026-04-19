export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  description: string;
}

export interface SearchResult {
  job: Job;
  score: number;
  matchType: "semantic" | "keyword";
}

export interface SearchResponse {
  query: string;
  semanticResults: SearchResult[];
  keywordResults: SearchResult[];
  durationMs: number;
}
