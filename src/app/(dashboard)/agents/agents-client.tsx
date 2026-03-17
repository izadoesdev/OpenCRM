"use client";

import { useChat } from "@ai-sdk/react";
import {
  ArrowRight01Icon,
  Loading03Icon,
  NeuralNetworkIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { AIComponent } from "@/components/ai-elements/ai-component";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PageHeader } from "@/components/page-header";
import { parseContentSegments } from "@/lib/ai-components";
import {
  formatToolLabel,
  formatToolOutput,
  formatToolResult,
} from "@/lib/tool-display";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Review all new leads and score them",
  "What's our burn rate and runway?",
  "Show me leads stuck in 'contacted' for over 2 weeks",
  "Break down expenses by category",
  "Give me a pipeline overview",
  "What's our MRR?",
];

type MessagePart = UIMessage["parts"][number];

type ToolMessagePart = MessagePart & {
  type: string;
  toolName?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state?: string;
  errorText?: string;
  preliminary?: boolean;
};

function isToolPart(part: MessagePart): part is ToolMessagePart {
  return part.type?.startsWith("tool-") ?? false;
}

const TOOL_PREFIX_REGEX = /^tool-/;

function getToolName(part: ToolMessagePart): string {
  return part.toolName ?? part.type.replace(TOOL_PREFIX_REGEX, "");
}

function getToolOutput(part: MessagePart): unknown {
  if (isToolPart(part)) {
    return part.output;
  }
  return undefined;
}

function getReasoningText(part: MessagePart): string {
  const reasoning = part as { text?: string; content?: string };
  return reasoning.text || reasoning.content || "";
}

function groupConsecutiveToolCalls(parts: MessagePart[]) {
  const grouped: Array<MessagePart | MessagePart[]> = [];
  let currentToolGroup: MessagePart[] = [];

  for (const part of parts) {
    if (part.type?.includes("tool")) {
      currentToolGroup.push(part);
    } else {
      if (currentToolGroup.length > 0) {
        grouped.push(
          currentToolGroup.length === 1 ? currentToolGroup[0] : currentToolGroup
        );
        currentToolGroup = [];
      }
      grouped.push(part);
    }
  }

  if (currentToolGroup.length > 0) {
    grouped.push(
      currentToolGroup.length === 1 ? currentToolGroup[0] : currentToolGroup
    );
  }

  return grouped;
}

function hasTextContent(message: UIMessage): boolean {
  return message.parts.some(
    (p) => p.type === "text" && (p as { text: string }).text.trim().length > 0
  );
}

function buildToolSummary(
  toolName: string,
  input: Record<string, unknown>,
  output: unknown
): string {
  const label = formatToolLabel(toolName, input);
  const result = formatToolResult(toolName, output);
  return result ? `${label} → ${result}` : label;
}

function renderMessagePart(
  part: MessagePart | MessagePart[],
  partIndex: number,
  messageId: string,
  isLastMessage: boolean,
  isStreaming: boolean,
  role: UIMessage["role"]
) {
  const key = `${messageId}-${partIndex}`;
  const isCurrentlyStreaming = isLastMessage && isStreaming;
  const mode =
    role === "user" || !isCurrentlyStreaming ? "static" : "streaming";

  if (Array.isArray(part)) {
    const steps = part.map((p) => {
      const name = getToolName(p as ToolMessagePart);
      const input = (p as ToolMessagePart).input ?? {};
      const output = getToolOutput(p);
      return {
        name,
        input,
        output,
        summary: buildToolSummary(name, input, output),
      };
    });

    const uniqueLabels = [
      ...new Set(steps.map((s) => formatToolLabel(s.name, s.input))),
    ];
    const headerText =
      uniqueLabels.length === 1
        ? uniqueLabels[0]
        : uniqueLabels.slice(0, 3).join(", ");

    return (
      <ChainOfThought className="my-2" key={key}>
        <ChainOfThoughtHeader>{headerText}</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          {steps.map((step) => (
            <ChainOfThoughtStep
              key={`${key}-${step.name}`}
              label={step.summary}
              status="complete"
            >
              {formatToolOutput(step.name, step.output)}
            </ChainOfThoughtStep>
          ))}
        </ChainOfThoughtContent>
      </ChainOfThought>
    );
  }

  if (part.type === "reasoning") {
    const text = getReasoningText(part);
    if (!text.trim()) {
      return null;
    }
    return (
      <Reasoning
        defaultOpen={isCurrentlyStreaming}
        isStreaming={isCurrentlyStreaming}
        key={key}
      >
        <ReasoningTrigger />
        <ReasoningContent>{text}</ReasoningContent>
      </Reasoning>
    );
  }

  if (part.type === "text") {
    const textPart = part as { text: string };
    if (!textPart.text?.trim()) {
      return null;
    }

    const { segments } = parseContentSegments(textPart.text);
    if (segments.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4" key={key}>
        {segments.map((segment) => {
          const segKey =
            segment.type === "text"
              ? `${key}-text-${typeof segment.content === "string" ? segment.content.slice(0, 20) : ""}`
              : `${key}-cmp-${segment.content.type}`;
          if (segment.type === "text") {
            return (
              <MessageResponse
                isAnimating={isCurrentlyStreaming}
                key={segKey}
                mode={mode}
              >
                {segment.content}
              </MessageResponse>
            );
          }
          return <AIComponent input={segment.content} key={segKey} />;
        })}
      </div>
    );
  }

  if (part.type?.includes("tool")) {
    const toolName = getToolName(part as ToolMessagePart);
    const toolInput = (part as ToolMessagePart).input ?? {};
    const summary = buildToolSummary(toolName, toolInput, getToolOutput(part));
    return (
      <ChainOfThoughtStep
        className="my-2"
        key={key}
        label={summary}
        status="complete"
      />
    );
  }

  return null;
}

export function AgentsClient() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasError = status === "error";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) {
      return;
    }
    sendMessage({ text: message.text });
    setInput("");
  };

  const handleExampleClick = (example: string) => {
    sendMessage({ text: example });
  };

  const lastMessage = messages.at(-1);
  const lastAssistantHasText =
    lastMessage?.role === "assistant" && hasTextContent(lastMessage);
  const showStreamingIndicator = isStreaming && !lastAssistantHasText;

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <h1 className="font-semibold text-lg tracking-tight">AI Agent</h1>
        {messages.length > 0 && (
          <button
            className="font-mono text-[11px] text-muted-foreground tabular-nums hover:text-foreground"
            onClick={() => setMessages([])}
            type="button"
          >
            Clear
          </button>
        )}
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <Conversation>
            <ConversationContent className="px-4 py-6 md:px-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-6 py-12">
                  <ConversationEmptyState
                    description="Ask about leads, pipeline, finances, expenses, or anything in your CRM."
                    icon={
                      <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                        <HugeiconsIcon
                          className="text-primary"
                          icon={NeuralNetworkIcon}
                          size={28}
                          strokeWidth={1.5}
                        />
                      </div>
                    }
                    title="CRM Agent"
                  />
                  <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                    {EXAMPLES.map((example) => (
                      <button
                        className="group flex items-start gap-2.5 rounded-lg border bg-background p-3 text-left text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
                        key={example}
                        onClick={() => handleExampleClick(example)}
                        type="button"
                      >
                        <HugeiconsIcon
                          className="mt-0.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
                          icon={ArrowRight01Icon}
                          size={12}
                          strokeWidth={1.5}
                        />
                        <span>{example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isLastMessage = index === messages.length - 1;
                    const showError =
                      isLastMessage && hasError && message.role === "assistant";

                    const groupedParts = message.parts
                      ? groupConsecutiveToolCalls(message.parts)
                      : [];

                    return (
                      <Message from={message.role} key={message.id}>
                        <MessageContent
                          className={cn(
                            message.role === "assistant" ? "w-full" : ""
                          )}
                        >
                          {groupedParts.map((part, partIndex) =>
                            renderMessagePart(
                              part,
                              partIndex,
                              message.id,
                              isLastMessage,
                              isStreaming,
                              message.role
                            )
                          )}

                          {showError ? <ErrorMessage /> : null}
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {showStreamingIndicator ? <StreamingIndicator /> : null}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t px-4 py-3 md:px-8">
            <PromptInput className="mx-auto max-w-2xl" onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  className="max-h-[160px] min-h-[44px]"
                  onChange={(e) => setInput(e.currentTarget.value)}
                  placeholder="Ask about leads, pipeline, finances..."
                  value={input}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools />
                <PromptInputSubmit
                  disabled={!(input.trim() || isStreaming)}
                  onStop={stop}
                  status={isStreaming ? status : "ready"}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage() {
  return (
    <div className="space-y-2">
      <p className="font-medium text-destructive text-sm">
        Failed to generate response
      </p>
      <p className="text-muted-foreground text-xs">
        There was an error processing your request. Please try again.
      </p>
    </div>
  );
}

function StreamingIndicator() {
  return (
    <div
      className="fade-in flex w-full animate-in items-center gap-2 duration-200"
      data-role="assistant"
    >
      <HugeiconsIcon
        className="shrink-0 text-muted-foreground"
        icon={Loading03Icon}
        size={14}
        strokeWidth={2}
      />
      <Shimmer as="span" className="text-sm" duration={1} spread={4}>
        Thinking
      </Shimmer>
    </div>
  );
}
