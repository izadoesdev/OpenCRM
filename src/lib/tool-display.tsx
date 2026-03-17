import type { ReactNode } from "react";

type Input = Record<string, unknown>;
type Output = Record<string, unknown>;

function countArray(output: Output, key: string): number | null {
  const arr = output[key];
  return Array.isArray(arr) ? arr.length : null;
}

interface ToolConfig {
  label: (input: Input) => string;
  render?: (output: Output) => ReactNode | null;
  result: (output: Output) => string | null;
}

const TOOLS: Record<string, ToolConfig> = {
  createLead: {
    label: (input) => `Adding lead: ${input.name as string}`,
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      if (output.success) {
        return `Created ${output.name as string} (${output.email as string})`;
      }
      return null;
    },
  },
  queryLeads: {
    label: (input) => {
      if (input.search) {
        return `Searched leads for "${input.search}"`;
      }
      if (input.status) {
        return `Pulled ${input.status} leads`;
      }
      return "Pulled lead list";
    },
    result: (output) => {
      const count =
        countArray(output, "leads") ?? (output.count as number | null);
      return count !== null ? `${count} leads found` : null;
    },
  },
  getLeadDetails: {
    label: () => "Looked up lead details",
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      const name = output.name as string | undefined;
      const status = output.status as string | undefined;
      if (name && status) {
        return `${name} — ${status}`;
      }
      return name ?? null;
    },
  },
  updateLeadFields: {
    label: (input) => {
      const fields = Object.keys(input).filter((k) => k !== "leadId");
      if (fields.includes("status")) {
        return `Moved lead to ${input.status as string}`;
      }
      if (fields.includes("customFields")) {
        return "Tagged lead";
      }
      return `Updated ${fields.join(", ")}`;
    },
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      if (output.success) {
        const fields = output.updatedFields as string[] | undefined;
        return `Done — updated ${fields?.join(", ") ?? "lead"}`;
      }
      return null;
    },
  },
  scoreLead: {
    label: () => "Scored lead",
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      const score = output.score as number | undefined;
      const label = output.label as string | undefined;
      if (score !== undefined) {
        return `${score}/100 (${label})`;
      }
      return null;
    },
  },
  bulkUpdateStatus: {
    label: (input) => {
      const ids = input.leadIds as string[] | undefined;
      const status = input.status as string | undefined;
      return `Bulk-moved ${ids?.length ?? "?"} leads → ${status ?? "?"}`;
    },
    result: (output) => {
      if (output.success) {
        return `${output.updatedCount as number} leads updated`;
      }
      return null;
    },
  },
  getLeadCounts: {
    label: () => "Checked pipeline counts",
    result: (output) => {
      const total = output.all as number | undefined;
      if (total === undefined) {
        return null;
      }
      const parts: string[] = [`${total} total`];
      for (const status of [
        "new",
        "contacted",
        "interested",
        "demo",
        "negotiating",
        "converted",
      ]) {
        const count = output[status] as number | undefined;
        if (count) {
          parts.push(`${count} ${status}`);
        }
      }
      return parts.join(" · ");
    },
  },

  // ── Finance tools ──

  getFinancialOverview: {
    label: () => "Pulled financial overview",
    result: (output) => {
      const mrr = output.mrrCents as number | undefined;
      const burn = output.monthlyBurnCents as number | undefined;
      const runway = output.runwayMonths as number | null | undefined;
      const parts: string[] = [];
      if (mrr !== undefined) {
        parts.push(`$${(mrr / 100).toLocaleString()} MRR`);
      }
      if (burn !== undefined) {
        parts.push(`$${(burn / 100).toLocaleString()} burn`);
      }
      if (runway) {
        parts.push(`${runway} mo runway`);
      }
      return parts.length > 0 ? parts.join(" · ") : null;
    },
  },
  queryExpenses: {
    label: (input) => {
      if (input.type) {
        return `Pulled ${input.type} expenses`;
      }
      if (input.category) {
        return `Pulled ${input.category} expenses`;
      }
      return "Pulled expense list";
    },
    result: (output) => {
      const count = output.count as number | undefined;
      return count !== undefined ? `${count} expenses` : null;
    },
  },
  createExpense: {
    label: (input) => `Adding expense: ${input.name as string}`,
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      if (output.success) {
        const dollars = output.amountDollars as number;
        return `Created ($${dollars})`;
      }
      return null;
    },
  },
  updateExpense: {
    label: () => "Updated expense",
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      if (output.success) {
        const fields = output.updatedFields as string[] | undefined;
        return `Done. Updated ${fields?.join(", ") ?? "expense"}`;
      }
      return null;
    },
  },
  deleteExpense: {
    label: () => "Deleted expense",
    result: (output) => {
      if (output.error) {
        return `Error: ${output.error as string}`;
      }
      if (output.success) {
        return `Removed ${output.deletedName as string}`;
      }
      return null;
    },
  },
  updateCashOnHand: {
    label: () => "Updated cash on hand",
    result: (output) => {
      if (output.success) {
        const dollars = output.cashOnHandDollars as number;
        return `Set to $${dollars.toLocaleString()}`;
      }
      return null;
    },
  },
  getExpensesByCategory: {
    label: () => "Pulled category breakdown",
    result: (output) => {
      const categories = output.categories as
        | Array<{ category: string }>
        | undefined;
      return categories ? `${categories.length} categories` : null;
    },
  },

  // ── Calendar tools ──

  listUpcomingEvents: {
    label: (input) => {
      const max = input.maxResults as number | undefined;
      return max ? `Checking next ${max} events` : "Checking calendar";
    },
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const count = output.count as number | undefined;
      return count !== undefined ? `${count} upcoming events` : null;
    },
  },
  searchCalendarEvents: {
    label: (input) => {
      const q = input.query as string | undefined;
      return q ? `Searching calendar for "${q}"` : "Searching calendar";
    },
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const count = output.count as number | undefined;
      return count !== undefined ? `${count} events found` : null;
    },
  },
  getCalendarEvent: {
    label: () => "Getting event details",
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const summary = output.summary as string | undefined;
      return summary ?? null;
    },
  },
  createCalendarEvent: {
    label: (input) => `Creating event: ${input.summary as string}`,
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      if (output.success) {
        const parts = ["Event created"];
        if (output.meetLink) {
          parts.push("(Meet link included)");
        }
        return parts.join(" ");
      }
      return null;
    },
  },
  updateCalendarEvent: {
    label: (input) => {
      const summary = input.summary as string | undefined;
      return summary ? `Updating event: ${summary}` : "Updating calendar event";
    },
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      if (output.success) {
        const summary = output.summary as string | undefined;
        return summary ? `Updated: ${summary}` : "Event updated";
      }
      return null;
    },
  },
  addCalendarAttendees: {
    label: (input) => {
      const emails = input.emails as string[] | undefined;
      return `Adding ${emails?.length ?? "?"} attendee(s)`;
    },
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      if (output.success) {
        return `${output.addedCount as number} added (${output.totalAttendees as number} total)`;
      }
      return null;
    },
  },
  deleteCalendarEvent: {
    label: () => "Deleting calendar event",
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      return output.success ? "Event deleted" : null;
    },
  },

  // ── Gmail tools ──

  searchEmails: {
    label: (input) => {
      const q = input.query as string;
      if (q.length > 40) {
        return `Searching emails: ${q.slice(0, 37)}...`;
      }
      return `Searching emails: ${q}`;
    },
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const count = output.count as number | undefined;
      return count !== undefined ? `${count} messages found` : null;
    },
  },
  readMessage: {
    label: () => "Reading email",
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const subject = output.subject as string | undefined;
      return subject ?? null;
    },
  },
  readEmailThread: {
    label: () => "Reading email thread",
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const count = output.count as number | undefined;
      return count !== undefined ? `${count} messages in thread` : null;
    },
  },
  getMyEmailStyle: {
    label: () => "Studying your email style",
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      const count = output.count as number | undefined;
      return count !== undefined ? `Analyzed ${count} sent emails` : null;
    },
  },
  sendLeadEmail: {
    label: (input) => `Sending email: ${input.subject as string}`,
    result: (output) => {
      if (output.error) {
        return output.error as string;
      }
      if (output.success) {
        return `Sent to ${output.to as string}`;
      }
      return null;
    },
  },
};

export function formatToolLabel(toolName: string, input: Input): string {
  const config = TOOLS[toolName];
  return config ? config.label(input) : prettifyToolName(toolName);
}

export function formatToolResult(
  toolName: string,
  output: unknown
): string | null {
  const parsed = parseOutput(output);
  if (!parsed) {
    return null;
  }

  if ("errorText" in parsed && typeof parsed.errorText === "string") {
    return `Error: ${parsed.errorText}`;
  }

  const config = TOOLS[toolName];
  return config ? config.result(parsed) : null;
}

export function formatToolOutput(
  toolName: string,
  output: unknown
): ReactNode | null {
  const parsed = parseOutput(output);
  if (!parsed) {
    return null;
  }

  if ("errorText" in parsed && typeof parsed.errorText === "string") {
    return (
      <p className="text-destructive text-xs">Error: {parsed.errorText}</p>
    );
  }

  const config = TOOLS[toolName];
  if (config?.render) {
    return config.render(parsed);
  }

  return null;
}

function parseOutput(output: unknown): Output | null {
  if (typeof output === "string") {
    try {
      return JSON.parse(output) as Output;
    } catch {
      return null;
    }
  }
  if (typeof output === "object" && output !== null) {
    return output as Output;
  }
  return null;
}

const TOOL_PREFIX_REGEX = /^tool-(invocation|result)-/;
const CAMEL_CASE_REGEX = /([A-Z])/g;
const SEPARATOR_REGEX = /[-_]/g;

function prettifyToolName(raw: string): string {
  const name = raw
    .replace(TOOL_PREFIX_REGEX, "")
    .replace(CAMEL_CASE_REGEX, " $1")
    .replace(SEPARATOR_REGEX, " ")
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
