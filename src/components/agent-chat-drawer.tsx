"use client";

import { useChat } from "@ai-sdk/react";
import { Cancel01Icon, NeuralNetworkIcon } from "@hugeicons/core-free-icons";
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
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { ToolCall } from "@/components/ai-elements/tool";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const AGENTS = [{ id: "lead-triage", name: "Lead Triage" }] as const;

export function AgentChatDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState<string>(AGENTS[0].id);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    body: { agent },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) {
      return;
    }
    sendMessage({ text: message.text });
    setInput("");
  };

  const handleAgentChange = (value: string) => {
    setAgent(value);
    setMessages([]);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        side="right"
      >
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeiconsIcon
                icon={NeuralNetworkIcon}
                size={14}
                strokeWidth={2}
              />
            </div>
            <SheetTitle className="font-medium text-sm">
              AI Assistant
            </SheetTitle>
          </div>
          <button
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </button>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Conversation>
            <ConversationContent className="px-4 py-4">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  description="Ask me to analyze leads, triage your pipeline, tag prospects, or score deals."
                  icon={
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      <HugeiconsIcon
                        className="text-primary"
                        icon={NeuralNetworkIcon}
                        size={24}
                        strokeWidth={1.5}
                      />
                    </div>
                  }
                  title="CRM AI Assistant"
                />
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

          <div className="border-t px-4 py-3">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  className="max-h-[120px] min-h-[44px]"
                  onChange={(e) => setInput(e.currentTarget.value)}
                  placeholder="Ask the AI assistant..."
                  value={input}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputSelect
                    onValueChange={handleAgentChange}
                    value={agent}
                  >
                    <PromptInputSelectTrigger>
                      <PromptInputSelectValue />
                    </PromptInputSelectTrigger>
                    <PromptInputSelectContent>
                      {AGENTS.map((a) => (
                        <PromptInputSelectItem key={a.id} value={a.id}>
                          {a.name}
                        </PromptInputSelectItem>
                      ))}
                    </PromptInputSelectContent>
                  </PromptInputSelect>
                </PromptInputTools>
                <PromptInputSubmit
                  disabled={!input.trim()}
                  status={status === "streaming" ? "streaming" : "ready"}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
