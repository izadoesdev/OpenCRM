"use client";

import { useEffect, useState } from "react";
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
import { useSendEmail } from "@/lib/queries";

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
  const sendEmail = useSendEmail();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    if (open) {
      setSubject("");
      setBody("");
      setTemplateId("");
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
    sendEmail.mutate(
      { leadId, data: { subject, body, templateId: templateId || undefined } },
      { onSuccess: () => onOpenChange(false) }
    );
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
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

          <DialogFooter>
            <Button disabled={sendEmail.isPending} type="submit">
              {sendEmail.isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
