"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BaseComponentProps, LeadListItem } from "../types";

export interface LeadListProps extends BaseComponentProps {
  leads: LeadListItem[];
  title?: string;
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function LeadListRenderer({ title, leads, className }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <Card
        className={className ?? "gap-0 overflow-hidden border bg-card py-0"}
      >
        {title && (
          <div className="border-b px-3 py-2">
            <p className="font-medium text-sm">{title}</p>
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
          <p className="font-medium text-sm">No leads found</p>
          <p className="text-muted-foreground text-xs">
            Try adjusting your search criteria
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className ?? "gap-0 overflow-hidden border bg-card py-0"}>
      {title && (
        <div className="border-b px-3 py-2">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-muted-foreground text-xs">
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
      <div className="divide-y">
        {leads.map((lead) => (
          <Link
            className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
            href={`/leads/${lead.id}`}
            key={lead.id}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs uppercase">
              {lead.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-sm group-hover:text-primary">
                  {lead.name}
                </span>
                {lead.company && (
                  <span className="hidden truncate text-muted-foreground text-xs sm:inline">
                    {lead.company}
                  </span>
                )}
              </div>
              <p className="truncate text-muted-foreground text-xs">
                {lead.email}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(lead.valueDollars ?? lead.value) ? (
                <span className="font-medium text-xs tabular-nums">
                  {formatDollars(
                    lead.valueDollars
                      ? lead.valueDollars * 100
                      : (lead.value ?? 0)
                  )}
                </span>
              ) : null}
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 font-medium text-[10px]",
                  STATUS_COLORS[lead.status] ?? "bg-muted text-muted-foreground"
                )}
              >
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
