import { Suspense } from "react";
import { LeadsPageClient } from "./leads-client";

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading leads...
        </div>
      }
    >
      <LeadsPageInner />
    </Suspense>
  );
}

async function LeadsPageInner() {
  const { getLeads, getLeadCounts } = await import("@/lib/actions/leads");
  const [leads, counts] = await Promise.all([getLeads(), getLeadCounts()]);
  return <LeadsPageClient counts={counts} initialLeads={leads} />;
}
