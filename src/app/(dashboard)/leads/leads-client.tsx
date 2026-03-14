"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Delete02Icon,
  Download01Icon,
  MoreHorizontalIcon,
  Search01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { UserAvatar } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LeadRow } from "@/lib/actions/leads";
import {
  ACTIVE_LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useBulkDeleteLeads,
  useBulkUpdateStatus,
  useDeleteLead,
  useImportLeads,
  useLead,
  useLeadCounts,
  useLeads,
} from "@/lib/queries";
import {
  computeLeadScoreBreakdown,
  getScoreBgColor,
  getScoreColor,
} from "@/lib/scoring";
import { formatCents } from "@/lib/utils";

function SortableHead({
  active,
  children,
  direction,
  className,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  direction: "asc" | "desc";
  className?: string;
  onClick: () => void;
}) {
  return (
    <TableHead
      className={`cursor-pointer select-none text-muted-foreground text-xs transition-colors hover:text-foreground ${className ?? ""}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && (
          <HugeiconsIcon
            className="text-foreground"
            icon={direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
            size={12}
            strokeWidth={2}
          />
        )}
      </span>
    </TableHead>
  );
}

function CsvImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const importMut = useImportLeads();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      if (!(headers.includes("name") && headers.includes("email"))) {
        setError("CSV must have 'name' and 'email' columns");
        return;
      }
      const parsed = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = cols[i] ?? "";
          });
          return obj;
        })
        .filter((r) => r.name && r.email);
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    const mapped = rows.map((r) => ({
      name: r.name,
      email: r.email,
      company: r.company || undefined,
      title: r.title || undefined,
      phone: r.phone || undefined,
      website: r.website || undefined,
      source: r.source || undefined,
      value: r.value ? Math.round(Number.parseFloat(r.value) * 100) : undefined,
    }));
    importMut.mutate(mapped, {
      onSuccess: () => {
        onOpenChange(false);
        setRows([]);
      },
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: name, email, company, title, phone,
            website, source, value
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            accept=".csv"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:font-medium file:text-foreground file:text-sm"
            onChange={handleFile}
            type="file"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {rows.length > 0 && (
            <div className="rounded-md border p-3">
              <p className="text-sm">
                {rows.length} lead{rows.length === 1 ? "" : "s"} ready to import
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Preview:{" "}
                {rows
                  .slice(0, 3)
                  .map((r) => r.name)
                  .join(", ")}
                {rows.length > 3 && ` and ${rows.length - 3} more`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={rows.length === 0 || importMut.isPending}
              onClick={handleImport}
              size="sm"
            >
              {importMut.isPending
                ? "Importing..."
                : `Import ${rows.length} Leads`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeadPreviewPanel({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: lead, isLoading } = useLead(leadId);

  return (
    <>
      {/* biome-ignore lint/a11y: backdrop click to close */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 z-50 flex h-full w-[420px] flex-col border-l bg-background">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="font-semibold text-sm">Lead Preview</h2>
          <Button onClick={onClose} size="icon-sm" variant="ghost">
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </Button>
        </div>

        {isLoading || !lead ? (
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-muted/60" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="flex items-start gap-3.5">
                <UserAvatar name={lead.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-base leading-tight">
                    {lead.name}
                  </p>
                  {lead.company && (
                    <p className="mt-0.5 truncate text-muted-foreground text-sm">
                      {lead.company}
                    </p>
                  )}
                </div>
                <StatusBadge status={lead.status} />
              </div>

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Email</span>
                  <span className="truncate pl-4 text-sm">{lead.email}</span>
                </div>
                {lead.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Phone</span>
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Value</span>
                  <span className="font-mono text-sm tabular-nums">
                    {formatCents(lead.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Source</span>
                  <span className="text-sm">
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Added</span>
                  <span className="text-sm">
                    {dayjs(lead.createdAt).fromNow()}
                  </span>
                </div>
                {lead.assignedUser && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Assigned
                    </span>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={lead.assignedUser.name} size="xs" />
                      <span className="text-sm">{lead.assignedUser.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {lead.customFields &&
                Object.keys(lead.customFields as Record<string, string>)
                  .length > 0 && (
                  <div className="mt-5 border-t pt-4">
                    <p className="mb-2.5 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
                      Custom Fields
                    </p>
                    <div className="space-y-2.5">
                      {Object.entries(
                        lead.customFields as Record<string, string>
                      ).map(([k, v]) => (
                        <div
                          className="flex items-center justify-between"
                          key={k}
                        >
                          <span className="text-muted-foreground text-xs">
                            {k}
                          </span>
                          <span className="text-sm">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {lead.tasks && (
                <div className="mt-5 border-t pt-4">
                  <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
                    Tasks
                    <span className="ml-1.5 font-mono">
                      (
                      {
                        lead.tasks.filter(
                          (t: { completedAt: Date | null }) => !t.completedAt
                        ).length
                      }{" "}
                      open)
                    </span>
                  </p>
                </div>
              )}

              {lead.activities && lead.activities.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
                    Last Activity
                  </p>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {
                      (
                        lead.activities as Array<{
                          content: string;
                          createdAt: Date;
                        }>
                      )[0].content
                    }
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {dayjs(
                      (lead.activities as Array<{ createdAt: Date }>)[0]
                        .createdAt
                    ).fromNow()}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t p-5">
              <Button
                className="w-full"
                onClick={() => router.push(`/leads/${leadId}`)}
                size="sm"
              >
                View Full Detail
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

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
        const scoreA = computeLeadScoreBreakdown({
          value: a.value,
          status: a.status,
          activitiesCount: 0,
          tasksCount: 0,
          daysSinceCreated: dayjs().diff(dayjs(a.createdAt), "day"),
        }).total;
        const scoreB = computeLeadScoreBreakdown({
          value: b.value,
          status: b.status,
          activitiesCount: 0,
          tasksCount: 0,
          daysSinceCreated: dayjs().diff(dayjs(b.createdAt), "day"),
        }).total;
        return mult * (scoreA - scoreB);
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

  function toggleAll() {
    setSelected(
      selected.size === sorted.length
        ? new Set()
        : new Set(sorted.map((l) => l.id))
    );
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
              className={`rounded-md px-2.5 py-1 font-medium text-xs transition-all ${
                statusFilter === "all"
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
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
                className={`rounded-md px-2.5 py-1 font-medium text-xs transition-all ${
                  statusFilter === s
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
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

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 pl-3">
                    <Checkbox
                      checked={
                        sorted.length > 0 && selected.size === sorted.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <SortableHead
                    active={sortKey === "name"}
                    direction={sortDir}
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </SortableHead>
                  <SortableHead
                    active={sortKey === "company"}
                    direction={sortDir}
                    onClick={() => handleSort("company")}
                  >
                    Company
                  </SortableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Assigned To
                  </TableHead>
                  <SortableHead
                    active={sortKey === "status"}
                    direction={sortDir}
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </SortableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Source
                  </TableHead>
                  <SortableHead
                    active={sortKey === "value"}
                    className="text-right"
                    direction={sortDir}
                    onClick={() => handleSort("value")}
                  >
                    Value
                  </SortableHead>
                  <SortableHead
                    active={sortKey === "score"}
                    direction={sortDir}
                    onClick={() => handleSort("score")}
                  >
                    Score
                  </SortableHead>
                  <SortableHead
                    active={sortKey === "createdAt"}
                    direction={sortDir}
                    onClick={() => handleSort("createdAt")}
                  >
                    Added
                  </SortableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="h-60" colSpan={10}>
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <HugeiconsIcon
                          className="opacity-30"
                          icon={Search01Icon}
                          size={32}
                          strokeWidth={1}
                        />
                        <p className="text-sm">
                          {search || statusFilter !== "all"
                            ? "No leads match your filters"
                            : "No leads yet"}
                        </p>
                        {!search && statusFilter === "all" && (
                          <Button
                            className="mt-1"
                            onClick={() => {
                              setEditLead(undefined);
                              setShowForm(true);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <HugeiconsIcon
                              icon={Add01Icon}
                              size={14}
                              strokeWidth={2}
                            />
                            Add your first lead
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((lead) => (
                  <TableRow
                    className="group cursor-pointer"
                    key={lead.id}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest(
                          "button, a, [role=menuitem], [data-slot=checkbox]"
                        )
                      ) {
                        return;
                      }
                      setPreviewLeadId(lead.id);
                    }}
                  >
                    <TableCell
                      className="pl-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selected.has(lead.id)}
                        onCheckedChange={() => toggleOne(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={lead.name} size="md" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm leading-tight">
                            {lead.name}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {lead.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.company ?? (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.assignedUser ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar name={lead.assignedUser.name} size="sm" />
                          <span className="truncate text-sm">
                            {lead.assignedUser.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {formatCents(lead.value)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const bd = computeLeadScoreBreakdown({
                          value: lead.value,
                          status: lead.status,
                          activitiesCount: 0,
                          tasksCount: 0,
                          daysSinceCreated: dayjs().diff(
                            dayjs(lead.createdAt),
                            "day"
                          ),
                        });
                        return (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  className="inline-flex cursor-default items-center gap-1.5"
                                  type="button"
                                />
                              }
                            >
                              <span
                                className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] leading-none ${getScoreBgColor(bd.total)}`}
                              >
                                {bd.total}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {bd.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              className="max-w-56 bg-card text-card-foreground ring-1 ring-border"
                              side="left"
                            >
                              <div className="space-y-1 py-0.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-medium text-[10px]">
                                    Score
                                  </span>
                                  <span
                                    className={`font-mono font-semibold text-xs ${getScoreColor(bd.total)}`}
                                  >
                                    {bd.total}/100
                                  </span>
                                </div>
                                {bd.factors.map((f) => (
                                  <div
                                    className="flex items-center justify-between gap-4"
                                    key={f.name}
                                  >
                                    <span className="text-[10px] text-muted-foreground">
                                      {f.name}
                                    </span>
                                    <span className="font-mono text-[10px]">
                                      {f.points > 0 && "+"}
                                      {f.points}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {dayjs(lead.createdAt).fromNow()}
                    </TableCell>
                    <TableCell
                      className="pr-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button size="icon-sm" variant="ghost" />}
                        >
                          <HugeiconsIcon
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            icon={MoreHorizontalIcon}
                            size={14}
                            strokeWidth={1.5}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditLead(lead);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteLead.mutate(lead.id)}
                            variant="destructive"
                          >
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

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

        {selected.size > 0 && (
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
            <span className="font-medium text-sm">
              {selected.size} selected
            </span>
            <div className="h-4 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="sm" variant="outline" />}
              >
                Change Status
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {ACTIVE_LEAD_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      bulkUpdate.mutate({ ids: [...selected], status: s });
                      setSelected(new Set());
                    }}
                  >
                    <StatusDot status={s} />
                    {STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => {
                bulkDelete.mutate([...selected]);
                setSelected(new Set());
              }}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
              Archive
            </Button>
            <button
              className="ml-1 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setSelected(new Set())}
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

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
    </div>
  );
}
