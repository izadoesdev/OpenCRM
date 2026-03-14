import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { UserAvatar } from "@/components/micro";
import { EmptyState } from "@/components/page-skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";

export interface RecentLead {
  assignedUser: { id: string; name: string } | null;
  company: string | null;
  email: string;
  id: string;
  name: string;
  status: string;
  value: number;
}

export function RecentLeads({ leads }: { leads: RecentLead[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Recent Leads</h2>
        <Button render={<Link href="/leads" />} size="sm" variant="ghost">
          All leads
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="mt-3 space-y-0.5">
        {leads.length === 0 && (
          <EmptyState className="py-6" message="No leads yet" />
        )}
        {leads.map((lead) => (
          <Link
            className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/40"
            href={`/leads/${lead.id}`}
            key={lead.id}
          >
            <UserAvatar name={lead.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{lead.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {lead.company ?? lead.email}
              </p>
            </div>
            <StatusBadge status={lead.status} />
            {lead.assignedUser && (
              <UserAvatar name={lead.assignedUser.name} size="xs" />
            )}
            {lead.value > 0 && (
              <span className="font-mono text-muted-foreground text-xs">
                {formatCents(lead.value)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
