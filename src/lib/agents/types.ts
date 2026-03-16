export interface AgentContext {
  userId: string;
}

export interface AgentResult {
  steps: number;
  text: string;
  toolCalls: string[];
}
