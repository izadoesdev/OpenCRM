"use client";

import Link from "next/link";
import { useState } from "react";
import { Pill, UserAvatar } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-skeleton";
import {
  LEAD_STATUSES,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import { useChangeLeadStatus, useLeads } from "@/lib/queries";
import { formatCents } from "@/lib/utils";

export function PipelineClient() {
  const { data: leads = [], isLoading } = useLeads();
  const changeStatus = useChangeLeadStatus();
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

    changeStatus.mutate({ leadId, status: targetStatus });
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, leadId: string) {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader>
          <h1 className="font-semibold text-lg tracking-tight">Pipeline</h1>
        </PageHeader>
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              className="w-72 shrink-0 animate-pulse rounded-sm border bg-card/50"
              key={`skel-${
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                i
              }`}
            >
              <div className="border-b px-3 py-2.5">
                <div className="h-4 w-20 rounded bg-muted/60" />
              </div>
              <div className="space-y-2 p-2">
                <div className="h-16 rounded-md bg-muted/40" />
                <div className="h-16 rounded-md bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isDragging = !!draggedLeadId;
  const draggedLead = isDragging
    ? leads.find((l) => l.id === draggedLeadId)
    : null;

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <h1 className="font-semibold text-lg tracking-tight">Pipeline</h1>
      </PageHeader>

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
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
              <div className="flex items-center justify-between border-b px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${STATUS_DOT_COLORS[col.status]}`}
                  />
                  <span className="font-medium text-xs">{col.label}</span>
                </div>
                <Pill>{col.leads.length}</Pill>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
                {col.leads.length === 0 && <EmptyState message="No leads" />}
                {col.leads.map((lead) => (
                  <div
                    className={`cursor-grab rounded-md border bg-background p-3 transition-all hover:border-border hover:bg-muted/30 active:cursor-grabbing ${
                      draggedLeadId === lead.id ? "scale-95 opacity-40" : ""
                    }`}
                    draggable
                    key={lead.id}
                    onDragEnd={() => setDraggedLeadId(null)}
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                  >
                    <Link className="block" href={`/leads/${lead.id}`}>
                      <div className="flex items-center gap-2">
                        <UserAvatar name={lead.name} size="sm" />
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
                              {formatCents(lead.value)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {dayjs(lead.createdAt).fromNow()}
                        </span>
                        {lead.assignedUser && (
                          <UserAvatar name={lead.assignedUser.name} size="xs" />
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
