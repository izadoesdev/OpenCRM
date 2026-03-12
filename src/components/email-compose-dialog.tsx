"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendLeadEmail } from "@/lib/actions/email-templates";

interface Template {
  body: string;
  id: string;
  name: string;
  subject: string;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  templates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  templates: Template[];
}) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSubject("");
      setBody("");
      setTemplateId("");
      setError("");
    }
  }, [open]);

  function handleTemplateSelect(id: string | null) {
    if (!id) {
      return;
    }
    setTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!(subject.trim() && body.trim())) {
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        await sendLeadEmail(leadId, {
          subject,
          body,
          templateId: templateId || undefined,
        });
        setSubject("");
        setBody("");
        setTemplateId("");
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose an email to {leadName}. Use merge tags: {"{{name}}"},{" "}
            {"{{company}}"}, {"{{title}}"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onKeyDown={handleKeyDown}
          onSubmit={handleSend}
        >
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="email-template"
              >
                Template
              </label>
              <Select
                onValueChange={handleTemplateSelect}
                value={templateId || undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className="text-muted-foreground text-xs"
              htmlFor="email-subject"
            >
              Subject *
            </label>
            <Input
              autoFocus
              id="email-subject"
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: Your interest in Databuddy"
              required
              value={subject}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-muted-foreground text-xs"
              htmlFor="email-body"
            >
              Body *
            </label>
            <Textarea
              className="min-h-[120px]"
              id="email-body"
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi {{name}},\n\n..."}
              required
              value={body}
            />
            <p className="text-[10px] text-muted-foreground">
              Cmd+Enter to send
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button disabled={isPending} type="submit">
              {isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
