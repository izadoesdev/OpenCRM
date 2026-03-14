"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { QueryProvider } from "@/components/query-provider";
import { TaskSuggestionProvider } from "@/components/task-suggestion-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <TaskSuggestionProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
          <CommandMenu />
        </SidebarProvider>
      </TaskSuggestionProvider>
    </QueryProvider>
  );
}
