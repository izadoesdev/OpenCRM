"use client";

import { Calendar03Icon, DollarCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

export function GeneralSection() {
  const { data: settings, isLoading } = useAppSettings();
  const updateMut = useUpdateAppSettings();

  return (
    <SettingsSection id="general">
      <SettingsSectionHeader
        description="Default currency and date display format."
        title="General"
      />

      {isLoading && <SettingsSkeleton rows={2} />}

      {!isLoading && (
        <SettingsList>
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
                onValueChange={(v) => updateMut.mutate({ currency: v })}
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
                onValueChange={(v) => updateMut.mutate({ dateFormat: v })}
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
