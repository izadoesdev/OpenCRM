import { SidebarTrigger } from "@/components/ui/sidebar";

export function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex h-12 shrink-0 items-center border-b px-4">
      <SidebarTrigger className="mr-2 -ml-1" />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        {children}
      </div>
    </header>
  );
}
