import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "@/lib/dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
};

export function formatCents(cents: number, currency = "USD"): string {
  if (cents === 0) {
    return "—";
  }
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";
  return `${symbol}${(cents / 100).toLocaleString()}`;
}

const RE_PROTOCOL = /^https?:\/\/(www\.)?/;
const RE_TRAILING_SLASH = /\/$/;

export function formatWebsite(url: string): string {
  return url.replace(RE_PROTOCOL, "").replace(RE_TRAILING_SLASH, "");
}

export function defaultDueDate(): string {
  return dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm");
}

export function getDueLabel(
  dueAt: Date,
  completed: boolean
): { text: string; className: string } {
  if (completed) {
    return { text: "Done", className: "text-muted-foreground" };
  }
  const d = dayjs(dueAt);
  const rel = d.fromNow();
  if (d.isToday()) {
    return {
      text: `Today · ${d.format("h:mm A")} · ${rel}`,
      className: "text-amber-400",
    };
  }
  if (d.isBefore(dayjs(), "minute")) {
    return {
      text: `Overdue · ${d.format("MMM D")} · ${rel}`,
      className: "text-red-400",
    };
  }
  if (d.isTomorrow()) {
    return {
      text: `Tomorrow · ${d.format("h:mm A")} · ${rel}`,
      className: "text-blue-400",
    };
  }
  return {
    text: `${d.format("MMM D · h:mm A")} · ${rel}`,
    className: "text-muted-foreground",
  };
}

export function isMeetingType(type: string): boolean {
  return type === "meeting" || type === "demo";
}

export function getLeadLocalTime(
  dueAt: Date,
  leadTimezone: string | null | undefined
): string | null {
  if (!leadTimezone) {
    return null;
  }
  return dayjs(dueAt).tz(leadTimezone).format("h:mm A");
}

export function getLeadLocalLabel(
  leadTimezone: string | null | undefined
): string | null {
  if (!leadTimezone) {
    return null;
  }
  const short =
    leadTimezone.split("/").pop()?.replace(/_/g, " ") ?? leadTimezone;
  return short;
}
