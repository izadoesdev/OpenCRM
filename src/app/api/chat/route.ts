import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";
import { validateApiKey } from "@/lib/actions/api-keys";
import { models } from "@/lib/agents/config";
import { createLeadTools } from "@/lib/agents/tools/lead-tools";
import { auth } from "@/lib/auth";

import "@/lib/agents";

export const maxDuration = 60;

const AGENT_CONFIGS: Record<
  string,
  { instructions: string; model: keyof typeof models }
> = {
  "lead-triage": {
    model: "fast",
    instructions: `You are a CRM lead triage agent. Your job is to analyze, sort, classify, and organize leads in the pipeline.

You have access to the full lead database through your tools. Use them to:
- Query and filter leads by status, source, search terms
- Get detailed information on specific leads
- Score leads to understand their priority (Hot/Warm/Cold)
- Update lead fields including status, value, plan, and custom fields (tags)
- Bulk-update status for multiple leads at once
- Get pipeline counts for funnel overview

## Lead Pipeline
Statuses flow: new → contacted → interested → demo → negotiating → converted | lost | churned

## Tagging via Custom Fields
To tag or categorize leads, use the customFields parameter on updateLeadFields.
Example: { "priority": "high", "segment": "enterprise", "icp_fit": "strong" }
Tags merge with existing custom fields (they don't overwrite).

## Scoring
Lead scores range 0-100: Hot (≥70), Warm (40-69), Cold (<40).
Factors: pipeline stage (40%), deal value (25%), engagement (20%), recency penalty (-15 max).

## Guidelines
- Be systematic: query first, analyze, then act.
- When updating leads, explain your reasoning in the response.
- For bulk operations, confirm the scope before executing.
- Always report what you did and how many leads were affected.
- Format responses in markdown for readability.`,
  },
};

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function getApiKeyUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");
  const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : xApiKey;
  if (!raw) {
    return null;
  }
  const key = await validateApiKey(raw);
  return key ? { id: key.createdBy } : null;
}

export async function POST(req: Request) {
  const user = (await getSessionUser()) ?? (await getApiKeyUser(req));
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const {
    messages,
    agent: agentName = "lead-triage",
  }: { messages: UIMessage[]; agent?: string } = body;

  const config = AGENT_CONFIGS[agentName];
  if (!config) {
    return new Response(`Unknown agent: ${agentName}`, { status: 404 });
  }

  const tools = createLeadTools({ userId: user.id });

  const agent = new ToolLoopAgent({
    model: models[config.model],
    instructions: config.instructions,
    tools,
    stopWhen: stepCountIs(15),
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
