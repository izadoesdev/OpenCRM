"use client";

import {
  Add01Icon,
  Alert02Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Task01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { IconSelect, Pill } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/page-skeleton";
import { SegmentedControl } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { TASK_TYPE_LABELS, TASK_TYPES } from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import {
  useDeleteTask,
  useTasks,
  useTeamMembers,
  useToggleTask,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { AddTaskForm } from "./_components/add-task-form";
import { TaskRow, type TaskWithLead } from "./_components/task-row";

function emptyMessage(
  section: string,
  typeFilter: string,
  showCompleted: boolean
): string {
  if (section !== "all") {
    return `No ${section} tasks`;
  }
  if (typeFilter !== "all") {
    return `No ${TASK_TYPE_LABELS[typeFilter]?.toLowerCase() ?? typeFilter} tasks`;
  }
  return showCompleted ? "No tasks at all" : "All caught up — nothing due";
}

const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  ...TASK_TYPES.map((t) => ({
    value: t,
    label: TASK_TYPE_LABELS[t] ?? t,
  })),
];

// ── Summary stat ────────────────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  count,
  color,
  active,
  onClick,
}: {
  icon: typeof Task01Icon;
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
        active
          ? "border-border bg-background"
          : "border-transparent bg-background/60 hover:bg-background"
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className={cn("flex items-center justify-center rounded-md p-1", color)}
      >
        <HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} />
      </div>
      <div>
        <span className="font-mono font-semibold text-lg tabular-nums leading-none">
          {count}
        </span>
        <span className="ml-1.5 text-muted-foreground text-xs">{label}</span>
      </div>
    </button>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function TaskSection({
  title,
  count,
  accent,
  icon,
  children,
}: {
  title: string;
  count: number;
  accent?: string;
  icon: typeof Task01Icon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div
          className={cn(
            "flex items-center justify-center rounded-md p-1",
            accent ?? "bg-muted text-muted-foreground"
          )}
        >
          <HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} />
        </div>
        <h2 className="font-semibold text-[13px]">{title}</h2>
        <Pill>{count}</Pill>
      </div>
      <div className="border-t px-1.5 py-1.5">{children}</div>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function TasksSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <h1 className="font-semibold text-lg tracking-tight">Tasks</h1>
      </PageHeader>
      <div className="flex-1 overflow-y-auto bg-muted/20 p-5">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex gap-3">
            {["sk-a", "sk-b", "sk-c", "sk-d"].map((k) => (
              <div
                className="h-16 flex-1 animate-pulse rounded-lg bg-muted/40"
                key={k}
              />
            ))}
          </div>
          {["sk-s1", "sk-s2"].map((k) => (
            <div
              className="animate-pulse rounded-xl border bg-background"
              key={k}
            >
              <div className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-muted/60" />
              </div>
              <div className="space-y-px border-t p-1.5">
                <div className="h-14 rounded-lg bg-muted/30" />
                <div className="h-14 rounded-lg bg-muted/30" />
                <div className="h-14 w-3/4 rounded-lg bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Task filters ────────────────────────────────────────────────────────────
function TaskFilters({
  overdueCount,
  todayCount,
  upcomingCount,
  typeFilter,
  setTypeFilter,
  showCompleted,
  setShowCompleted,
  sectionFilter,
  setSectionFilter,
}: {
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  showCompleted: boolean;
  setShowCompleted: (v: boolean) => void;
  sectionFilter: "all" | "overdue" | "today" | "upcoming";
  setSectionFilter: (v: "all" | "overdue" | "today" | "upcoming") => void;
}) {
  return (
    <>
      <div className="flex gap-2.5">
        <StatPill
          active={sectionFilter === "overdue"}
          color="bg-red-500/10 text-red-500"
          count={overdueCount}
          icon={Alert02Icon}
          label="Overdue"
          onClick={() =>
            setSectionFilter(sectionFilter === "overdue" ? "all" : "overdue")
          }
        />
        <StatPill
          active={sectionFilter === "today"}
          color="bg-amber-500/10 text-amber-500"
          count={todayCount}
          icon={Clock01Icon}
          label="Today"
          onClick={() =>
            setSectionFilter(sectionFilter === "today" ? "all" : "today")
          }
        />
        <StatPill
          active={sectionFilter === "upcoming"}
          color="bg-blue-500/10 text-blue-500"
          count={upcomingCount}
          icon={Calendar03Icon}
          label="Upcoming"
          onClick={() =>
            setSectionFilter(sectionFilter === "upcoming" ? "all" : "upcoming")
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Select onValueChange={(v) => v && setTypeFilter(v)} value={typeFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <span className="flex-1 truncate text-left">
              {TYPE_FILTERS.find((f) => f.value === typeFilter)?.label ??
                "All types"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setShowCompleted(!showCompleted)}
          size="sm"
          variant={showCompleted ? "default" : "outline"}
        >
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={13}
            strokeWidth={1.5}
          />
          {showCompleted ? "Showing Done" : "Show Done"}
        </Button>
        {(typeFilter !== "all" || sectionFilter !== "all") && (
          <button
            className="ml-1 cursor-pointer text-muted-foreground text-xs transition-colors hover:text-foreground"
            onClick={() => {
              setTypeFilter("all");
              setSectionFilter("all");
            }}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>
    </>
  );
}

// ── Task sections ───────────────────────────────────────────────────────────
function TaskSections({
  overdue,
  today,
  upcoming,
  completed,
  showOverdue,
  showToday,
  showUpcoming,
  showCompleted,
  expandedId,
  onToggleExpand,
  toggleTask,
  deleteTask,
  showAssignee,
}: {
  overdue: TaskWithLead[];
  today: TaskWithLead[];
  upcoming: TaskWithLead[];
  completed: TaskWithLead[];
  showOverdue: boolean;
  showToday: boolean;
  showUpcoming: boolean;
  showCompleted: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  toggleTask: ReturnType<typeof useToggleTask>;
  deleteTask: ReturnType<typeof useDeleteTask>;
  showAssignee: boolean;
}) {
  function rows(items: TaskWithLead[]) {
    return items.map((t) => (
      <TaskRow
        expanded={expandedId === t.id}
        key={t.id}
        onDelete={() => deleteTask.mutate({ id: t.id, leadId: t.leadId })}
        onToggleComplete={() =>
          toggleTask.mutate({
            id: t.id,
            isComplete: !!t.completedAt,
            leadId: t.leadId,
          })
        }
        onToggleExpand={() => onToggleExpand(t.id)}
        showAssignee={showAssignee}
        task={t}
      />
    ));
  }

  return (
    <>
      {showOverdue && overdue.length > 0 && (
        <TaskSection
          accent="bg-red-500/10 text-red-500"
          count={overdue.length}
          icon={Alert02Icon}
          title="Overdue"
        >
          {rows(overdue)}
        </TaskSection>
      )}
      {showToday && today.length > 0 && (
        <TaskSection
          accent="bg-amber-500/10 text-amber-500"
          count={today.length}
          icon={Clock01Icon}
          title="Today"
        >
          {rows(today)}
        </TaskSection>
      )}
      {showUpcoming && upcoming.length > 0 && (
        <TaskSection
          accent="bg-blue-500/10 text-blue-500"
          count={upcoming.length}
          icon={Calendar03Icon}
          title="Upcoming"
        >
          {rows(upcoming)}
        </TaskSection>
      )}
      {showCompleted && completed.length > 0 && (
        <TaskSection
          accent="bg-emerald-500/10 text-emerald-500"
          count={completed.length}
          icon={CheckmarkCircle01Icon}
          title="Completed"
        >
          {rows(completed)}
        </TaskSection>
      )}
    </>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export function TasksPageClient() {
  const session = useSession();
  const currentUserId = session.data?.user?.id;

  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState<
    "all" | "overdue" | "today" | "upcoming"
  >("all");

  function getEffectiveUser() {
    if (viewMode === "mine") {
      return currentUserId;
    }
    if (userFilter !== "all") {
      return userFilter;
    }
    return undefined;
  }
  const effectiveUserId = getEffectiveUser();

  const { data: allTasks = [], isLoading } = useTasks({
    userId: effectiveUserId ?? null,
  });
  const { data: teamMembers = [] } = useTeamMembers();
  const toggleTask = useToggleTask();
  const deleteTaskMut = useDeleteTask();

  const {
    overdue,
    today,
    upcoming,
    completed,
    overdueCount,
    todayCount,
    upcomingCount,
  } = useMemo(() => {
    const allRaw = allTasks as TaskWithLead[];
    const isOverdue = (t: TaskWithLead) =>
      !t.completedAt && dayjs(t.dueAt).isBefore(dayjs(), "minute");
    const isToday = (t: TaskWithLead) =>
      !t.completedAt &&
      dayjs(t.dueAt).isToday() &&
      !dayjs(t.dueAt).isBefore(dayjs(), "minute");
    const isUpcoming = (t: TaskWithLead) =>
      !(
        t.completedAt ||
        dayjs(t.dueAt).isToday() ||
        dayjs(t.dueAt).isBefore(dayjs(), "minute")
      );

    let filtered = allRaw;
    if (!showCompleted) {
      filtered = filtered.filter((t) => !t.completedAt);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    return {
      overdue: filtered.filter(isOverdue),
      today: filtered.filter(isToday),
      upcoming: filtered.filter(isUpcoming),
      completed: filtered.filter((t) => !!t.completedAt),
      overdueCount: allRaw.filter(isOverdue).length,
      todayCount: allRaw.filter(isToday).length,
      upcomingCount: allRaw.filter(isUpcoming).length,
    };
  }, [allTasks, showCompleted, typeFilter]);

  const openCount = (allTasks as TaskWithLead[]).filter(
    (t) => !t.completedAt
  ).length;

  if (isLoading) {
    return <TasksSkeleton />;
  }

  const showOverdue = sectionFilter === "all" || sectionFilter === "overdue";
  const showToday = sectionFilter === "all" || sectionFilter === "today";
  const showUpcoming = sectionFilter === "all" || sectionFilter === "upcoming";

  const visibleCount =
    (showOverdue ? overdue.length : 0) +
    (showToday ? today.length : 0) +
    (showUpcoming ? upcoming.length : 0) +
    (showCompleted ? completed.length : 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="font-semibold text-lg tracking-tight">Tasks</h1>
            {openCount > 0 && <Pill>{openCount} open</Pill>}
          </div>

          <div className="flex items-center gap-2">
            <SegmentedControl
              onChange={(v) => {
                setViewMode(v);
                if (v === "mine") {
                  setUserFilter("all");
                }
              }}
              segments={[
                { value: "mine" as const, label: "My Tasks" },
                { value: "all" as const, label: "All Tasks" },
              ]}
              value={viewMode}
            />

            {viewMode === "all" && teamMembers.length > 1 && (
              <IconSelect
                className="h-8 w-[140px]"
                displayValue={
                  userFilter === "all"
                    ? "Everyone"
                    : ((
                        teamMembers as Array<{ id: string; name: string }>
                      ).find((m) => m.id === userFilter)?.name ?? "Select…")
                }
                icon={UserIcon}
                onValueChange={setUserFilter}
                value={userFilter}
              >
                <SelectItem value="all">Everyone</SelectItem>
                {(
                  teamMembers as Array<{
                    id: string;
                    name: string;
                    email: string;
                  }>
                ).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </IconSelect>
            )}

            <Button onClick={() => setShowAddTask(!showAddTask)} size="sm">
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Add Task
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
        <div className="mx-auto max-w-3xl space-y-5 p-5">
          <TaskFilters
            overdueCount={overdueCount}
            sectionFilter={sectionFilter}
            setSectionFilter={setSectionFilter}
            setShowCompleted={setShowCompleted}
            setTypeFilter={setTypeFilter}
            showCompleted={showCompleted}
            todayCount={todayCount}
            typeFilter={typeFilter}
            upcomingCount={upcomingCount}
          />

          {/* ── Add task form ── */}
          {showAddTask && (
            <AddTaskForm
              currentUserId={currentUserId}
              onClose={() => setShowAddTask(false)}
              teamMembers={
                teamMembers as Array<{
                  id: string;
                  name: string;
                  email: string;
                }>
              }
            />
          )}

          {/* ── Empty state ── */}
          {visibleCount === 0 && !showAddTask && (
            <div className="rounded-xl border bg-background">
              <EmptyState
                className="py-20"
                icon={
                  <HugeiconsIcon icon={Task01Icon} size={36} strokeWidth={1} />
                }
                message={emptyMessage(sectionFilter, typeFilter, showCompleted)}
              />
            </div>
          )}

          {/* ── Sections ── */}
          <TaskSections
            completed={completed}
            deleteTask={deleteTaskMut}
            expandedId={expandedId}
            onToggleExpand={(id) =>
              setExpandedId(expandedId === id ? null : id)
            }
            overdue={overdue}
            showAssignee={viewMode === "all"}
            showCompleted={showCompleted}
            showOverdue={showOverdue}
            showToday={showToday}
            showUpcoming={showUpcoming}
            today={today}
            toggleTask={toggleTask}
            upcoming={upcoming}
          />
        </div>
      </div>
    </div>
  );
}
