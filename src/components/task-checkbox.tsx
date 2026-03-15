"use client";

import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function TaskCheckbox({
  checked,
  onChange,
  size = "sm",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "mt-0.5 flex shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
        size === "md" ? "size-[18px]" : "size-4",
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-muted-foreground/30 hover:border-emerald-500/50 hover:bg-emerald-50"
      )}
      onClick={onChange}
      type="button"
    >
      {checked && (
        <HugeiconsIcon
          icon={Tick01Icon}
          size={size === "md" ? 12 : 10}
          strokeWidth={2.5}
        />
      )}
    </button>
  );
}
