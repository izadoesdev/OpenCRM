"use client";

import {
  Contact01Icon,
  DashboardBrowsingIcon,
  FilterIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLeads } from "@/lib/queries";
import { getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardBrowsingIcon },
  { label: "Leads", href: "/leads", icon: Contact01Icon },
  { label: "Pipeline", href: "/pipeline", icon: FilterIcon },
  { label: "Tasks", href: "/tasks", icon: Task01Icon },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: leads = [] } = useLeads();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <Command>
        <CommandInput placeholder="Search leads, navigate..." />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>

          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.5} />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>

          {leads.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Leads">
                {leads.slice(0, 20).map((lead) => (
                  <CommandItem
                    key={lead.id}
                    onSelect={() => go(`/leads/${lead.id}`)}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted font-medium text-[8px] text-muted-foreground">
                      {getInitials(lead.name)}
                    </span>
                    <span className="flex-1 truncate">{lead.name}</span>
                    {lead.company && (
                      <span className="text-muted-foreground text-xs">
                        {lead.company}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
