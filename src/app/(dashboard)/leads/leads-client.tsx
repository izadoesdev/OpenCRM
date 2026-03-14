"use client";

import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  Download01Icon,
  Search01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeadRow } from "@/lib/actions/leads";
import { ACTIVE_LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useBulkDeleteLeads,
  useBulkUpdateStatus,
  useDeleteLead,
  useLeadCounts,
  useLeads,
} from "@/lib/queries";
import { computeLeadScoreBreakdown } from "@/lib/scoring";
import { BulkActionsBar } from "./_components/bulk-actions-bar";
import { CsvImportDialog } from "./_components/csv-import-dialog";
import { LeadPreviewPanel } from "./_components/lead-preview-panel";
import { LeadsTable } from "./_components/leads-table";

export function LeadsPageClient() {
  const { data: leads = [], isLoading } = useLeads();
  const { data: counts = {} } = useLeadCounts();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editLead, setEditLead] = useState<LeadRow | undefined>();
  const [archiveLeadId, setArchiveLeadId] = useState<string | null>(null);
  const [showBulkArchive, setShowBulkArchive] = useState(false);
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);

  const deleteLead = useDeleteLead();
  const bulkUpdate = useBulkUpdateStatus();
  const bulkDelete = useBulkDeleteLeads();

  const filtered = leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.company?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "name":
        return mult * a.name.localeCompare(b.name);
      case "company":
        return (
          mult *
          (a.company ?? "").localeCompare(b.company ?? "", undefined, {
            sensitivity: "base",
          })
        );
      case "status":
        return mult * a.status.localeCompare(b.status);
      case "value":
        return mult * (a.value - b.value);
      case "score": {
        const sa = computeLeadScoreBreakdown({
          value: a.value,
          status: a.status,
          activitiesCount: 0,
          tasksCount: 0,
          daysSinceCreated: dayjs().diff(dayjs(a.createdAt), "day"),
        }).total;
        const sb = computeLeadScoreBreakdown({
          value: b.value,
          status: b.status,
          activitiesCount: 0,
          tasksCount: 0,
          daysSinceCreated: dayjs().diff(dayjs(b.createdAt), "day"),
        }).total;
        return mult * (sa - sb);
      }
      case "createdAt":
        return (
          mult * (dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf())
        );
      default:
        return 0;
    }
  });

  function exportCsv() {
    const headers = [
      "name",
      "email",
      "company",
      "title",
      "phone",
      "website",
      "source",
      "status",
      "value",
    ];
    const csvRows = [headers.join(",")];
    for (const l of sorted) {
      csvRows.push(
        headers
          .map((h) => {
            const val = (l as Record<string, unknown>)[h];
            if (h === "value") {
              return ((val as number) / 100).toString();
            }
            const s = String(val ?? "");
            return s.includes(",") ? `"${s}"` : s;
          })
          .join(",")
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSort(key: string) {
    const defaultDir = key === "name" ? "asc" : "desc";
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(defaultDir);
    }
  }

  function toggleAll() {
    setSelected(
      selected.size === sorted.length
        ? new Set()
        : new Set(sorted.map((l) => l.id))
    );
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  if (isLoading) {
    return <PageSkeleton header="Leads" />;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="font-semibold text-lg tracking-tight">Leads</h1>
            {leads.length > 0 && (
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs">
                {leads.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button onClick={exportCsv} size="sm" variant="outline">
              <HugeiconsIcon
                icon={Download01Icon}
                size={14}
                strokeWidth={1.5}
              />
              Export
            </Button>
            <Button
              onClick={() => setShowImport(true)}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={Upload01Icon} size={14} strokeWidth={1.5} />
              Import
            </Button>
            <Button
              onClick={() => {
                setEditLead(undefined);
                setShowForm(true);
              }}
              size="sm"
            >
              <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
              Add Lead
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="relative flex min-h-0 flex-1 flex-col p-6">
        {/* ── Search + Filters ── */}
        <div className="flex items-center gap-3 pb-4">
          <div className="relative">
            <HugeiconsIcon
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              size={14}
              strokeWidth={1.5}
            />
            <Input
              className="h-8 w-72 pr-7 pl-8"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Search leads..."
              value={search}
            />
            {search && (
              <button
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearch("")}
                type="button"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
            <button
              className={`rounded-md px-2.5 py-1 font-medium text-xs transition-all ${statusFilter === "all" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              All
              <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                {counts.all ?? 0}
              </span>
            </button>
            {ACTIVE_LEAD_STATUSES.map((s) => (
              <button
                className={`rounded-md px-2.5 py-1 font-medium text-xs transition-all ${statusFilter === s ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                key={s}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {STATUS_LABELS[s]}
                {(counts[s] ?? 0) > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <LeadsTable
          leads={sorted}
          onAddFirst={() => {
            setEditLead(undefined);
            setShowForm(true);
          }}
          onArchive={setArchiveLeadId}
          onEdit={(lead) => {
            setEditLead(lead);
            setShowForm(true);
          }}
          onPreview={setPreviewLeadId}
          onSort={handleSort}
          onToggleAll={toggleAll}
          onToggleOne={toggleOne}
          search={search}
          selected={selected}
          sortDir={sortDir}
          sortKey={sortKey}
          statusFilter={statusFilter}
        />

        {/* ── Footer ── */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between pt-3">
            <p className="text-muted-foreground text-xs">
              Showing{" "}
              <span className="font-medium text-foreground">
                {sorted.length}
              </span>
              {sorted.length !== leads.length && (
                <>
                  {" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {leads.length}
                  </span>
                </>
              )}{" "}
              lead{sorted.length === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {/* ── Bulk actions ── */}
        <BulkActionsBar
          count={selected.size}
          onArchive={() => setShowBulkArchive(true)}
          onClear={() => setSelected(new Set())}
          onStatusChange={(status) => {
            bulkUpdate.mutate({ ids: [...selected], status });
            setSelected(new Set());
          }}
        />
      </div>

      {/* ── Dialogs ── */}
      <LeadFormDialog
        lead={editLead}
        onOpenChange={setShowForm}
        open={showForm}
      />
      <CsvImportDialog onOpenChange={setShowImport} open={showImport} />
      {previewLeadId && (
        <LeadPreviewPanel
          leadId={previewLeadId}
          onClose={() => setPreviewLeadId(null)}
        />
      )}
      <ConfirmDialog
        confirmLabel="Archive"
        description="This lead will be moved to the archive. You can restore them later from settings."
        icon={Delete02Icon}
        onConfirm={() => {
          if (archiveLeadId) {
            deleteLead.mutate(archiveLeadId);
          }
        }}
        onOpenChange={(v) => !v && setArchiveLeadId(null)}
        open={!!archiveLeadId}
        title="Archive this lead?"
        variant="danger"
      />
      <ConfirmDialog
        confirmLabel={`Archive ${selected.size} lead${selected.size === 1 ? "" : "s"}`}
        description={`${selected.size} lead${selected.size === 1 ? "" : "s"} will be moved to the archive.`}
        icon={Delete02Icon}
        onConfirm={() => {
          bulkDelete.mutate([...selected]);
          setSelected(new Set());
        }}
        onOpenChange={setShowBulkArchive}
        open={showBulkArchive}
        title="Archive selected leads?"
        variant="danger"
      />
    </div>
  );
}
