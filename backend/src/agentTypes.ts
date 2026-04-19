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

export interface AgentRequest {
  userMessage: string;
  userSkills?: string[];
}
