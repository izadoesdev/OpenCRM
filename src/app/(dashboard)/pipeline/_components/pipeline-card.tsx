"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { UserAvatar } from "@/components/micro";
import type { LeadRow } from "@/lib/actions/leads";
import dayjs from "@/lib/dayjs";
import { cn, formatCents } from "@/lib/utils";

interface PipelineCardProps {
  isDragOverlay?: boolean;
  lead: LeadRow & { assignedUser?: { name: string } | null };
}

export function PipelineCard({ lead, isDragOverlay }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  if (isDragOverlay) {
    return <PipelineCardContent isOverlay lead={lead} />;
  }

  return (
    <div
      className={cn("touch-none", isDragging && "z-10 opacity-40")}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <PipelineCardContent lead={lead} />
    </div>
  );
}

function PipelineCardContent({
  lead,
  isOverlay,
}: {
  lead: PipelineCardProps["lead"];
  isOverlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3 transition-colors",
        isOverlay
          ? "rotate-2 ring-1 ring-primary/30"
          : "cursor-grab hover:bg-muted/30 active:cursor-grabbing"
      )}
    >
      <Link
        className="block"
        draggable={false}
        href={`/leads/${lead.id}`}
        onClick={(e) => {
          if (isOverlay) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <UserAvatar name={lead.name} size="sm" />
          <span className="truncate font-medium text-[13px]">{lead.name}</span>
        </div>

        {(lead.company || lead.value > 0) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-muted-foreground text-xs">
              {lead.company ?? ""}
            </span>
            {lead.value > 0 && (
              <span className="shrink-0 font-mono text-xs tabular-nums">
                {formatCents(lead.value)}
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {dayjs(lead.createdAt).fromNow()}
          </span>
          {lead.assignedUser && (
            <UserAvatar name={lead.assignedUser.name} size="xs" />
          )}
        </div>
      </Link>
    </div>
  );
}
