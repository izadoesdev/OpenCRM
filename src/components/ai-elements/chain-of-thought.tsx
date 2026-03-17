"use client";

import {
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, memo, useContext, useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null
);

const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    defaultOpen = false,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const chainOfThoughtContext = useMemo(
      () => ({ isOpen, setIsOpen }),
      [isOpen]
    );

    return (
      <ChainOfThoughtContext.Provider value={chainOfThoughtContext}>
        <div
          className={cn("not-prose max-w-prose space-y-1", className)}
          {...props}
        >
          {children}
        </div>
      </ChainOfThoughtContext.Provider>
    );
  }
);

export type ChainOfThoughtHeaderProps = ComponentProps<
  typeof CollapsibleTrigger
>;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfThought();

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between gap-2 py-1 text-left text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          {...props}
        >
          <span className="flex items-center gap-2">
            <HugeiconsIcon
              className="shrink-0 opacity-70"
              icon={Settings02Icon}
              size={14}
              strokeWidth={1.5}
            />
            <span>{children ?? "Processing"}</span>
          </span>
          <HugeiconsIcon
            className={cn(
              "shrink-0 opacity-60 transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
            icon={ArrowDown01Icon}
            size={14}
            strokeWidth={1.5}
          />
        </CollapsibleTrigger>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  label: ReactNode;
  description?: ReactNode;
  status?: "complete" | "active" | "pending";
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 py-1.5 text-sm",
          "fade-in-0 slide-in-from-top-1 animate-in",
          className
        )}
        {...props}
      >
        {status === "complete" ? (
          <HugeiconsIcon
            className="mt-0.5 shrink-0 text-primary"
            icon={CheckmarkCircle01Icon}
            size={14}
            strokeWidth={1.5}
          />
        ) : (
          <HugeiconsIcon
            className="mt-0.5 shrink-0 animate-spin text-muted-foreground"
            icon={Loading03Icon}
            size={14}
            strokeWidth={2}
          />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="text-foreground">{label}</span>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
          {children && (
            <div className="pt-0.5 text-muted-foreground text-xs">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent className={cn(className)} {...props}>
          <div className="space-y-0.5 pl-5">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
