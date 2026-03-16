import type { AgentContext } from "./types";

interface AgentLike {
  generate: (...args: never[]) => Promise<{
    text: string;
    steps: Array<{
      toolCalls?: Array<{ toolName: string }>;
    }>;
    totalUsage: unknown;
  }>;
}

type AgentFactory = (ctx: AgentContext) => AgentLike;

interface AgentEntry {
  description: string;
  factory: AgentFactory;
}

const agents = new Map<string, AgentEntry>();

export function registerAgent(
  name: string,
  factory: (ctx: AgentContext) => unknown,
  description: string
) {
  agents.set(name, { factory: factory as AgentFactory, description });
}

export function getAgent(name: string, ctx: AgentContext): AgentLike {
  const entry = agents.get(name);
  if (!entry) {
    const available = [...agents.keys()].join(", ");
    throw new Error(
      `Agent "${name}" not found. Available: ${available || "none"}`
    );
  }
  return entry.factory(ctx);
}

export function listAgents(): Array<{ name: string; description: string }> {
  return [...agents.entries()].map(([name, entry]) => ({
    name,
    description: entry.description,
  }));
}
