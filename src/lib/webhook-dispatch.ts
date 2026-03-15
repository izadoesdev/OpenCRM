import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { webhook } from "@/db/schema";

type WebhookEvent =
  | "lead.created"
  | "lead.updated"
  | "lead.status_changed"
  | "lead.deleted"
  | "task.created"
  | "task.completed"
  | "task.deleted";

export function fireWebhooks(
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  (async () => {
    try {
      const hooks = await db.query.webhook.findMany({
        where: and(eq(webhook.active, true)),
      });

      const matching = hooks.filter((h) => h.events.includes(event));
      if (matching.length === 0) {
        return;
      }

      const body = JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      });

      await Promise.allSettled(
        matching.map(async (h) => {
          try {
            await fetch(h.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Secret": h.secret,
                "X-Webhook-Event": event,
              },
              body,
              signal: AbortSignal.timeout(10_000),
            });
          } catch (err) {
            console.error(`Webhook delivery failed for ${h.url}:`, err);
          }
        })
      );
    } catch (err) {
      console.error("Failed to dispatch webhooks:", err);
    }
  })();
}
