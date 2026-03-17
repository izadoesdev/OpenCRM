"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BaseComponentProps } from "../types";

export interface EmailPreviewProps extends BaseComponentProps {
  bcc?: string;
  body: string;
  cc?: string;
  leadId: string;
  replyToMessageId?: string;
  subject: string;
  threadId?: string;
  to: string;
}

type SendState = "idle" | "sending" | "sent" | "error";

export function EmailPreviewRenderer({
  leadId,
  to,
  subject,
  body,
  cc,
  bcc,
  threadId,
  replyToMessageId,
  className,
}: EmailPreviewProps) {
  const [state, setState] = useState<SendState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    setState("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/chat/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          subject,
          body,
          cc: cc || undefined,
          bcc: bcc || undefined,
          threadId: threadId || undefined,
          replyToMessageId: replyToMessageId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data as { error?: string } | null)?.error ?? `Failed (${res.status})`
        );
      }

      setState("sent");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
    }
  }, [leadId, subject, body, cc, bcc, threadId, replyToMessageId]);

  return (
    <Card className={cn("gap-0 overflow-hidden border bg-card p-0", className)}>
      {/* Header */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 text-xs">
            {to.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">New Email</p>
            <p className="truncate text-muted-foreground text-xs">Draft</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-0 border-b text-xs">
        <Field label="To" value={to} />
        {cc && <Field label="Cc" value={cc} />}
        {bcc && <Field label="Bcc" value={bcc} />}
        <Field bold label="Subject" value={subject} />
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {body}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t bg-muted/20 px-4 py-3">
        {state === "idle" && (
          <button
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 font-medium text-sm text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
            onClick={handleSend}
            type="button"
          >
            <SendIcon />
            Send
          </button>
        )}
        {state === "sending" && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-600/70 px-4 py-1.5 font-medium text-sm text-white">
            <Spinner />
            Sending...
          </div>
        )}
        {state === "sent" && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 font-medium text-sm text-white">
            <CheckIcon />
            Sent
          </div>
        )}
        {state === "error" && (
          <div className="flex items-center gap-2">
            <span className="text-destructive text-xs">{errorMsg}</span>
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-blue-700"
              onClick={handleSend}
              type="button"
            >
              Retry
            </button>
          </div>
        )}
        {threadId && (
          <span className="ml-auto text-muted-foreground text-xs">
            Replying to thread
          </span>
        )}
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 border-b px-4 py-1.5 last:border-b-0">
      <span className="w-12 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 flex-1 truncate", bold && "font-medium")}>
        {value}
      </span>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
        fill="currentColor"
      />
    </svg>
  );
}
