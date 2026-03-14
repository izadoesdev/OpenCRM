import {
  Add01Icon,
  Mail01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { EmptyState } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import type { GmailMessage } from "@/lib/actions/gmail";
import dayjs from "@/lib/dayjs";
import { useGoogleConnection, useSendEmail } from "@/lib/queries";

const RE_EMAIL_NAME = /^"?([^"<]+)"?\s*</;
const RE_QUOTE_TEXT = /\r?\n\s*On .+wrote:\s*\n[\s\S]*/;
const RE_GMAIL_QUOTE = /<div class="gmail_quote"[\s\S]*$/i;
const RE_BLOCKQUOTE_TAIL = /<blockquote[^>]*>[\s\S]*$/i;

function parseEmailName(raw: string): string {
  const match = raw.match(RE_EMAIL_NAME);
  if (match) {
    return match[1].trim();
  }
  return raw.split("@")[0];
}

function isFromLead(from: string, leadEmail: string): boolean {
  return from.toLowerCase().includes(leadEmail.toLowerCase());
}

function decodeHtmlEntities(str: string): string {
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&#39;": "'",
    "&apos;": "'",
    "&quot;": '"',
    "&#x27;": "'",
    "&#x2F;": "/",
    "&nbsp;": " ",
  };
  return str.replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, (ent) => map[ent] ?? ent);
}

function stripQuotedHtml(html: string): string {
  let clean = html.replace(RE_GMAIL_QUOTE, "");
  clean = clean.replace(RE_BLOCKQUOTE_TAIL, "");
  return clean.trim();
}

function stripQuotedText(text: string): string {
  return text.replace(RE_QUOTE_TEXT, "").trim();
}

const INITIAL_EMAIL_COUNT = 20;

export function EmailThreadView({
  emails,
  leadEmail,
  leadId,
  leadName,
}: {
  emails: GmailMessage[];
  leadEmail: string;
  leadId: string;
  leadName: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [showCount, setShowCount] = useState(INITIAL_EMAIL_COUNT);

  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [replyCtx, setReplyCtx] = useState<{
    threadId: string;
    messageId: string;
    subject: string;
  } | null>(null);

  const sendEmail = useSendEmail();
  const { data: gConn } = useGoogleConnection();

  const sorted = [...emails].sort(
    (a, b) => Number(b.internalDate) - Number(a.internalDate)
  );

  const filtered = sorted.filter((msg) => {
    const received = isFromLead(msg.from, leadEmail);
    if (filter === "sent" && received) {
      return false;
    }
    if (filter === "received" && !received) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        msg.subject?.toLowerCase().includes(q) ||
        msg.snippet?.toLowerCase().includes(q) ||
        msg.from?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function startReply(msg: GmailMessage) {
    const subj = msg.subject?.startsWith("Re:")
      ? msg.subject
      : `Re: ${msg.subject}`;
    setReplyCtx({
      threadId: msg.threadId,
      messageId: msg.messageId,
      subject: subj,
    });
    setComposeSubject(subj);
    setComposeBody("");
    setComposeCc(msg.cc || "");
    setComposeBcc("");
    setShowExtraFields(!!msg.cc);
  }

  function resetCompose() {
    setReplyCtx(null);
    setComposeSubject("");
    setComposeBody("");
    setComposeCc("");
    setComposeBcc("");
    setShowExtraFields(false);
  }

  function handleQuickSend() {
    const body = composeBody.trim();
    if (!body) {
      return;
    }
    const subject = composeSubject.trim() || `Message to ${leadName}`;
    sendEmail.mutate(
      {
        leadId,
        data: {
          subject,
          body,
          sendVia: gConn?.hasGmail ? "gmail" : "resend",
          cc: composeCc.trim() || undefined,
          bcc: composeBcc.trim() || undefined,
          threadId: replyCtx?.threadId,
          replyToMessageId: replyCtx?.messageId,
        },
      },
      { onSuccess: resetCompose }
    );
  }

  const threads = new Map<string, GmailMessage[]>();
  for (const e of filtered) {
    const tid = e.threadId;
    if (!threads.has(tid)) {
      threads.set(tid, []);
    }
    threads.get(tid)?.push(e);
  }
  for (const msgs of threads.values()) {
    msgs.sort((a, b) => Number(a.internalDate) - Number(b.internalDate));
  }
  const sortedThreads = [...threads.entries()].sort(
    ([, a], [, b]) =>
      Number(b.at(-1)?.internalDate ?? 0) - Number(a.at(-1)?.internalDate ?? 0)
  );
  const visibleThreads = sortedThreads.slice(0, showCount);
  const hasMoreThreads = sortedThreads.length > showCount;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 pb-3">
        <div className="relative flex-1">
          <HugeiconsIcon
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
            size={13}
            strokeWidth={1.5}
          />
          <input
            className="h-8 w-full rounded-lg border bg-background pr-3 pl-8 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            type="text"
            value={search}
          />
        </div>
        <SegmentedControl
          onChange={setFilter}
          segments={[
            { value: "all" as const, label: "All" },
            { value: "received" as const, label: "In" },
            { value: "sent" as const, label: "Out" },
          ]}
          value={filter}
        />
      </div>

      {sortedThreads.length > 0 && (
        <div className="pb-2 text-[10px] text-muted-foreground">
          {sortedThreads.length} thread
          {sortedThreads.length === 1 ? "" : "s"} · {filtered.length} message
          {filtered.length === 1 ? "" : "s"}
          {search && " matching"}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {visibleThreads.length === 0 && (
          <EmptyState
            message={search ? "No emails match your search" : "No emails found"}
          />
        )}

        {visibleThreads.map(([threadId, msgs]) => (
          <EmailThread
            key={threadId}
            leadEmail={leadEmail}
            msgs={msgs}
            onReply={startReply}
            openId={openId}
            setOpenId={setOpenId}
          />
        ))}

        {hasMoreThreads && (
          <button
            className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-muted-foreground text-xs transition-colors hover:bg-muted/30 hover:text-foreground"
            onClick={() => setShowCount((c) => c + INITIAL_EMAIL_COUNT)}
            type="button"
          >
            Show older threads ({sortedThreads.length - showCount} more)
          </button>
        )}
      </div>

      <InlineCompose
        composeBcc={composeBcc}
        composeBody={composeBody}
        composeCc={composeCc}
        composeSubject={composeSubject}
        isPending={sendEmail.isPending}
        leadName={leadName}
        onSend={handleQuickSend}
        replyCtx={replyCtx}
        resetCompose={resetCompose}
        setComposeBcc={setComposeBcc}
        setComposeBody={setComposeBody}
        setComposeCc={setComposeCc}
        setComposeSubject={setComposeSubject}
        setShowExtraFields={setShowExtraFields}
        showExtraFields={showExtraFields}
      />
    </div>
  );
}

// ── Thread card ─────────────────────────────────────────────────────────────
function EmailThread({
  msgs,
  leadEmail,
  openId,
  setOpenId,
  onReply,
}: {
  msgs: GmailMessage[];
  leadEmail: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onReply: (msg: GmailMessage) => void;
}) {
  const subject = msgs[0]?.subject || "(no subject)";
  const lastMsg = msgs.at(-1);

  return (
    <div className="rounded-xl border bg-card/30">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <HugeiconsIcon
          className="shrink-0 text-muted-foreground"
          icon={Mail01Icon}
          size={12}
          strokeWidth={1.5}
        />
        <span className="min-w-0 flex-1 truncate font-medium text-xs">
          {subject}
        </span>
        {msgs.length > 1 && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            {msgs.length}
          </span>
        )}
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {dayjs(Number(lastMsg?.internalDate ?? 0)).fromNow()}
        </span>
      </div>

      <div className="space-y-2 p-3">
        {msgs.map((msg) => (
          <EmailBubble
            expanded={openId === msg.id}
            key={msg.id}
            leadEmail={leadEmail}
            msg={msg}
            onReply={onReply}
            onToggle={() => setOpenId(openId === msg.id ? null : msg.id)}
          />
        ))}
      </div>

      {lastMsg && (
        <div className="border-t px-4 py-2">
          <button
            className="font-medium text-[11px] text-primary transition-colors hover:text-primary/80"
            onClick={() => onReply(lastMsg)}
            type="button"
          >
            Reply to thread
          </button>
        </div>
      )}
    </div>
  );
}

// ── Chat bubble ─────────────────────────────────────────────────────────────
function EmailBubble({
  msg,
  leadEmail,
  expanded,
  onToggle,
  onReply,
}: {
  msg: GmailMessage;
  leadEmail: string;
  expanded: boolean;
  onToggle: () => void;
  onReply: (msg: GmailMessage) => void;
}) {
  const received = isFromLead(msg.from, leadEmail);
  const sender = parseEmailName(msg.from);
  const ts = dayjs(Number(msg.internalDate));

  return (
    <div className={`flex ${received ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[88%] ${received ? "pr-6" : "pl-6"}`}>
        <button
          className={`w-full rounded-2xl px-3.5 py-2 text-left transition-colors ${
            received
              ? "rounded-bl-sm bg-muted/70 hover:bg-muted"
              : "rounded-br-sm bg-primary/10 hover:bg-primary/15"
          } ${expanded ? "ring-1 ring-ring/30" : ""}`}
          onClick={onToggle}
          type="button"
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full font-bold text-[8px] ${
                received
                  ? "bg-amber-50 text-amber-700"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {sender.charAt(0).toUpperCase()}
            </span>
            <span className="truncate font-medium text-[11px]">{sender}</span>
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
              {ts.format("h:mm A")}
            </span>
          </div>
          {!expanded && (
            <p className="mt-1 line-clamp-2 text-foreground/70 text-xs leading-relaxed">
              {decodeHtmlEntities(msg.snippet)}
            </p>
          )}
        </button>

        {expanded && (
          <div className="mt-1 rounded-xl border bg-background px-4 py-3">
            <div className="mb-2 space-y-0.5 text-[10px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-3">
                <span>{msg.from}</span>
                <span className="text-muted-foreground/40">→</span>
                <span>{msg.to}</span>
                <span className="ml-auto font-mono">
                  {ts.format("MMM D, YYYY h:mm A")}
                </span>
              </div>
              {msg.cc && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-muted-foreground/70">
                    CC
                  </span>
                  <span>{msg.cc}</span>
                </div>
              )}
              {msg.bcc && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-muted-foreground/70">
                    BCC
                  </span>
                  <span>{msg.bcc}</span>
                </div>
              )}
            </div>
            {msg.bodyHtml ? (
              <div
                className="max-h-72 overflow-y-auto text-[13px] leading-relaxed **:max-w-full [&_a]:text-primary [&_a]:underline [&_blockquote]:border-muted [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_img]:rounded"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: email HTML
                dangerouslySetInnerHTML={{
                  __html: stripQuotedHtml(msg.bodyHtml),
                }}
              />
            ) : (
              <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed">
                {stripQuotedText(msg.bodyText || msg.snippet)}
              </p>
            )}
            <div className="mt-2 flex justify-end border-t pt-2">
              <button
                className="rounded-md px-2.5 py-1 font-medium text-[11px] text-primary transition-colors hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(msg);
                }}
                type="button"
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline compose bar ──────────────────────────────────────────────────────
function InlineCompose({
  replyCtx,
  resetCompose,
  showExtraFields,
  setShowExtraFields,
  composeSubject,
  setComposeSubject,
  composeCc,
  setComposeCc,
  composeBcc,
  setComposeBcc,
  composeBody,
  setComposeBody,
  leadName,
  isPending,
  onSend,
}: {
  replyCtx: { subject: string } | null;
  resetCompose: () => void;
  showExtraFields: boolean;
  setShowExtraFields: (v: boolean) => void;
  composeSubject: string;
  setComposeSubject: (v: string) => void;
  composeCc: string;
  setComposeCc: (v: string) => void;
  composeBcc: string;
  setComposeBcc: (v: string) => void;
  composeBody: string;
  setComposeBody: (v: string) => void;
  leadName: string;
  isPending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="border-t pt-3">
      {replyCtx && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-[11px]">
          <span className="flex-1 truncate text-muted-foreground">
            Replying to:{" "}
            <span className="font-medium text-foreground">
              {replyCtx.subject}
            </span>
          </span>
          <button
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            onClick={resetCompose}
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      {showExtraFields && (
        <div className="mb-2 space-y-1.5">
          {!replyCtx && (
            <input
              className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Subject"
              type="text"
              value={composeSubject}
            />
          )}
          <input
            className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
            onChange={(e) => setComposeCc(e.target.value)}
            placeholder="CC (comma-separated emails)"
            type="text"
            value={composeCc}
          />
          <input
            className="h-8 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
            onChange={(e) => setComposeBcc(e.target.value)}
            placeholder="BCC (comma-separated emails)"
            type="text"
            value={composeBcc}
          />
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          className="block max-h-28 min-h-[36px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring"
          onChange={(e) => setComposeBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={
            replyCtx
              ? "Write your reply... (Cmd+Enter)"
              : `Message ${leadName}... (Cmd+Enter)`
          }
          rows={1}
          value={composeBody}
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
              showExtraFields
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            onClick={() => setShowExtraFields(!showExtraFields)}
            title="Subject, CC, BCC"
            type="button"
          >
            <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={1.5} />
          </button>
          <Button
            disabled={!composeBody.trim() || isPending}
            onClick={onSend}
            size="sm"
          >
            {isPending && "..."}
            {!isPending && replyCtx && "Reply"}
            {!(isPending || replyCtx) && "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
