"use client";

import { use } from "react";
import { LeadDetailClient } from "./lead-detail-client";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LeadDetailClient leadId={id} />;
}
