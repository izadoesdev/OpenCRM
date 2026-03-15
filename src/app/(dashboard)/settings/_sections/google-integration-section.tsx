"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useDisconnectGoogle, useGoogleConnection } from "@/lib/queries";
import {
  SettingsCard,
  SettingsCardActions,
  SettingsCardBody,
  SettingsCardIcon,
  SettingsEmptyState,
  SettingsList,
  SettingsSection,
  SettingsSectionHeader,
  SettingsSkeleton,
} from "../_components/settings-layout";

export function GoogleIntegrationSection() {
  const { data: connection, isLoading } = useGoogleConnection();
  const disconnectGoogle = useDisconnectGoogle();
  const [showDisconnect, setShowDisconnect] = useState(false);

  return (
    <SettingsSection id="google-integration">
      <SettingsSectionHeader
        description="Connect your Google account for Calendar and Gmail features"
        title="Google Integration"
      />

      {isLoading && <SettingsSkeleton rows={1} />}

      {!(isLoading || connection?.connected) && (
        <SettingsEmptyState message="No Google account connected. Sign in with Google to enable Calendar and Gmail features." />
      )}

      {!isLoading && connection?.connected && (
        <SettingsList>
          <SettingsCard>
            <SettingsCardIcon>
              <div className="size-2.5 rounded-full bg-emerald-500" />
            </SettingsCardIcon>
            <SettingsCardBody>
              <div className="flex items-center gap-2">
                <p className="font-medium text-[13px]">{connection.email}</p>
                {connection.hasCalendar && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-[11px] text-blue-600">
                    Calendar
                  </span>
                )}
                {connection.hasGmail && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-[11px] text-red-600">
                    Gmail
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-muted-foreground text-xs">Connected</p>
            </SettingsCardBody>
            <SettingsCardActions>
              <Button
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={disconnectGoogle.isPending}
                onClick={() => setShowDisconnect(true)}
                size="sm"
                variant="ghost"
              >
                Disconnect
              </Button>
            </SettingsCardActions>
          </SettingsCard>
        </SettingsList>
      )}

      <ConfirmDialog
        confirmLabel="Disconnect"
        description="Calendar sync and Gmail features will stop working. You can reconnect at any time."
        icon={Cancel01Icon}
        onConfirm={() => disconnectGoogle.mutate()}
        onOpenChange={(v) => !v && setShowDisconnect(false)}
        open={showDisconnect}
        title="Disconnect Google account?"
        variant="danger"
      />
    </SettingsSection>
  );
}
