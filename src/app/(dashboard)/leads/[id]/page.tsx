import { Suspense } from "react";
import { LeadDetailClient } from "./lead-detail-client";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading lead...
        </div>
      }
    >
      <LeadDetailInner id={id} />
    </Suspense>
  );
}

async function LeadDetailInner({ id }: { id: string }) {
  const { getLead } = await import("@/lib/actions/leads");
  const { getEmailTemplates } = await import("@/lib/actions/email-templates");

  const [lead, templates] = await Promise.all([
    getLead(id),
    getEmailTemplates(),
  ]);

  return <LeadDetailClient lead={lead} templates={templates} />;
}
