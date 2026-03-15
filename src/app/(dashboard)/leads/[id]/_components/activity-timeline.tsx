import {
  ArrowRight01Icon,
  CallIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  FilterIcon,
  LinkSquare01Icon,
  Mail01Icon,
  Note01Icon,
  PlusSignIcon,
  SentIcon,
  Task01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EmptyState } from "@/components/page-skeleton";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/constants";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  content: string | null;
  createdAt: Date;
  id: string;
  metadata: unknown;
  type: string;
  user: { id: string; name: string; image: string | null } | null;
}

const ACTIVITY_CONFIG: Record<
  string,
  { icon: typeof Mail01Icon; label: string; color: string }
> = {
  lead_created: {
    icon: PlusSignIcon,
    label: "Lead Created",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  status_change: {
    icon: ArrowRight01Icon,
    label: "Status Change",
    color: "bg-blue-500/10 text-blue-600",
  },
  note: {
    icon: Note01Icon,
    label: "Note",
    color: "bg-amber-500/10 text-amber-600",
  },
  email_sent: {
    icon: SentIcon,
    label: "Email Sent",
    color: "bg-violet-500/10 text-violet-600",
  },
  outreach_email: {
    icon: Mail01Icon,
    label: "Email",
    color: "bg-violet-500/10 text-violet-600",
  },
  outreach_call: {
    icon: CallIcon,
    label: "Call",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  outreach_linkedin: {
    icon: LinkSquare01Icon,
    label: "LinkedIn",
    color: "bg-sky-500/10 text-sky-600",
  },
  task_created: {
    icon: Task01Icon,
    label: "Task Created",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  task_completed: {
    icon: CheckmarkCircle01Icon,
    label: "Task Done",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  task_deleted: {
    icon: Delete02Icon,
    label: "Task Deleted",
    color: "bg-red-500/10 text-red-600",
  },
  assignment_changed: {
    icon: UserSwitchIcon,
    label: "Reassigned",
    color: "bg-orange-500/10 text-orange-600",
  },
};

const ACTIVITY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "notes", label: "Notes", types: ["note"] },
  {
    value: "status",
    label: "Status",
    types: ["status_change", "lead_created"],
  },
  {
    value: "tasks",
    label: "Tasks",
    types: ["task_created", "task_completed", "task_deleted"],
  },
  {
    value: "outreach",
    label: "Outreach",
    types: [
      "email_sent",
      "outreach_email",
      "outreach_call",
      "outreach_linkedin",
    ],
  },
  {
    value: "other",
    label: "Other",
    types: ["assignment_changed"],
  },
];

function getFilterTypes(value: string): string[] | null {
  const opt = ACTIVITY_FILTER_OPTIONS.find((o) => o.value === value);
  return opt && "types" in opt ? (opt as { types: string[] }).types : null;
}

function countForFilter(
  activities: ActivityItem[],
  opt: (typeof ACTIVITY_FILTER_OPTIONS)[number]
): number {
  if (opt.value === "all") {
    return activities.length;
  }
  if (!("types" in opt)) {
    return 0;
  }
  return activities.filter((a) =>
    (opt as { types: string[] }).types.includes(a.type)
  ).length;
}

// ── Main component ──────────────────────────────────────────────────────────
export function ActivityTimeline({
  activities,
  activityFilter,
  setActivityFilter,
}: {
  activities: ActivityItem[];
  activityFilter: string;
  setActivityFilter: (v: string) => void;
}) {
  const filterTypes = getFilterTypes(activityFilter);

  const filtered = filterTypes
    ? activities.filter((a) => filterTypes.includes(a.type))
    : activities;

  const grouped = groupByDay(filtered);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <HugeiconsIcon
          className="mr-0.5 text-muted-foreground"
          icon={FilterIcon}
          size={12}
          strokeWidth={1.5}
        />
        {ACTIVITY_FILTER_OPTIONS.map((opt) => {
          const isActive = activityFilter === opt.value;
          const count = countForFilter(activities, opt);
          if (count === 0 && opt.value !== "all") {
            return null;
          }
          return (
            <button
              className={cn(
                "rounded-md px-2 py-1 text-[11px] transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              key={opt.value}
              onClick={() => setActivityFilter(opt.value)}
              type="button"
            >
              {opt.label}
              <span className="ml-1 font-mono text-[10px] opacity-60">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState message="No activity matches this filter" />
      )}

      {grouped.map(({ label, items }) => (
        <div key={label}>
          <div className="mb-2 flex items-center gap-2">
            <span className="shrink-0 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            <span className="h-px flex-1 bg-border/60" />
          </div>
          <div className="space-y-0">
            {items.map((a, i) => (
              <ActivityEntry
                isLast={i === items.length - 1}
                item={a}
                key={a.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function groupByDay(
  activities: ActivityItem[]
): { label: string; items: ActivityItem[] }[] {
  const map = new Map<string, ActivityItem[]>();
  for (const a of activities) {
    const d = dayjs(a.createdAt);
    let key: string;
    if (d.isToday()) {
      key = "Today";
    } else if (d.isSame(dayjs().subtract(1, "day"), "day")) {
      key = "Yesterday";
    } else if (d.isSame(dayjs(), "week")) {
      key = d.format("dddd");
    } else {
      key = d.format("MMM D, YYYY");
    }
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)?.push(a);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}

// ── Single entry ────────────────────────────────────────────────────────────
function ActivityEntry({
  item: a,
  isLast,
}: {
  item: ActivityItem;
  isLast: boolean;
}) {
  const config = ACTIVITY_CONFIG[a.type] ?? {
    icon: Note01Icon,
    label: a.type,
    color: "bg-muted text-muted-foreground",
  };
  const meta = (a.metadata ?? {}) as Record<string, unknown>;

  return (
    <div
      className={cn(
        "relative flex gap-3 pb-4 pl-7",
        !isLast && "border-border/40 border-l"
      )}
      style={{ marginLeft: "13px" }}
    >
      <div
        className={cn(
          "absolute top-0.5 -left-[13px] flex size-[26px] items-center justify-center rounded-full",
          config.color
        )}
      >
        <HugeiconsIcon icon={config.icon} size={12} strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-[11px] text-muted-foreground">
            {config.label}
          </span>
          <span
            className="shrink-0 text-[10px] text-muted-foreground/60"
            title={dayjs(a.createdAt).format("MMM D, YYYY h:mm A")}
          >
            {dayjs(a.createdAt).format("h:mm A")}
          </span>
        </div>

        <ActivityContent content={a.content} meta={meta} type={a.type} />

        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {a.user?.name ?? "System"}
        </p>
      </div>
    </div>
  );
}

// ── Rich content per type ───────────────────────────────────────────────────
function StatusChangePill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider",
        STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function StatusChangeContent({
  content,
  meta,
}: {
  content: string | null;
  meta: Record<string, unknown>;
}) {
  const oldStatus = meta.oldStatus as string | undefined;
  const newStatus = meta.newStatus as string | undefined;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {oldStatus && (
        <>
          <StatusChangePill status={oldStatus} />
          <HugeiconsIcon
            className="text-muted-foreground/40"
            icon={ArrowRight01Icon}
            size={10}
            strokeWidth={2}
          />
        </>
      )}
      {newStatus && <StatusChangePill status={newStatus} />}
      {content && !content.startsWith("Status changed") && (
        <span className="ml-1 text-muted-foreground text-xs">{content}</span>
      )}
    </div>
  );
}

function TaskActivityContent({
  type,
  content,
  meta,
}: {
  type: string;
  content: string | null;
  meta: Record<string, unknown>;
}) {
  const taskType = meta.taskType as string | undefined;
  const dueAt = meta.dueAt as string | undefined;
  return (
    <div className="mt-1">
      <p className="text-[13px]">{content}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        {taskType && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {TASK_TYPE_LABELS[taskType] ?? taskType}
          </span>
        )}
        {dueAt && type === "task_created" && (
          <span className="text-[10px] text-muted-foreground/60">
            due {dayjs(dueAt).format("MMM D, h:mm A")}
          </span>
        )}
      </div>
    </div>
  );
}

function AssignmentContent({ meta }: { meta: Record<string, unknown> }) {
  const prev = meta.previousAssignee as string | null | undefined;
  const next = meta.newAssignee as string | null | undefined;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px]">
      {prev && (
        <>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
            {prev}
          </span>
          <HugeiconsIcon
            className="text-muted-foreground/40"
            icon={ArrowRight01Icon}
            size={10}
            strokeWidth={2}
          />
        </>
      )}
      {next ? (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
          {next}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">Unassigned</span>
      )}
    </div>
  );
}

function ActivityContent({
  type,
  content,
  meta,
}: {
  type: string;
  content: string | null;
  meta: Record<string, unknown>;
}) {
  if (type === "status_change") {
    return <StatusChangeContent content={content} meta={meta} />;
  }
  if (type === "lead_created") {
    const source = meta.source as string | undefined;
    return (
      <div className="mt-1">
        <p className="text-[13px]">{content}</p>
        {source && (
          <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            via {source}
          </span>
        )}
      </div>
    );
  }
  if (type === "task_created" || type === "task_completed") {
    return <TaskActivityContent content={content} meta={meta} type={type} />;
  }
  if (type === "task_deleted") {
    return (
      <div className="mt-1">
        <p className="text-[13px] text-muted-foreground line-through">
          {content}
        </p>
      </div>
    );
  }
  if (type === "assignment_changed") {
    return <AssignmentContent meta={meta} />;
  }
  if (type === "note") {
    return (
      <div className="mt-1 rounded-lg bg-amber-500/5 px-3 py-2">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
          {content}
        </p>
      </div>
    );
  }
  return content ? <p className="mt-1 text-[13px]">{content}</p> : null;
}
