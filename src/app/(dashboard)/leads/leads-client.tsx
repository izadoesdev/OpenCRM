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
import { computeLeadScore, getScoreBgColor } from "@/lib/scoring";
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
      className={`cursor-pointer select-none hover:bg-muted/50 ${className ?? ""}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-0.5">
        {children}
        {active && (
          <HugeiconsIcon
            icon={direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
            size={10}
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
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-medium text-sm">Lead Preview</h2>
          <Button onClick={onClose} size="icon-sm" variant="ghost">
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
          </Button>
        </div>

        {isLoading || !lead ? (
          <div className="flex-1 p-4">
            <div className="space-y-3">
              <div className="h-8 w-48 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted/40" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted/40" />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={lead.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-base">{lead.name}</p>
                {lead.company && (
                  <p className="truncate text-muted-foreground text-xs">
                    {lead.company}
                  </p>
                )}
              </div>
              <StatusBadge status={lead.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Email</span>
                <span className="text-xs">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Phone</span>
                  <span className="text-xs">{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Value</span>
                <span className="font-mono text-xs">
                  {formatCents(lead.value)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Source</span>
                <span className="text-xs">
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Added</span>
                <span className="text-xs">
                  {dayjs(lead.createdAt).fromNow()}
                </span>
              </div>
              {lead.customFields &&
                Object.keys(lead.customFields as Record<string, string>)
                  .length > 0 && (
                  <div className="mt-2 space-y-2 border-t pt-2">
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
                        <span className="text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              {lead.assignedUser && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Assigned
                  </span>
                  <span className="text-xs">{lead.assignedUser.name}</span>
                </div>
              )}
            </div>

            {lead.tasks && (
              <div className="mt-4 border-t pt-3">
                <p className="font-medium text-xs">
                  Tasks (
                  {
                    lead.tasks.filter(
                      (t: { completedAt: Date | null }) => !t.completedAt
                    ).length
                  }{" "}
                  open)
                </p>
              </div>
            )}

            {lead.activities && lead.activities.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="font-medium text-xs">Last Activity</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {
                    (
                      lead.activities as Array<{
                        content: string;
                        createdAt: Date;
                      }>
                    )[0].content
                  }
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {dayjs(
                    (lead.activities as Array<{ createdAt: Date }>)[0].createdAt
                  ).fromNow()}
                </p>
              </div>
            )}

            <Button
              className="mt-6 w-full"
              onClick={() => router.push(`/leads/${leadId}`)}
              size="sm"
            >
              View Full Detail
            </Button>
          </div>
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
      case "status":
        return mult * a.status.localeCompare(b.status);
      case "value":
        return mult * (a.value - b.value);
      case "score": {
        const scoreA = computeLeadScore({
          value: a.value,
          status: a.status,
          activitiesCount: 0,
          tasksCount: 0,
          daysSinceCreated: Math.floor(
            (Date.now() - new Date(a.createdAt).getTime()) / 86_400_000
          ),
        });
        const scoreB = computeLeadScore({
          value: b.value,
          status: b.status,
          activitiesCount: 0,
          tasksCount: 0,
          daysSinceCreated: Math.floor(
            (Date.now() - new Date(b.createdAt).getTime()) / 86_400_000
          ),
        });
        return mult * (scoreA - scoreB);
      }
      case "createdAt":
        return (
          mult *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
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
    return (
      <div className="flex h-full flex-col">
        <PageHeader>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="font-semibold text-lg tracking-tight">Leads</h1>
          </div>
        </PageHeader>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            <div className="h-8 w-64 animate-pulse rounded-md bg-muted/60" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  className="h-12 w-full animate-pulse rounded-md bg-muted/40"
                  key={`skel-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    i
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight">Leads</h1>
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

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <HugeiconsIcon
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              size={14}
              strokeWidth={1.5}
            />
            <Input
              className="h-8 w-64 pr-7 pl-8"
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

          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            <button
              className={`rounded-sm px-2.5 py-1 text-xs transition-colors ${
                statusFilter === "all"
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              All
              <span className="ml-1 font-mono text-muted-foreground">
                {counts.all ?? 0}
              </span>
            </button>
            {ACTIVE_LEAD_STATUSES.map((s) => (
              <button
                className={`rounded-sm px-2.5 py-1 text-xs transition-colors ${
                  statusFilter === s
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                key={s}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {STATUS_LABELS[s]}
                {(counts[s] ?? 0) > 0 && (
                  <span className="ml-1 font-mono text-muted-foreground">
                    {counts[s]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {selected.size} selected
              </span>
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
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={14}
                  strokeWidth={1.5}
                />
                Archive
              </Button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
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
                <TableHead>Assigned To</TableHead>
                <SortableHead
                  active={sortKey === "status"}
                  direction={sortDir}
                  onClick={() => handleSort("status")}
                >
                  Status
                </SortableHead>
                <TableHead>Source</TableHead>
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
                <TableRow>
                  <TableCell
                    className="py-12 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    No leads found
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((lead) => (
                <TableRow
                  className="cursor-pointer"
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(lead.id)}
                      onCheckedChange={() => toggleOne(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={lead.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">
                          {lead.name}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {lead.company
                            ? `${lead.company} · ${lead.email}`
                            : lead.email}
                        </p>
                      </div>
                    </div>
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
                  <TableCell className="text-right font-mono text-sm">
                    {formatCents(lead.value)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const score = computeLeadScore({
                        value: lead.value,
                        status: lead.status,
                        activitiesCount: 0,
                        tasksCount: 0,
                        daysSinceCreated: Math.floor(
                          (Date.now() - new Date(lead.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ),
                      });
                      return (
                        <span
                          className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${getScoreBgColor(score)}`}
                        >
                          {score}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {dayjs(lead.createdAt).fromNow()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button size="icon-sm" variant="ghost" />}
                      >
                        <HugeiconsIcon
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
