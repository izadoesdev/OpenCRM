"use client";

import {
  Add01Icon,
  Analytics01Icon,
  CallIcon,
  Contact01Icon,
  Dollar01Icon,
  Mail01Icon,
  Target01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

type Stats = {
  totalLeads: number;
  qualified: number;
  conversionRate: string;
  revenue: number;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  value: number;
  createdAt: Date;
};

type Task = {
  id: string;
  title: string;
  dueAt: Date;
  type: string;
  completedAt: Date | null;
  lead: { id: string; name: string } | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardClient({
  stats,
  recentLeads,
  upcomingTasks,
}: {
  stats: Stats;
  recentLeads: Lead[];
  upcomingTasks: Task[];
}) {
  const [showForm, setShowForm] = useState(false);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Contact01Icon,
    },
    {
      title: "Qualified",
      value: stats.qualified.toLocaleString(),
      icon: Target01Icon,
    },
    {
      title: "Conversion",
      value: stats.conversionRate,
      icon: Analytics01Icon,
    },
    {
      title: "Revenue",
      value:
        stats.revenue > 0 ? `$${(stats.revenue / 100).toLocaleString()}` : "$0",
      icon: Dollar01Icon,
    },
  ];

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Separator className="h-5" orientation="vertical" />
        <div className="flex flex-1 items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight">Dashboard</h1>
          <Button onClick={() => setShowForm(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            Add Lead
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-normal text-muted-foreground text-sm">
                  <HugeiconsIcon icon={stat.icon} size={16} strokeWidth={1.5} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-2xl tracking-tight">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardAction>
                <Button
                  render={<Link href="/leads" />}
                  size="sm"
                  variant="ghost"
                >
                  View all
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {recentLeads.length === 0 && (
                <p className="py-6 text-center text-muted-foreground text-sm">
                  No leads yet. Add your first lead to get started.
                </p>
              )}
              {recentLeads.map((lead) => (
                <Link
                  className="flex items-center gap-3 rounded-sm p-2 transition-colors hover:bg-muted/50"
                  href={`/leads/${lead.id}`}
                  key={lead.id}
                >
                  <Avatar>
                    <AvatarFallback className="bg-muted font-medium text-muted-foreground text-xs">
                      {getInitials(lead.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-sm">
                        {lead.name}
                      </p>
                      <span
                        className={`inline-flex rounded-sm px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wider ${STATUS_COLORS[lead.status]}`}
                      >
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </div>
                    <p className="truncate text-muted-foreground text-xs">
                      {lead.company ?? lead.email}
                    </p>
                  </div>
                  {lead.value > 0 && (
                    <span className="hidden font-mono text-sm sm:block">
                      ${(lead.value / 100).toLocaleString()}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(lead.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardAction>
                <Button
                  render={<Link href="/tasks" />}
                  size="sm"
                  variant="ghost"
                >
                  View all
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {upcomingTasks.length === 0 && (
                <p className="py-6 text-center text-muted-foreground text-sm">
                  No upcoming tasks
                </p>
              )}
              {upcomingTasks.map((task) => {
                const overdue =
                  !task.completedAt && isPast(new Date(task.dueAt));
                return (
                  <div
                    className="flex items-start gap-3 rounded-sm p-2 transition-colors hover:bg-muted/50"
                    key={task.id}
                  >
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted">
                      <HugeiconsIcon
                        className="text-muted-foreground"
                        icon={
                          task.type === "call"
                            ? CallIcon
                            : task.type === "email"
                              ? Mail01Icon
                              : Task01Icon
                        }
                        size={14}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{task.title}</p>
                      <p
                        className={`text-xs ${overdue ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {format(new Date(task.dueAt), "MMM d, h:mm a")}
                        {overdue && " (overdue)"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadFormDialog onOpenChange={setShowForm} open={showForm} />
    </>
  );
}
