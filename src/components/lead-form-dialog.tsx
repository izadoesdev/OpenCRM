"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LEAD_SOURCES, SOURCE_LABELS } from "@/lib/constants";
import {
  useCheckDuplicateEmail,
  useCreateLead,
  useUpdateLead,
} from "@/lib/queries";
import { TIMEZONE_GROUPS } from "@/lib/timezones";

const WEBSITE_URL_REGEX = /^https?:\/\//;

function stripProtocol(url: string) {
  return url.replace(WEBSITE_URL_REGEX, "");
}

function computeDirty(
  fields: {
    name: string;
    email: string;
    company: string;
    title: string;
    phone: string;
    website: string;
    source: string;
    valueDollars: string;
    country: string;
    tz: string;
  },
  lead?: LeadData | null
) {
  if (!lead?.id) {
    const { name, email, company, title, phone, website, valueDollars } =
      fields;
    return !!(
      name ||
      email ||
      company ||
      title ||
      phone ||
      website ||
      valueDollars
    );
  }
  return (
    fields.name !== (lead.name ?? "") ||
    fields.email !== (lead.email ?? "") ||
    fields.company !== (lead.company ?? "") ||
    fields.title !== (lead.title ?? "") ||
    fields.phone !== (lead.phone ?? "") ||
    fields.website !== stripProtocol(lead.website ?? "") ||
    fields.source !== (lead.source ?? "manual") ||
    fields.valueDollars !== (lead.value ? (lead.value / 100).toString() : "") ||
    fields.country !== (lead.country ?? "") ||
    fields.tz !== (lead.timezone ?? "")
  );
}

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
  country?: string | null;
  email?: string;
  id?: string;
  name?: string;
  phone?: string | null;
  source?: string;
  timezone?: string | null;
  title?: string | null;
  value?: number;
  website?: string | null;
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
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isPending = createLead.isPending || updateLead.isPending;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [source, setSource] = useState("manual");
  const [valueDollars, setValueDollars] = useState("");
  const [country, setCountry] = useState("");
  const [tz, setTz] = useState("");

  const duplicateCheck = useCheckDuplicateEmail(email);

  const isDirty = computeDirty(
    {
      name,
      email,
      company,
      title,
      phone,
      website,
      source,
      valueDollars,
      country,
      tz,
    },
    lead
  );

  useEffect(() => {
    if (open) {
      setName(lead?.name ?? "");
      setEmail(lead?.email ?? "");
      setCompany(lead?.company ?? "");
      setTitle(lead?.title ?? "");
      setPhone(lead?.phone ?? "");
      setWebsite((lead?.website ?? "").replace(WEBSITE_URL_REGEX, ""));
      setSource(lead?.source ?? "manual");
      setValueDollars(lead?.value ? (lead.value / 100).toString() : "");
      setCountry(lead?.country ?? "");
      setTz(lead?.timezone ?? "");
    }
  }, [open, lead]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      website: website ? `https://${website}` : undefined,
      source,
      value: cents,
      country: country || undefined,
      timezone: tz || undefined,
    };

    if (isEdit && lead?.id) {
      updateLead.mutate(
        { id: lead.id, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createLead.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  const titleMatchesPreset = COMMON_TITLES.includes(title);
  const submitLabel = isEdit ? "Save Changes" : "Add Lead";

  return (
    <Sheet dirty={isDirty} onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="overflow-y-auto rounded-xl shadow-lg data-[side=right]:inset-y-3 data-[side=right]:right-3 data-[side=right]:h-auto data-[side=right]:border sm:max-w-lg"
        side="right"
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Lead" : "Add Lead"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update lead information."
              : "Add a new lead to your pipeline."}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col gap-3 px-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-name"
              >
                Name
              </label>
              <Input
                autoFocus
                id="lead-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                value={name}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-email"
              >
                Email
              </label>
              <Input
                id="lead-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                type="email"
                value={email}
              />
              {duplicateCheck?.data && !lead && (
                <p className="text-amber-600 text-xs">
                  A lead with this email already exists:{" "}
                  {duplicateCheck.data.name} ({duplicateCheck.data.status})
                </p>
              )}
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
                  onValueChange={(v) => {
                    if (!v) {
                      return;
                    }
                    setTitle(v === "__custom__" ? "" : v);
                  }}
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
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground text-sm">
                  https://
                </span>
                <Input
                  className="pl-[60px]"
                  id="lead-website"
                  onChange={(e) =>
                    setWebsite(e.target.value.replace(WEBSITE_URL_REGEX, ""))
                  }
                  placeholder="company.com"
                  value={website}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-country"
              >
                Country
              </label>
              <Input
                id="lead-country"
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                value={country}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-tz"
              >
                Timezone
              </label>
              <Select
                onValueChange={(v) => v && setTz(v)}
                value={tz || undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone..." />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_GROUPS.map((g) => (
                    <SelectItem
                      disabled
                      key={g.region}
                      value={`__group_${g.region}`}
                    >
                      <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                        {g.region}
                      </span>
                    </SelectItem>
                  )).flatMap((groupHeader, gi) => [
                    groupHeader,
                    ...TIMEZONE_GROUPS[gi].zones.map((z) => (
                      <SelectItem key={z.value} value={z.value}>
                        {z.label}
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {z.offset}
                        </span>
                      </SelectItem>
                    )),
                  ])}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="lead-source"
              >
                Source
              </label>
              <Select onValueChange={(v) => v && setSource(v)} value={source}>
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
                Deal Value
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  className="pl-7"
                  id="lead-value"
                  min="0"
                  onChange={(e) => setValueDollars(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={valueDollars}
                />
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button className="w-full" disabled={isPending} type="submit">
              {isPending ? "Saving..." : submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
