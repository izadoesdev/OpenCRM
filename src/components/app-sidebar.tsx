"use client";

import {
  Contact01Icon,
  DashboardBrowsingIcon,
  FilterIcon,
  Logout01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { useGoogleConnection } from "@/lib/queries";
import { getInitials } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/", icon: DashboardBrowsingIcon },
  { title: "Leads", href: "/leads", icon: Contact01Icon },
  { title: "Pipeline", href: "/pipeline", icon: FilterIcon },
  { title: "Tasks", href: "/tasks", icon: Task01Icon },
];

function googleStatusColor(gConn: {
  connected: boolean;
  hasCalendar: boolean;
  hasGmail: boolean;
}) {
  if (gConn.hasCalendar && gConn.hasGmail) {
    return "bg-emerald-400";
  }
  if (gConn.connected) {
    return "bg-amber-400";
  }
  return "bg-red-400";
}

function googleStatusLabel(gConn: {
  connected: boolean;
  hasCalendar: boolean;
  hasGmail: boolean;
}) {
  if (gConn.hasCalendar && gConn.hasGmail) {
    return "Google connected";
  }
  if (gConn.connected) {
    return "Reconnect for Calendar + Gmail";
  }
  return "Google not connected";
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;
  const { data: gConn } = useGoogleConnection();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="px-3 py-3">
        <Link className="flex items-center gap-2.5 px-2" href="/">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground text-xs">
            D
          </div>
          <span className="font-semibold text-sm tracking-tight group-data-[collapsible=icon]:hidden">
            DataCRM
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
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

      <SidebarFooter className="border-t px-3 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user?.name ?? "Account"}>
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-sm">
                  {user?.name ?? "Loading..."}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {user?.email ?? ""}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {gConn && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-3 py-1.5 group-data-[collapsible=icon]:hidden">
                <span
                  className={`size-1.5 rounded-full ${googleStatusColor(gConn)}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {googleStatusLabel(gConn)}
                </span>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await signOut();
                router.push("/sign-in");
                router.refresh();
              }}
              tooltip="Sign out"
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.5} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
