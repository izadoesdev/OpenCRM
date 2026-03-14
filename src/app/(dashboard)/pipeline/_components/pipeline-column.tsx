"use client";

import { useDroppable } from "@dnd-kit/core";
import { Pill } from "@/components/micro";
import { STATUS_DOT_COLORS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PipelineColumn({
  status,
  count,
  isOver,
  children,
}: {
  status: string;
  count: number;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border transition-all duration-200",
        isOver
          ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20"
          : "bg-card/50"
      )}
      ref={setNodeRef}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2 rounded-full", STATUS_DOT_COLORS[status])}
          />
          <span className="font-medium text-[13px]">
            {STATUS_LABELS[status]}
          </span>
        </div>
        <Pill>{count}</Pill>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {children}
      </div>
    </div>
  );
}
