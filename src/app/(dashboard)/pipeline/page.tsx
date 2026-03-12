import { Suspense } from "react";
import { PipelineClient } from "./pipeline-client";

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading pipeline...
        </div>
      }
    >
      <PipelineInner />
    </Suspense>
  );
}

async function PipelineInner() {
  const { getLeads } = await import("@/lib/actions/leads");
  const leads = await getLeads();
  return <PipelineClient leads={leads} />;
}
