import { Suspense } from "react";
import { TasksPageClient } from "./tasks-client";

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading tasks...
        </div>
      }
    >
      <TasksPageInner />
    </Suspense>
  );
}

async function TasksPageInner() {
  const { getTasks } = await import("@/lib/actions/tasks");
  const tasks = await getTasks({ showCompleted: true });
  return <TasksPageClient initialTasks={tasks} />;
}
