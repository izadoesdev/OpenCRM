"use client";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Switch } from "@/components/ui/switch";
import { useProfile, useUpdatePreferences } from "@/lib/queries";
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

export function NotificationPreferencesSection() {
  const { data: profile, isLoading } = useProfile();
  const updatePreferences = useUpdatePreferences();

  const digestEnabled = profile?.preferences?.digestEnabled ?? false;

  function handleToggleDigest(checked: boolean) {
    updatePreferences.mutate({ digestEnabled: checked });
  }

  return (
    <SettingsSection id="notifications">
      <SettingsSectionHeader
        description="Choose how you want to be notified"
        title="Notification Preferences"
      />

      {isLoading && <SettingsSkeleton rows={1} />}

      {!isLoading && (
        <SettingsList>
          <SettingsCard>
            <SettingsCardIcon>
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={Mail01Icon}
                size={16}
                strokeWidth={1.5}
              />
            </SettingsCardIcon>
            <SettingsCardBody>
              <p className="font-medium text-[13px]">Overdue task reminders</p>
              <p className="mt-0.5 text-muted-foreground text-xs">
                Get an email when you have overdue tasks that need attention
              </p>
            </SettingsCardBody>
            <SettingsCardActions>
              <Switch
                checked={digestEnabled}
                disabled={updatePreferences.isPending}
                onCheckedChange={handleToggleDigest}
              />
            </SettingsCardActions>
          </SettingsCard>
        </SettingsList>
      )}
    </SettingsSection>
  );
}
