import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading dashboard...
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}

async function DashboardInner() {
  const { getDashboardStats, getRecentLeads, getUpcomingTasks } = await import(
    "@/lib/actions/dashboard"
  );

  const [stats, recentLeads, upcomingTasks] = await Promise.all([
    getDashboardStats(),
    getRecentLeads(),
    getUpcomingTasks(),
  ]);

  return (
    <DashboardClient
      recentLeads={recentLeads}
      stats={stats}
      upcomingTasks={upcomingTasks}
    />
  );
}
