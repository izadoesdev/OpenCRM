"use client";

import { useChat } from "@ai-sdk/react";
import {
  ArrowRight01Icon,
  NeuralNetworkIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DefaultChatTransport } from "ai";
import { Fragment, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageReasoning,
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
import { ToolCall } from "@/components/ai-elements/tool";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const AGENTS = [
  {
    id: "lead-triage",
    name: "Lead Triage",
    description: "Analyze, sort, classify, and organize leads in the pipeline",
    icon: NeuralNetworkIcon,
    examples: [
      "Review all new leads and score them",
      "Tag enterprise leads as high-priority",
      "Show me leads stuck in 'contacted' for over 2 weeks",
      "Give me a pipeline overview",
    ],
  },
];

export function AgentsClient() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].id);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    body: { agent: selectedAgent },
  });

  const activeAgent = AGENTS.find((a) => a.id === selectedAgent) ?? AGENTS[0];

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

  const handleAgentSwitch = (agentId: string) => {
    setSelectedAgent(agentId);
    setMessages([]);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg tracking-tight">AI Agents</h1>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {messages.length} messages
              </span>
            )}
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Agent picker sidebar */}
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <div className="p-3">
            <p className="px-2 pb-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              Agents
            </p>
            <div className="space-y-0.5">
              {AGENTS.map((agent) => {
                const active = agent.id === selectedAgent;
                return (
                  <button
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                    key={agent.id}
                    onClick={() => handleAgentSwitch(agent.id)}
                    type="button"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <HugeiconsIcon
                        icon={agent.icon}
                        size={14}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[13px] text-foreground">
                        {agent.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Conversation>
            <ConversationContent className="px-4 py-6 md:px-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-6 py-12">
                  <ConversationEmptyState
                    description={activeAgent.description}
                    icon={
                      <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                        <HugeiconsIcon
                          className="text-primary"
                          icon={activeAgent.icon}
                          size={28}
                          strokeWidth={1.5}
                        />
                      </div>
                    }
                    title={activeAgent.name}
                  />
                  <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
                    {activeAgent.examples.map((example) => (
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
                messages.map((message) => (
                  <Fragment key={message.id}>
                    <Message from={message.role}>
                      <MessageContent>
                        {message.parts.map((part, i) => {
                          const key = `${message.id}-${i}`;
                          switch (part.type) {
                            case "text":
                              return (
                                <MessageResponse key={key}>
                                  {part.text}
                                </MessageResponse>
                              );
                            case "reasoning":
                              return (
                                <MessageReasoning key={key} text={part.text} />
                              );
                            default:
                              if (part.type.startsWith("tool-")) {
                                const toolPart = part as {
                                  type: string;
                                  state: string;
                                  toolName?: string;
                                  input?: unknown;
                                  output?: unknown;
                                  errorText?: string;
                                };
                                return (
                                  <ToolCall
                                    errorText={toolPart.errorText}
                                    input={toolPart.input}
                                    key={key}
                                    output={toolPart.output}
                                    state={toolPart.state}
                                    toolName={toolPart.toolName}
                                    type={toolPart.type}
                                  />
                                );
                              }
                              return null;
                          }
                        })}
                      </MessageContent>
                    </Message>
                  </Fragment>
                ))
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
                  placeholder={`Ask ${activeAgent.name}...`}
                  value={input}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools />
                <PromptInputSubmit
                  disabled={!input.trim()}
                  status={status === "streaming" ? "streaming" : "ready"}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
