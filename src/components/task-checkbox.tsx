"use client";

import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function TaskCheckbox({
  checked,
  onChange,
  size = "sm",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) {
  const px = size === "md" ? "size-[18px]" : "size-4";

  return (
    <button
      className={`mt-0.5 flex ${px} shrink-0 cursor-pointer items-center justify-center rounded-[5px] border transition-all duration-150 ${
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-muted-foreground/30 hover:border-emerald-500/50 hover:bg-emerald-500/10"
      }`}
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
