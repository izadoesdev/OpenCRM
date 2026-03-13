"use client";

import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useBulkDeleteLeads,
  useBulkUpdateStatus,
  useDeleteLead,
  useLeadCounts,
  useLeads,
} from "@/lib/queries";
import { formatCents, getInitials } from "@/lib/utils";

export function LeadsPageClient() {
  const router = useRouter();
  const { data: leads = [], isLoading } = useLeads();
  const { data: counts = {} } = useLeadCounts();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<LeadRow | undefined>();

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

  function toggleAll() {
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((l) => l.id))
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
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight">Leads</h1>
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
            {LEAD_STATUSES.map((s) => (
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
                  {LEAD_STATUSES.map((s) => (
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
                Delete
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
                      filtered.length > 0 && selected.size === filtered.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    className="py-12 text-center text-muted-foreground"
                    colSpan={8}
                  >
                    No leads found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((lead) => (
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
                    router.push(`/leads/${lead.id}`);
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
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
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
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                            {getInitials(lead.assignedUser.name)}
                          </AvatarFallback>
                        </Avatar>
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
                          Delete
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
    </div>
  );
}
