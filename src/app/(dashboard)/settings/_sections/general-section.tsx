"use client";

import {
  Calendar03Icon,
  DollarCircleIcon,
  Mail01Icon,
  SecurityLockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { useAppSettings, useUpdateAppSettings } from "@/lib/queries";
import {
  SettingsCard,
  SettingsCardActions,
  SettingsCardBody,
  SettingsCardIcon,
  SettingsList,
  SettingsSection,
  SettingsSectionHeader,
  SettingsSkeleton,
} from "../_components/settings-layout";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "JPY", label: "JPY (\u00A5)" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

function InlineEditCard({
  icon,
  label,
  description,
  value,
  placeholder,
  onSave,
  isPending,
  type,
}: {
  icon: typeof Mail01Icon;
  label: string;
  description: string;
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
  isPending: boolean;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleSave() {
    onSave(draft.trim());
    setEditing(false);
  }

  return (
    <SettingsCard className="flex-col items-stretch gap-2">
      <div className="flex items-center gap-3">
        <SettingsCardIcon>
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={icon}
            size={16}
            strokeWidth={1.5}
          />
        </SettingsCardIcon>
        <SettingsCardBody>
          <p className="font-medium text-[13px]">{label}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>
        </SettingsCardBody>
        {!editing && (
          <SettingsCardActions>
            <Button
              onClick={() => setEditing(true)}
              size="sm"
              variant="outline"
            >
              Edit
            </Button>
          </SettingsCardActions>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-2 pt-1">
          <Input
            className="h-8 text-[13px]"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSave();
              }
              if (e.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            placeholder={placeholder}
            type={type}
            value={draft}
          />
          <Button disabled={isPending} onClick={handleSave} size="sm">
            Save
          </Button>
          <Button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      ) : (
        value && (
          <p className="truncate pl-12 font-mono text-muted-foreground text-xs">
            {value}
          </p>
        )
      )}
    </SettingsCard>
  );
}

export function GeneralSection() {
  const { data: settings, isLoading } = useAppSettings();
  const updateMut = useUpdateAppSettings();

  return (
    <SettingsSection id="general">
      <SettingsSectionHeader
        description="Core configuration for your CRM."
        title="General"
      />

      {isLoading && <SettingsSkeleton rows={4} />}

      {!isLoading && (
        <SettingsList>
          <InlineEditCard
            description="Sender address for all outbound emails (digest, lead emails)"
            icon={Mail01Icon}
            isPending={updateMut.isPending}
            label="Email from address"
            onSave={(v) => updateMut.mutate({ emailFrom: v || null })}
            placeholder="e.g. crm@yourcompany.com"
            type="email"
            value={settings?.emailFrom ?? ""}
          />

          <InlineEditCard
            description="Only users with this email domain can sign in"
            icon={SecurityLockIcon}
            isPending={updateMut.isPending}
            label="Allowed domain"
            onSave={(v) => updateMut.mutate({ allowedDomain: v || null })}
            placeholder="e.g. yourcompany.com"
            value={settings?.allowedDomain ?? ""}
          />

          <SettingsCard>
            <SettingsCardIcon>
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={DollarCircleIcon}
                size={16}
                strokeWidth={1.5}
              />
            </SettingsCardIcon>
            <SettingsCardBody>
              <p className="font-medium text-[13px]">Currency</p>
              <p className="mt-0.5 text-muted-foreground text-xs">
                Used for displaying lead values
              </p>
            </SettingsCardBody>
            <SettingsCardActions>
              <Select
                disabled={updateMut.isPending}
                onValueChange={(v) => v && updateMut.mutate({ currency: v })}
                value={settings?.currency ?? "USD"}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsCardActions>
          </SettingsCard>

          <SettingsCard>
            <SettingsCardIcon>
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={Calendar03Icon}
                size={16}
                strokeWidth={1.5}
              />
            </SettingsCardIcon>
            <SettingsCardBody>
              <p className="font-medium text-[13px]">Date format</p>
              <p className="mt-0.5 text-muted-foreground text-xs">
                How dates are displayed across the app
              </p>
            </SettingsCardBody>
            <SettingsCardActions>
              <Select
                disabled={updateMut.isPending}
                onValueChange={(v) => v && updateMut.mutate({ dateFormat: v })}
                value={settings?.dateFormat ?? "MM/DD/YYYY"}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsCardActions>
          </SettingsCard>
        </SettingsList>
      )}
    </SettingsSection>
  );
}
