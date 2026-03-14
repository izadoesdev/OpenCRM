"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ACTIVE_LEAD_STATUSES } from "@/lib/constants";
import { useChangeLeadStatus, useLeads } from "@/lib/queries";
import { PipelineCard } from "./_components/pipeline-card";
import { PipelineColumn } from "./_components/pipeline-column";

function PipelineSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <h1 className="font-semibold text-lg tracking-tight">Pipeline</h1>
      </PageHeader>
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className="w-72 shrink-0 animate-pulse rounded-xl border bg-card/50"
            key={`skel-${i}`}
          >
            <div className="px-3.5 py-3">
              <div className="h-4 w-20 rounded bg-muted/60" />
            </div>
            <div className="space-y-2 px-2 pb-2">
              <div className="h-20 rounded-lg bg-muted/40" />
              <div className="h-20 rounded-lg bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PipelineClient() {
  const { data: leads = [], isLoading } = useLeads();
  const changeStatus = useChangeLeadStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const columns = ACTIVE_LEAD_STATUSES.map((status) => ({
    status,
    leads: leads.filter((l) => l.status === status),
  }));

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: { over: { id: string | number } | null }) => {
      setOverId(event.over ? String(event.over.id) : null);
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);

      if (!over) {
        return;
      }

      const leadId = String(active.id);
      const targetStatus = String(over.id);
      const lead = leads.find((l) => l.id === leadId);

      if (!lead || lead.status === targetStatus) {
        return;
      }

      changeStatus.mutate({ leadId, status: targetStatus });
    },
    [leads, changeStatus]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, []);

  if (isLoading) {
    return <PipelineSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <h1 className="font-semibold text-lg tracking-tight">Pipeline</h1>
      </PageHeader>

      <DndContext
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-5">
          {columns.map((col) => (
            <PipelineColumn
              count={col.leads.length}
              isOver={
                overId === col.status && activeLead?.status !== col.status
              }
              key={col.status}
              status={col.status}
            >
              {col.leads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <p className="text-[13px]">No leads</p>
                </div>
              )}
              {col.leads.map((lead) => (
                <PipelineCard key={lead.id} lead={lead} />
              ))}
            </PipelineColumn>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeLead ? (
            <div className="w-72">
              <PipelineCard isDragOverlay lead={activeLead} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
