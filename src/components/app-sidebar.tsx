"use client";

import {
  Contact01Icon,
  DashboardBrowsingIcon,
  DollarCircleIcon,
  FilterIcon,
  Logout01Icon,
  PresentationBarChart01Icon,
  Settings01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/micro";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { useTasks } from "@/lib/queries";

const MAIN_NAV = [
  { title: "Dashboard", href: "/", icon: DashboardBrowsingIcon },
  { title: "Leads", href: "/leads", icon: Contact01Icon },
  { title: "Pipeline", href: "/pipeline", icon: FilterIcon },
  { title: "Tasks", href: "/tasks", icon: Task01Icon, badge: "tasks" as const },
];

const SECONDARY_NAV = [
  {
    title: "Reporting",
    href: "/reporting",
    icon: PresentationBarChart01Icon,
  },
  { title: "Finances", href: "/finances", icon: DollarCircleIcon },
  { title: "Settings", href: "/settings", icon: Settings01Icon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: tasks } = useTasks();

  const user = session?.user;
  const openTaskCount = tasks?.filter((t) => !t.completedAt).length ?? 0;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={active ? 2 : 1.5}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge === "tasks" && openTaskCount > 0 && (
                      <SidebarMenuBadge className="font-mono text-[10px] text-muted-foreground">
                        {openTaskCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={active ? 2 : 1.5}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user?.name ?? "Account"}
                  />
                }
              >
                <UserAvatar name={user?.name} size="md" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-sm">
                    {user?.name ?? "Loading..."}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {user?.email ?? ""}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" side="top">
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <HugeiconsIcon
                    icon={Settings01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    router.push("/sign-in");
                    router.refresh();
                  }}
                  variant="destructive"
                >
                  <HugeiconsIcon
                    icon={Logout01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
