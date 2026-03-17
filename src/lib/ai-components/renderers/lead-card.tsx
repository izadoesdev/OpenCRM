"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SOURCE_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BaseComponentProps } from "../types";

export interface LeadCardProps extends BaseComponentProps {
  company?: string | null;
  createdAt?: string;
  email: string;
  id: string;
  name: string;
  plan?: string | null;
  score?: number;
  scoreLabel?: string;
  source?: string;
  status: string;
  value?: number;
  valueDollars?: number;
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const SCORE_COLORS: Record<string, string> = {
  Hot: "text-emerald-600",
  Warm: "text-amber-600",
  Cold: "text-blue-600",
};

export function LeadCardRenderer({
  id,
  name,
  email,
  company,
  status,
  value,
  valueDollars,
  source,
  plan,
  score,
  scoreLabel,
  createdAt,
  className,
}: LeadCardProps) {
  let dollars: string | null = null;
  if (valueDollars !== undefined) {
    dollars = formatDollars(valueDollars * 100);
  } else if (value) {
    dollars = formatDollars(value);
  }

  return (
    <Card
      className={
        className ??
        "gap-0 overflow-hidden border bg-card p-0 transition-colors hover:border-border"
      }
    >
      <Link className="block p-3" href={`/leads/${id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[10px] text-muted-foreground uppercase">
                {name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{name}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {email}
                </p>
              </div>
            </div>
          </div>
          <span
            className={cn(
              "mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 font-medium text-[10px]",
              STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"
            )}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {company && (
            <div>
              <span className="text-muted-foreground">Company</span>
              <p className="truncate font-medium">{company}</p>
            </div>
          )}
          {dollars && (
            <div>
              <span className="text-muted-foreground">Deal Value</span>
              <p className="font-medium tabular-nums">{dollars}</p>
            </div>
          )}
          {source && (
            <div>
              <span className="text-muted-foreground">Source</span>
              <p className="font-medium">{SOURCE_LABELS[source] ?? source}</p>
            </div>
          )}
          {plan && (
            <div>
              <span className="text-muted-foreground">Plan</span>
              <p className="font-medium capitalize">{plan}</p>
            </div>
          )}
          {score !== undefined && (
            <div>
              <span className="text-muted-foreground">Score</span>
              <p
                className={cn(
                  "font-medium tabular-nums",
                  scoreLabel ? SCORE_COLORS[scoreLabel] : ""
                )}
              >
                {score}/100{scoreLabel ? ` (${scoreLabel})` : ""}
              </p>
            </div>
          )}
          {createdAt && (
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium">
                {new Date(createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
