"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  MoreHorizontalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAvatar } from "@/components/micro";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SOURCE_LABELS } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  computeLeadScoreBreakdown,
  getScoreBgColor,
  getScoreColor,
} from "@/lib/scoring";
import { cn, formatCents } from "@/lib/utils";

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
      className={cn(
        "cursor-pointer select-none text-muted-foreground text-xs transition-colors hover:text-foreground",
        className
      )}
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

export function LeadsTable({
  leads,
  sortKey,
  sortDir,
  selected,
  search,
  statusFilter,
  onSort,
  onToggleAll,
  onToggleOne,
  onPreview,
  onEdit,
  onArchive,
  onAddFirst,
}: {
  leads: LeadRow[];
  sortKey: string;
  sortDir: "asc" | "desc";
  selected: Set<string>;
  search: string;
  statusFilter: string;
  onSort: (key: string) => void;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onPreview: (id: string) => void;
  onEdit: (lead: LeadRow) => void;
  onArchive: (id: string) => void;
  onAddFirst: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
      <div className="h-full overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pl-3">
                <Checkbox
                  checked={leads.length > 0 && selected.size === leads.length}
                  onCheckedChange={onToggleAll}
                />
              </TableHead>
              <SortableHead
                active={sortKey === "name"}
                direction={sortDir}
                onClick={() => onSort("name")}
              >
                Name
              </SortableHead>
              <SortableHead
                active={sortKey === "company"}
                direction={sortDir}
                onClick={() => onSort("company")}
              >
                Company
              </SortableHead>
              <TableHead className="text-muted-foreground text-xs">
                Assigned To
              </TableHead>
              <SortableHead
                active={sortKey === "status"}
                direction={sortDir}
                onClick={() => onSort("status")}
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
                onClick={() => onSort("value")}
              >
                Value
              </SortableHead>
              <SortableHead
                active={sortKey === "score"}
                direction={sortDir}
                onClick={() => onSort("score")}
              >
                Score
              </SortableHead>
              <SortableHead
                active={sortKey === "createdAt"}
                direction={sortDir}
                onClick={() => onSort("createdAt")}
              >
                Added
              </SortableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
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
                        onClick={onAddFirst}
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
            {leads.map((lead) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                onArchive={onArchive}
                onEdit={onEdit}
                onPreview={onPreview}
                onToggle={onToggleOne}
                selected={selected.has(lead.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LeadTableRow({
  lead,
  selected,
  onToggle,
  onPreview,
  onEdit,
  onArchive,
}: {
  lead: LeadRow;
  selected: boolean;
  onToggle: (id: string) => void;
  onPreview: (id: string) => void;
  onEdit: (lead: LeadRow) => void;
  onArchive: (id: string) => void;
}) {
  const bd = computeLeadScoreBreakdown({
    value: lead.value,
    status: lead.status,
    activitiesCount: 0,
    tasksCount: 0,
    daysSinceCreated: dayjs().diff(dayjs(lead.createdAt), "day"),
  });

  return (
    <TableRow
      className="group cursor-pointer"
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest(
            "button, a, [role=menuitem], [data-slot=checkbox]"
          )
        ) {
          return;
        }
        onPreview(lead.id);
      }}
    >
      <TableCell className="pl-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(lead.id)}
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
        {lead.company ?? <span className="text-muted-foreground/40">—</span>}
      </TableCell>
      <TableCell>
        {lead.assignedUser ? (
          <div className="flex items-center gap-2">
            <UserAvatar name={lead.assignedUser.name} size="sm" />
            <span className="truncate text-sm">{lead.assignedUser.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/40 text-xs">Unassigned</span>
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
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] leading-none",
                getScoreBgColor(bd.total)
              )}
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
                <span className="font-medium text-[10px]">Score</span>
                <span
                  className={cn(
                    "font-mono font-semibold text-xs",
                    getScoreColor(bd.total)
                  )}
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
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {dayjs(lead.createdAt).fromNow()}
      </TableCell>
      <TableCell className="pr-3" onClick={(e) => e.stopPropagation()}>
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
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onArchive(lead.id)}
              variant="destructive"
            >
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
