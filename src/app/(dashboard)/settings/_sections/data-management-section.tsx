"use client";

import { Download04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  useExportActivities,
  useExportLeads,
  useExportTasks,
} from "@/lib/queries";
import {
  SettingsSection,
  SettingsSectionHeader,
} from "../_components/settings-layout";

function downloadCsv(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const v = String(row[h] ?? "");
          return v.includes(",") || v.includes('"')
            ? `"${v.replace(/"/g, '""')}"`
            : v;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataManagementSection() {
  const exportLeads = useExportLeads();
  const exportTasks = useExportTasks();
  const exportActivities = useExportActivities();

  return (
    <SettingsSection id="data-export">
      <SettingsSectionHeader
        description="Export your data as CSV files."
        title="Data Export"
      />

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="font-medium text-[13px]">Leads</p>
            <p className="text-muted-foreground text-xs">
              Export all leads as a CSV file
            </p>
          </div>
          <Button
            disabled={exportLeads.isPending}
            onClick={() =>
              exportLeads.mutate(undefined, {
                onSuccess: (data) =>
                  downloadCsv(
                    data as Record<string, unknown>[],
                    "leads-export.csv"
                  ),
              })
            }
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} />
            Export CSV
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="font-medium text-[13px]">Tasks</p>
            <p className="text-muted-foreground text-xs">
              Export all tasks as a CSV file
            </p>
          </div>
          <Button
            disabled={exportTasks.isPending}
            onClick={() =>
              exportTasks.mutate(undefined, {
                onSuccess: (data) =>
                  downloadCsv(
                    data as Record<string, unknown>[],
                    "tasks-export.csv"
                  ),
              })
            }
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} />
            Export CSV
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="font-medium text-[13px]">Activities</p>
            <p className="text-muted-foreground text-xs">
              Export all activity logs as a CSV file
            </p>
          </div>
          <Button
            disabled={exportActivities.isPending}
            onClick={() =>
              exportActivities.mutate(undefined, {
                onSuccess: (data) =>
                  downloadCsv(
                    data as Record<string, unknown>[],
                    "activities-export.csv"
                  ),
              })
            }
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={Download04Icon} size={14} strokeWidth={1.5} />
            Export CSV
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
