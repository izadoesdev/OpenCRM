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

export function formatCents(cents: number): string {
  if (cents === 0) {
    return "—";
  }
  return `$${(cents / 100).toLocaleString()}`;
}

const RE_PROTOCOL = /^https?:\/\/(www\.)?/;
const RE_TRAILING_SLASH = /\/$/;

export function formatWebsite(url: string): string {
  return url.replace(RE_PROTOCOL, "").replace(RE_TRAILING_SLASH, "");
}

export function defaultDueDate(): string {
  return dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm");
}
