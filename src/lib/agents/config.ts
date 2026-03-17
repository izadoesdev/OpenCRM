import { createGateway } from "ai";

export const gateway = createGateway();

export const models = {
  fast: gateway("xai/grok-4.1-fast-non-reasoning"),
  smart: gateway("anthropic/claude-sonnet-4.6"),
  reasoning: gateway("anthropic/claude-sonnet-4.6"),
  flagship: gateway("openai/gpt-5.4"),
} as const;
