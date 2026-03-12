"use client";

import {
  Add01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState, useTransition } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
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
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  bulkDeleteLeads,
  bulkUpdateStatus,
  deleteLead,
} from "@/lib/actions/leads";
import {
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/constants";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatValue(cents: number): string {
  if (cents === 0) {
    return "—";
  }
  return `$${(cents / 100).toLocaleString()}`;
}

export function LeadsPageClient({
  initialLeads,
  counts,
}: {
  initialLeads: LeadRow[];
  counts: Record<string, number>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<LeadRow | undefined>();
  const [, startTransition] = useTransition();

  const filtered = initialLeads.filter((lead) => {
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
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
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

  function handleBulkStatus(status: string) {
    startTransition(async () => {
      await bulkUpdateStatus([...selected], status);
      setSelected(new Set());
    });
  }

  function handleBulkDelete() {
    startTransition(async () => {
      await bulkDeleteLeads([...selected]);
      setSelected(new Set());
    });
  }

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Separator className="h-5" orientation="vertical" />
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
      </header>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <HugeiconsIcon
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
              size={14}
              strokeWidth={1.5}
            />
            <Input
              className="h-8 w-64 pl-8"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              value={search}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              className={`rounded-sm px-2 py-1 text-xs transition-colors ${
                statusFilter === "all"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              All{" "}
              <span className="text-muted-foreground">{counts.all ?? 0}</span>
            </button>
            {LEAD_STATUSES.map((s) => (
              <button
                className={`rounded-sm px-2 py-1 text-xs transition-colors ${
                  statusFilter === s
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                key={s}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {STATUS_LABELS[s]}{" "}
                <span className="text-muted-foreground">{counts[s] ?? 0}</span>
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
                      onClick={() => handleBulkStatus(s)}
                    >
                      {STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleBulkDelete} size="sm" variant="outline">
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

        <div className="rounded-sm border">
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
                <TableHead>Company</TableHead>
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
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(lead.id)}
                      onCheckedChange={() => toggleOne(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      className="flex items-center gap-2 hover:underline"
                      href={`/leads/${lead.id}`}
                    >
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
                          {lead.email}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {lead.company ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-sm px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider ${STATUS_COLORS[lead.status]}`}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatValue(lead.value)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(lead.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
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
                          onClick={() =>
                            startTransition(() => deleteLead(lead.id))
                          }
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
    </>
  );
}
