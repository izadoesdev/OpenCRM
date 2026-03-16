"use client";

import {
  ArrowDown01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { isValidElement, useState } from "react";
import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";

export type ToolPart = ToolUIPart | DynamicToolUIPart;

const STATUS_CONFIG: Record<
  ToolPart["state"],
  {
    label: string;
    icon: typeof Clock01Icon;
    className: string;
    spinning?: boolean;
  }
> = {
  "input-streaming": {
    label: "Pending",
    icon: Clock01Icon,
    className: "text-muted-foreground",
  },
  "input-available": {
    label: "Running",
    icon: RepeatIcon,
    className: "text-blue-600",
    spinning: true,
  },
  "approval-requested": {
    label: "Awaiting Approval",
    icon: Clock01Icon,
    className: "text-amber-600",
  },
  "approval-responded": {
    label: "Responded",
    icon: CheckmarkCircle01Icon,
    className: "text-blue-600",
  },
  "output-available": {
    label: "Done",
    icon: CheckmarkCircle01Icon,
    className: "text-emerald-600",
  },
  "output-denied": {
    label: "Denied",
    icon: Cancel01Icon,
    className: "text-amber-600",
  },
  "output-error": {
    label: "Error",
    icon: Cancel01Icon,
    className: "text-red-600",
  },
};

function prettifyToolName(raw: string): string {
  const name = raw
    .replace(/^tool-(invocation|result)-/, "")
    .replace(/[-_]/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function ToolCall({
  type,
  state,
  toolName,
  input,
  output,
  errorText,
  className,
}: {
  type: string;
  state: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const typedState = state as ToolPart["state"];
  const config = STATUS_CONFIG[typedState] ?? STATUS_CONFIG["input-available"];
  const derivedName =
    type === "dynamic-tool" ? (toolName ?? "Tool") : prettifyToolName(type);

  const hasDetails = input != null || output != null || errorText;

  return (
    <div className={cn("rounded-lg border bg-muted/20 text-[13px]", className)}>
      <button
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
          hasDetails && "cursor-pointer hover:bg-muted/40"
        )}
        disabled={!hasDetails}
        onClick={() => hasDetails && setExpanded(!expanded)}
        type="button"
      >
        <HugeiconsIcon
          className={cn(config.className, config.spinning && "animate-spin")}
          icon={config.icon}
          size={13}
          strokeWidth={2}
        />
        <span className="min-w-0 flex-1 truncate font-medium text-xs">
          {derivedName}
        </span>
        <span className={cn("shrink-0 text-[10px]", config.className)}>
          {config.label}
        </span>
        {hasDetails && (
          <HugeiconsIcon
            className={cn(
              "shrink-0 text-muted-foreground/50 transition-transform",
              expanded && "rotate-180"
            )}
            icon={ArrowDown01Icon}
            size={12}
            strokeWidth={1.5}
          />
        )}
      </button>

      {expanded && hasDetails && (
        <div className="space-y-2 border-t px-3 pt-2 pb-2.5">
          {input != null && (
            <ToolSection label="Input">
              <CodeBlock
                code={
                  typeof input === "string"
                    ? input
                    : JSON.stringify(input, null, 2)
                }
                language="json"
              />
            </ToolSection>
          )}
          {errorText && (
            <ToolSection label="Error">
              <div className="rounded-md bg-red-500/5 px-3 py-2 text-red-600 text-xs">
                {errorText}
              </div>
            </ToolSection>
          )}
          {output != null && !errorText && (
            <ToolSection label="Result">
              <ToolOutputDisplay output={output} />
            </ToolSection>
          )}
        </div>
      )}
    </div>
  );
}

function ToolSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="max-h-48 overflow-auto rounded-md bg-muted/30">
        {children}
      </div>
    </div>
  );
}

function ToolOutputDisplay({ output }: { output: unknown }) {
  if (typeof output === "object" && !isValidElement(output)) {
    return <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />;
  }
  if (typeof output === "string") {
    return <CodeBlock code={output} language="json" />;
  }
  return <div className="px-3 py-2 text-xs">{output as ReactNode}</div>;
}

// Keep old exports for backward compat (agent-chat-drawer uses them)
export type ToolProps = ComponentProps<"div">;
export const Tool = ({ className, children, ...props }: ToolProps) => (
  <div className={cn("mb-2", className)} {...props}>
    {children}
  </div>
);

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart["type"]; state: ToolUIPart["state"]; toolName?: never }
  | {
      type: DynamicToolUIPart["type"];
      state: DynamicToolUIPart["state"];
      toolName: string;
    }
);

export const ToolHeader = (_props: ToolHeaderProps) => null;

export type ToolContentProps = HTMLAttributes<HTMLDivElement>;
export const ToolContent = (_props: ToolContentProps) => null;

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolPart["input"];
};
export const ToolInput = (_props: ToolInputProps) => null;

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolPart["output"];
  errorText: ToolPart["errorText"];
};
export const ToolOutput = (_props: ToolOutputProps) => null;
