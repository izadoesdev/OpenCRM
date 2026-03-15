import {
  CallIcon,
  Globe02Icon,
  Mail01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DetailField,
  Pill,
  SectionHeader,
  UserAvatar,
} from "@/components/micro";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SOURCE_LABELS } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import type { useAssignLead, useUpdateLead } from "@/lib/queries";
import { getTimezoneLabel } from "@/lib/timezones";
import { formatCents, formatWebsite } from "@/lib/utils";
import type { TeamMember } from "./lead-tasks-sidebar";

function DetailRow({
  icon,
  href,
  external,
  children,
}: {
  icon: typeof Mail01Icon;
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      className="flex items-center gap-3 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <HugeiconsIcon
        className="shrink-0"
        icon={icon}
        size={14}
        strokeWidth={1.5}
      />
      <span className="truncate">{children}</span>
    </a>
  );
}

export function DetailsSidebar({
  lead,
  updateLeadMut,
  addingField,
  setAddingField,
  fieldKey,
  setFieldKey,
  fieldValue,
  setFieldValue,
}: {
  lead: {
    id: string;
    email: string;
    phone: string | null;
    website: string | null;
    country: string | null;
    timezone: string | null;
    source: string;
    value: number;
    plan: string | null;
    createdAt: Date;
    customFields: unknown;
  };
  updateLeadMut: ReturnType<typeof useUpdateLead>;
  addingField: boolean;
  setAddingField: (v: boolean) => void;
  fieldKey: string;
  setFieldKey: (v: string) => void;
  fieldValue: string;
  setFieldValue: (v: string) => void;
}) {
  return (
    <div className="shrink-0 border-b px-5 py-4">
      <SectionHeader>Details</SectionHeader>
      <div className="space-y-2">
        <DetailRow href={`mailto:${lead.email}`} icon={Mail01Icon}>
          {lead.email}
        </DetailRow>
        {lead.phone && (
          <DetailRow href={`tel:${lead.phone}`} icon={CallIcon}>
            {lead.phone}
          </DetailRow>
        )}
        {lead.website && (
          <DetailRow
            external
            href={
              lead.website.startsWith("http")
                ? lead.website
                : `https://${lead.website}`
            }
            icon={Globe02Icon}
          >
            {formatWebsite(lead.website)}
          </DetailRow>
        )}
        <DetailField label="Source">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </DetailField>
        {(lead.country || lead.timezone) && (
          <DetailField label="Location">
            <span className="text-sm">
              {[lead.country, lead.timezone && getTimezoneLabel(lead.timezone)]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </DetailField>
        )}
        {lead.timezone && (
          <DetailField label="Their time">
            <span className="font-mono text-xs">
              {dayjs().tz(lead.timezone).format("h:mm A")}
            </span>
          </DetailField>
        )}
        {lead.value > 0 && (
          <DetailField label="Value">
            <span className="font-mono">{formatCents(lead.value)}</span>
          </DetailField>
        )}
        {lead.plan && (
          <DetailField label="Plan">
            <Pill
              className="font-medium uppercase tracking-wider"
              variant="success"
            >
              {lead.plan}
            </Pill>
          </DetailField>
        )}
        <DetailField label="Added">
          <span className="text-muted-foreground">
            {dayjs(lead.createdAt).format("MMM D, YYYY")}
          </span>
        </DetailField>
        {(() => {
          const cf = lead.customFields as Record<string, string> | null;
          if (!cf || Object.keys(cf).length === 0) {
            return null;
          }
          return Object.entries(cf).map(([key, val]) => (
            <DetailField key={key} label={key}>
              {val}
            </DetailField>
          ));
        })()}
        <div className="mt-2">
          {addingField ? (
            <div className="flex items-center gap-2">
              <Input
                className="h-7 w-24 text-xs"
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="Field name"
                value={fieldKey}
              />
              <Input
                className="h-7 flex-1 text-xs"
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="Value"
                value={fieldValue}
              />
              <Button
                disabled={!(fieldKey.trim() && fieldValue.trim())}
                onClick={() => {
                  const current = (lead.customFields ?? {}) as Record<
                    string,
                    string
                  >;
                  updateLeadMut.mutate({
                    id: lead.id,
                    data: {
                      customFields: {
                        ...current,
                        [fieldKey.trim()]: fieldValue.trim(),
                      },
                    },
                  });
                  setFieldKey("");
                  setFieldValue("");
                  setAddingField(false);
                }}
                size="sm"
                variant="ghost"
              >
                Save
              </Button>
              <Button
                onClick={() => setAddingField(false)}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              className="text-muted-foreground text-xs hover:text-foreground"
              onClick={() => setAddingField(true)}
              type="button"
            >
              + Add field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AssignedToSection({
  lead,
  leadId,
  teamMembers,
  assignLead,
}: {
  lead: {
    assignedTo: string | null;
    assignedUser: { name: string; email: string } | null;
  };
  leadId: string;
  teamMembers: TeamMember[];
  assignLead: ReturnType<typeof useAssignLead>;
}) {
  return (
    <div className="shrink-0 border-b px-5 py-4">
      <SectionHeader>Assigned To</SectionHeader>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/40"
              type="button"
            />
          }
        >
          {lead.assignedUser ? (
            <>
              <UserAvatar name={lead.assignedUser.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {lead.assignedUser.name}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {lead.assignedUser.email}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-8 items-center justify-center rounded-full border border-muted-foreground/30 border-dashed">
                <HugeiconsIcon
                  className="text-muted-foreground/50"
                  icon={UserIcon}
                  size={14}
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-muted-foreground text-sm">
                Click to assign
              </span>
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {teamMembers.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() => assignLead.mutate({ leadId, assignedTo: m.id })}
            >
              <UserAvatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{m.name}</p>
              </div>
              {lead.assignedTo === m.id && (
                <Pill variant="primary">current</Pill>
              )}
            </DropdownMenuItem>
          ))}
          {lead.assignedTo && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => assignLead.mutate({ leadId, assignedTo: null })}
              >
                Unassign
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
