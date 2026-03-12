"use client";

import {
  Analytics01Icon,
  Building01Icon,
  Calendar01Icon,
  Contact01Icon,
  DashboardBrowsingIcon,
  FilterIcon,
  Logout01Icon,
  Mail01Icon,
  Setting06Icon,
  SparklesIcon,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";

const mainNav = [
  { title: "Dashboard", href: "/", icon: DashboardBrowsingIcon },
  { title: "Leads", href: "/leads", icon: Contact01Icon },
  { title: "Pipeline", href: "/pipeline", icon: FilterIcon },
  { title: "Companies", href: "/companies", icon: Building01Icon },
  { title: "Tasks", href: "/tasks", icon: Task01Icon },
];

const secondaryNav = [
  { title: "Email", href: "/email", icon: Mail01Icon },
  { title: "Calendar", href: "/calendar", icon: Calendar01Icon },
  { title: "Analytics", href: "/analytics", icon: Analytics01Icon },
  { title: "AI Insights", href: "/insights", icon: SparklesIcon },
];

function getInitials(name: string | undefined | null): string {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                    tooltip={item.title}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={18}
                      strokeWidth={pathname === item.href ? 2 : 1.5}
                    />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                    tooltip={item.title}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={18}
                      strokeWidth={pathname === item.href ? 2 : 1.5}
                    />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              tooltip="Settings"
            >
              <HugeiconsIcon icon={Setting06Icon} size={18} strokeWidth={1.5} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user?.name ?? "Account"}>
              <Avatar className="size-7">
                <AvatarFallback className="bg-muted font-medium text-muted-foreground text-xs">
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
