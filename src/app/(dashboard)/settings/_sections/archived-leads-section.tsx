"use client";

import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAvatar } from "@/components/micro";
import { Button } from "@/components/ui/button";
import dayjs from "@/lib/dayjs";
import {
  useArchivedLeads,
  usePermanentlyDeleteLead,
  useRestoreLead,
} from "@/lib/queries";
import {
  SettingsCard,
  SettingsCardActions,
  SettingsCardBody,
  SettingsEmptyState,
  SettingsList,
  SettingsSection,
  SettingsSectionHeader,
  SettingsSkeleton,
} from "../_components/settings-layout";

export function ArchivedLeadsSection() {
  const { data: archivedLeads = [], isLoading } = useArchivedLeads();
  const restoreLead = useRestoreLead();
  const permanentlyDelete = usePermanentlyDeleteLead();

  return (
    <SettingsSection id="archived-leads">
      <SettingsSectionHeader
        description="Restore or permanently delete archived leads"
        title="Archived Leads"
      />

      {isLoading && <SettingsSkeleton />}

      {!isLoading && archivedLeads.length === 0 && (
        <SettingsEmptyState message="No archived leads" />
      )}

      {!isLoading && archivedLeads.length > 0 && (
        <SettingsList>
          {archivedLeads.map((l) => (
            <SettingsCard key={l.id}>
              <UserAvatar name={l.name} size="md" />
              <SettingsCardBody>
                <div className="flex items-baseline gap-2">
                  <p className="truncate font-medium text-[13px]">{l.name}</p>
                  {l.company && (
                    <span className="truncate text-muted-foreground/50 text-xs">
                      {l.company}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {l.email}
                  <span className="text-muted-foreground/50">
                    {" · "}Archived{" "}
                    {l.archivedAt ? dayjs(l.archivedAt).fromNow() : ""}
                  </span>
                </p>
              </SettingsCardBody>
              <SettingsCardActions>
                <Button
                  disabled={
                    restoreLead.isPending || permanentlyDelete.isPending
                  }
                  onClick={() => restoreLead.mutate(l.id)}
                  size="sm"
                  variant="outline"
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Restore
                </Button>
                <Button
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={
                    restoreLead.isPending || permanentlyDelete.isPending
                  }
                  onClick={() => permanentlyDelete.mutate(l.id)}
                  size="sm"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                </Button>
              </SettingsCardActions>
            </SettingsCard>
          ))}
        </SettingsList>
      )}
    </SettingsSection>
  );
}
