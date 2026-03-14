"use client";

import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { StatusDot } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACTIVE_LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";

export function BulkActionsBar({
  count,
  onStatusChange,
  onArchive,
  onClear,
}: {
  count: number;
  onStatusChange: (status: string) => void;
  onArchive: () => void;
  onClear: () => void;
}) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
      <span className="font-medium text-sm">{count} selected</span>
      <div className="h-4 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          Change Status
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {ACTIVE_LEAD_STATUSES.map((s) => (
            <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
              <StatusDot status={s} />
              {STATUS_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={onArchive} size="sm" variant="outline">
        <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
        Archive
      </Button>
      <button
        className="ml-1 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        onClick={onClear}
        type="button"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
