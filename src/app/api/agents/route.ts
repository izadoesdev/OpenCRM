import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { validateApiKey } from "@/lib/actions/api-keys";
import { getAgent, listAgents } from "@/lib/agents";

const runAgentSchema = z.object({
  agent: z.string().min(1, "agent name is required"),
  prompt: z.string().min(1, "prompt is required"),
});

function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");
  const raw = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : xApiKey;

  if (!raw) {
    return null;
  }
  return validateApiKey(raw);
}

export async function POST(req: Request) {
  const key = await authenticate(req);
  if (!key) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = runAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { agent: agentName, prompt } = parsed.data;

  const agent = (() => {
    try {
      return getAgent(agentName, { userId: key.createdBy });
    } catch (err) {
      return err instanceof Error
        ? err
        : new Error(`Unknown agent: ${agentName}`);
    }
  })();

  if (agent instanceof Error) {
    return NextResponse.json({ error: agent.message }, { status: 404 });
  }

  try {
    const result = await agent.generate({ prompt } as never);

    return NextResponse.json({
      text: result.text,
      steps: result.steps.length,
      toolCalls: result.steps.flatMap(
        (s) => s.toolCalls?.map((tc) => tc.toolName) ?? []
      ),
      usage: result.totalUsage,
    });
  } catch (err) {
    console.error(`Agent "${agentName}" failed:`, err);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const key = await authenticate(req);
  if (!key) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  return NextResponse.json({ agents: listAgents() });
}
