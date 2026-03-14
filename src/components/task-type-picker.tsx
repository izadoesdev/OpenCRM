"use client";

import {
  CallIcon,
  LinkSquare01Icon,
  Mail01Icon,
  PresentationBarChart01Icon,
  RepeatIcon,
  Task01Icon,
  VideoReplayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RECURRENCE_LABELS,
  TASK_TYPE_COLORS,
  TASK_TYPE_LABELS,
  TASK_TYPES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof Task01Icon> = {
  follow_up: Task01Icon,
  call: CallIcon,
  email: Mail01Icon,
  meeting: VideoReplayIcon,
  demo: PresentationBarChart01Icon,
  linkedin: LinkSquare01Icon,
  other: RepeatIcon,
};

export function TaskTypePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (type: string) => void;
  className?: string;
}) {
  const Icon = TYPE_ICONS[value] ?? Task01Icon;
  const colorClass =
    TASK_TYPE_COLORS[value] ?? "bg-muted text-muted-foreground";
  const label = TASK_TYPE_LABELS[value] ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              "flex h-8 items-center gap-2 rounded-lg border bg-transparent px-2.5 text-left text-xs transition-colors hover:bg-muted/40",
              className
            )}
            type="button"
          />
        }
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-md p-0.5",
            colorClass
          )}
        >
          <HugeiconsIcon icon={Icon} size={12} strokeWidth={1.5} />
        </span>
        <span className="flex-1 truncate">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {TASK_TYPES.map((t) => {
          const TIcon = TYPE_ICONS[t] ?? Task01Icon;
          const tColor =
            TASK_TYPE_COLORS[t] ?? "bg-muted text-muted-foreground";
          return (
            <DropdownMenuItem key={t} onClick={() => onChange(t)}>
              <span
                className={cn(
                  "flex items-center justify-center rounded-md p-0.5",
                  tColor
                )}
              >
                <HugeiconsIcon icon={TIcon} size={12} strokeWidth={1.5} />
              </span>
              {TASK_TYPE_LABELS[t] ?? t}
              {value === t && (
                <span className="ml-auto text-[10px] text-primary">·</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TaskTypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] ?? Task01Icon;
  const colorClass = TASK_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground";
  const label = TASK_TYPE_LABELS[type] ?? type;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] uppercase",
        colorClass
      )}
    >
      <HugeiconsIcon icon={Icon} size={9} strokeWidth={2} />
      {label}
    </span>
  );
}

export function RecurrenceBadge({ recurrence }: { recurrence: string | null }) {
  if (!recurrence) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] text-violet-400 uppercase">
      <HugeiconsIcon icon={RepeatIcon} size={8} strokeWidth={2} />
      {RECURRENCE_LABELS[recurrence] ?? recurrence}
    </span>
  );
}
