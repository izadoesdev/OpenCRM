"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { LeadRow } from "@/lib/actions/leads";
import { changeLeadStatus } from "@/lib/actions/status";
import { LEAD_STATUSES, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatValue(cents: number): string {
  if (cents === 0) {
    return "";
  }
  return `$${(cents / 100).toLocaleString()}`;
}

export function PipelineClient({ leads }: { leads: LeadRow[] }) {
  const [, startTransition] = useTransition();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const columns = LEAD_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    leads: leads.filter((l) => l.status === status),
  }));

  function handleDrop(
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: string
  ) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    setDraggedLeadId(null);
    if (!leadId) {
      return;
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStatus) {
      return;
    }

    startTransition(() => changeLeadStatus(leadId, targetStatus));
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, leadId: string) {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  }

  function handleDragEnd() {
    setDraggedLeadId(null);
  }

  const isDragging = !!draggedLeadId;
  const draggedLead = isDragging
    ? leads.find((l) => l.id === draggedLeadId)
    : null;

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Separator className="h-5" orientation="vertical" />
        <h1 className="font-semibold text-lg tracking-tight">Pipeline</h1>
      </header>

      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {columns.map((col) => {
          const isSameColumn = draggedLead?.status === col.status;

          return (
            <div
              className={`flex w-72 shrink-0 flex-col rounded-sm border transition-colors ${
                isDragging && !isSameColumn
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "bg-card/50"
              }`}
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider ${STATUS_COLORS[col.status]}`}
                >
                  {col.label}
                </span>
                <span className="font-mono text-muted-foreground text-xs">
                  {col.leads.length}
                </span>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
                {col.leads.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground text-xs">
                    No leads
                  </p>
                )}
                {col.leads.map((lead) => (
                  <div
                    className={`cursor-grab rounded-sm border bg-background p-2.5 transition-colors hover:bg-muted/30 active:cursor-grabbing ${
                      draggedLeadId === lead.id ? "opacity-50" : ""
                    }`}
                    draggable
                    key={lead.id}
                    onDragEnd={handleDragEnd}
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                  >
                    <Link className="block" href={`/leads/${lead.id}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium text-sm">
                          {lead.name}
                        </span>
                      </div>
                      {(lead.company || lead.value > 0) && (
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="truncate text-muted-foreground text-xs">
                            {lead.company ?? ""}
                          </span>
                          {lead.value > 0 && (
                            <span className="font-mono text-xs">
                              {formatValue(lead.value)}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
