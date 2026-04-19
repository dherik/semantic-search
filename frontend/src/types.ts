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

export interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "final_answer";
  text?: string;
  tool?: string;
  input?: Record<string, unknown>;
  result?: string;
}

export interface StreamEvent {
  event: "step" | "done" | "error";
  data?: AgentStep;
  message?: string;
}

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentState {
  status: AgentStatus;
  steps: AgentStep[];
  errorMsg: string;
}
