"use client";

import { cn } from "@/lib/utils";

interface Segment<T extends string> {
  label: string;
  value: T;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-lg border bg-muted/30 p-0.5", className)}>
      {segments.map((s) => (
        <button
          className={cn(
            "rounded-md px-2.5 py-1 text-xs transition-all",
            value === s.value
              ? "bg-background font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
          key={s.value}
          onClick={() => onChange(s.value)}
          type="button"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
