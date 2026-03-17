import { convertToModelMessages, type UIMessage } from "ai";
import { headers } from "next/headers";
import { validateApiKey } from "@/lib/actions/api-keys";
import { createTriageAgent } from "@/lib/agents/agents/triage";
import { auth } from "@/lib/auth";

export const maxDuration = 120;

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

  const { messages }: { messages: UIMessage[] } = await req.json();

  const agent = createTriageAgent({ userId: user.id });

  const modelMessages = await convertToModelMessages(messages);

  const result = await agent.stream({
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
  });
}
