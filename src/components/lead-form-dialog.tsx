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
import { createLead, updateLead } from "@/lib/actions/leads";
import { LEAD_SOURCES, SOURCE_LABELS } from "@/lib/constants";

const COMMON_TITLES = [
  "CEO",
  "CTO",
  "VP Engineering",
  "VP Sales",
  "VP Marketing",
  "Head of Growth",
  "Head of Product",
  "Engineering Manager",
  "Product Manager",
  "Founder",
  "Co-Founder",
  "Director",
  "Other",
];

interface LeadData {
  company?: string | null;
  email?: string;
  id?: string;
  name?: string;
  phone?: string | null;
  source?: string;
  title?: string | null;
  value?: number;
  website?: string | null;
}

function getSubmitLabel(isEdit: boolean): string {
  return isEdit ? "Save Changes" : "Add Lead";
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadData;
}) {
  const isEdit = !!lead?.id;
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [source, setSource] = useState("manual");
  const [valueDollars, setValueDollars] = useState("");

  useEffect(() => {
    if (open) {
      setName(lead?.name ?? "");
      setEmail(lead?.email ?? "");
      setCompany(lead?.company ?? "");
      setTitle(lead?.title ?? "");
      setPhone(lead?.phone ?? "");
      setWebsite(lead?.website ?? "");
      setSource(lead?.source ?? "manual");
      setValueDollars(lead?.value ? (lead.value / 100).toString() : "");
    }
  }, [open, lead]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const cents = Math.min(
        Math.round((Number.parseFloat(valueDollars) || 0) * 100),
        2_147_483_647
      );
      const data = {
        name,
        email,
        company: company || undefined,
        title: title || undefined,
        phone: phone || undefined,
        website: website || undefined,
        source,
        value: cents,
      };

      if (isEdit && lead?.id) {
        await updateLead(lead.id, data);
      } else {
        await createLead(data);
      }
      onOpenChange(false);
    });
  }

  function handleSourceChange(v: string | null) {
    if (v) {
      setSource(v);
    }
  }

  function handleTitleSelect(v: string | null) {
    if (!v) {
      return;
    }
    if (v === "__custom__") {
      setTitle("");
    } else {
      setTitle(v);
    }
  }

  const titleMatchesPreset = COMMON_TITLES.includes(title);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Lead" : "Add Lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update lead information."
              : "Add a new lead to your pipeline."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-name"
              >
                Name *
              </label>
              <Input
                autoFocus
                id="lead-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                value={name}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-email"
              >
                Email *
              </label>
              <Input
                id="lead-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-company"
              >
                Company
              </label>
              <Input
                id="lead-company"
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                value={company}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-title"
              >
                Title
              </label>
              {titleMatchesPreset || !title ? (
                <Select
                  onValueChange={handleTitleSelect}
                  value={title || undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select title..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TITLES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="lead-title"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Custom title"
                  value={title}
                />
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-phone"
              >
                Phone
              </label>
              <Input
                id="lead-phone"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                value={phone}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-website"
              >
                Website
              </label>
              <Input
                id="lead-website"
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                type="url"
                value={website}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-muted-foreground text-xs"
              htmlFor="lead-source"
            >
              Source
            </label>
            <Select onValueChange={handleSourceChange} value={source}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-muted-foreground text-xs"
              htmlFor="lead-value"
            >
              Deal Value ($)
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                className="pl-7"
                id="lead-value"
                max="21000000"
                min="0"
                onChange={(e) => setValueDollars(e.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={valueDollars}
              />
            </div>
          </div>

          <DialogFooter>
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : getSubmitLabel(isEdit)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
