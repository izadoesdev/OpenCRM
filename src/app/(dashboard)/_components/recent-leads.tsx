import Link from "next/link";
import { UserAvatar } from "@/components/micro";
import { EmptyState } from "@/components/page-skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useFormatCents } from "@/lib/queries";

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
  const fmtCents = useFormatCents();
  return (
    <div className="space-y-0.5">
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
              {fmtCents(lead.value)}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
