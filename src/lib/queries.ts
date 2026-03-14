"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDashboardStats,
  getPipelineCounts,
  getPipelineVelocity,
  getRecentLeads,
  getReportingData,
  getStatusChangeHistory,
  getUpcomingTasks,
} from "@/lib/actions/dashboard";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplates,
  sendLeadEmail,
  updateEmailTemplate,
} from "@/lib/actions/email-templates";
import {
  bulkDeleteLeads,
  bulkUpdateStatus,
  checkDuplicateEmail,
  createLead,
  deleteLead,
  getArchivedLeads,
  getLead,
  getLeadCounts,
  getLeads,
  importLeads,
  permanentlyDeleteLead,
  restoreLead,
  updateLead,
} from "@/lib/actions/leads";
import { addNote, changeLeadStatus, logOutreach } from "@/lib/actions/status";
import {
  addTaskAttendees,
  completeTask,
  createTask,
  deleteTask,
  getLeadTasks,
  getTasks,
  rescheduleTask,
  rescheduleTaskTo,
  uncompleteTask,
  updateTask,
} from "@/lib/actions/tasks";
import { getTeamMembers } from "@/lib/actions/team";
import { STATUS_LABELS } from "@/lib/constants";
import {
  getCalendarEvent,
  getUpcomingCalendarEvents,
} from "./actions/calendar";
import { getLeadEmails } from "./actions/gmail";
import { checkGoogleConnection } from "./google";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  leads: ["leads"] as const,
  archivedLeads: ["leads", "archived"] as const,
  lead: (id: string) => ["leads", id] as const,
  leadCounts: ["leads", "counts"] as const,
  tasks: ["tasks"] as const,
  dashboard: ["dashboard"] as const,
  emailTemplates: ["email-templates"] as const,
  team: ["team"] as const,
  calendarEvents: ["calendar-events"] as const,
  calendarEvent: (id: string) => ["calendar-event", id] as const,
  leadEmails: (email: string) => ["lead-emails", email] as const,
  googleConnection: ["google-connection"] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useLeads() {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: () => getLeads(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: () => getLead(id),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCheckDuplicateEmail(email: string) {
  return useQuery({
    queryKey: ["check-duplicate", email],
    queryFn: () => checkDuplicateEmail(email),
    enabled: email.length > 3 && email.includes("@"),
    staleTime: 30 * 1000,
  });
}

export function useLeadCounts() {
  return useQuery({
    queryKey: queryKeys.leadCounts,
    queryFn: () => getLeadCounts(),
    staleTime: 30 * 1000,
  });
}

export function useTasks(opts?: { userId?: string | null }) {
  return useQuery({
    queryKey: [...queryKeys.tasks, opts?.userId ?? "all"],
    queryFn: () =>
      getTasks({ showCompleted: true, userId: opts?.userId ?? undefined }),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}

export function useLeadTasks(leadId: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks, "lead", leadId],
    queryFn: () => getLeadTasks(leadId),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function usePipelineVelocity() {
  return useQuery({
    queryKey: ["pipeline-velocity"],
    queryFn: () => getPipelineVelocity(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReportingData() {
  return useQuery({
    queryKey: ["reporting"],
    queryFn: () => getReportingData(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatusChangeHistory(opts?: {
  from?: string;
  to?: string;
  fromStatus?: string;
  toStatus?: string;
}) {
  return useQuery({
    queryKey: ["audit-trail", opts],
    queryFn: () => getStatusChangeHistory(opts),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDashboard(opts?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, opts?.from, opts?.to],
    queryFn: async () => {
      const [stats, recentLeads, upcomingTasks, pipelineCounts] =
        await Promise.all([
          getDashboardStats(opts),
          getRecentLeads(opts),
          getUpcomingTasks(),
          getPipelineCounts(opts),
        ]);
      return { stats, recentLeads, upcomingTasks, pipelineCounts };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: queryKeys.emailTemplates,
    queryFn: () => getEmailTemplates(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emailTemplates });
      toast.success("Template created");
    },
    onError: () => toast.error("Failed to create template"),
  });
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; subject?: string; body?: string };
    }) => updateEmailTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emailTemplates });
      toast.success("Template updated");
    },
    onError: () => toast.error("Failed to update template"),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emailTemplates });
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete template"),
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.team,
    queryFn: () => getTeamMembers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGoogleConnection() {
  return useQuery({
    queryKey: queryKeys.googleConnection,
    queryFn: () => checkGoogleConnection(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCalendarEvent(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.calendarEvent(eventId ?? ""),
    queryFn: () => getCalendarEvent(eventId ?? ""),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCalendarEvents(opts?: { maxResults?: number }) {
  return useQuery({
    queryKey: queryKeys.calendarEvents,
    queryFn: () => getUpcomingCalendarEvents(opts),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useLeadEmails(email: string | null) {
  return useQuery({
    queryKey: queryKeys.leadEmails(email ?? ""),
    queryFn: () => getLeadEmails(email ?? ""),
    enabled: !!email,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Invalidation helper
// ---------------------------------------------------------------------------

function useInvalidate() {
  const qc = useQueryClient();
  return {
    leads: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads });
      qc.invalidateQueries({ queryKey: queryKeys.leadCounts });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    lead: (id: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.lead(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leads });
      qc.invalidateQueries({ queryKey: queryKeys.leadCounts });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    tasks: (leadId?: string | null) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (leadId) {
        qc.invalidateQueries({ queryKey: queryKeys.lead(leadId) });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Lead mutations
// ---------------------------------------------------------------------------

export function useCreateLead() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: createLead,
    onSuccess: (row) => {
      inv.leads();
      toast.success(`${row.name} created`);
    },
    onError: () => toast.error("Failed to create lead"),
  });
}

export function useImportLeads() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: importLeads,
    onSuccess: (count) => {
      inv.leads();
      toast.success(`${count} lead${count === 1 ? "" : "s"} imported`);
    },
    onError: () => toast.error("Failed to import leads"),
  });
}

export function useUpdateLead() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateLead>[1];
    }) => updateLead(id, data),
    onSuccess: (row) => {
      if (row) {
        inv.lead(row.id);
      }
      toast.success("Lead updated");
    },
    onError: () => toast.error("Failed to update lead"),
  });
}

export function useDeleteLead() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      inv.leads();
      qc.invalidateQueries({ queryKey: queryKeys.archivedLeads });
      toast.success("Lead archived");
    },
    onError: () => toast.error("Failed to archive lead"),
  });
}

export function useBulkUpdateStatus() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      bulkUpdateStatus(ids, status),
    onSuccess: (_, { ids, status }) => {
      inv.leads();
      toast.success(
        `${ids.length} lead${ids.length > 1 ? "s" : ""} moved to ${STATUS_LABELS[status]}`
      );
    },
    onError: () => toast.error("Failed to update status"),
  });
}

export function useBulkDeleteLeads() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteLeads,
    onSuccess: (_, ids) => {
      inv.leads();
      qc.invalidateQueries({ queryKey: queryKeys.archivedLeads });
      toast.success(`${ids.length} lead${ids.length > 1 ? "s" : ""} archived`);
    },
    onError: () => toast.error("Failed to archive leads"),
  });
}

export function useArchivedLeads() {
  return useQuery({
    queryKey: queryKeys.archivedLeads,
    queryFn: () => getArchivedLeads(),
  });
}

export function useRestoreLead() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreLead,
    onSuccess: () => {
      inv.leads();
      qc.invalidateQueries({ queryKey: queryKeys.archivedLeads });
      toast.success("Lead restored");
    },
    onError: () => toast.error("Failed to restore lead"),
  });
}

export function usePermanentlyDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: permanentlyDeleteLead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.archivedLeads });
      toast.success("Lead permanently deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });
}

export function useAssignLead() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      leadId,
      assignedTo,
    }: {
      leadId: string;
      assignedTo: string | null;
    }) => updateLead(leadId, { assignedTo }),
    onSuccess: (_, { leadId }) => {
      inv.lead(leadId);
      toast.success("Lead reassigned");
    },
    onError: () => toast.error("Failed to reassign lead"),
  });
}

export function useChangeLeadStatus() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      leadId,
      status,
      opts,
    }: {
      leadId: string;
      status: string;
      opts?: { plan?: string; note?: string };
    }) => changeLeadStatus(leadId, status, opts),
    onSuccess: (_, { leadId, status }) => {
      inv.lead(leadId);
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
    },
    onError: () => toast.error("Failed to change status"),
  });
}

export function useAddNote() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ leadId, content }: { leadId: string; content: string }) =>
      addNote(leadId, content),
    onSuccess: (_, { leadId }) => {
      inv.lead(leadId);
      toast.success("Note added");
    },
    onError: () => toast.error("Failed to add note"),
  });
}

export function useLogOutreach() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      leadId,
      type,
      content,
    }: {
      leadId: string;
      type: "outreach_call" | "outreach_linkedin";
      content: string;
    }) => logOutreach(leadId, type, content),
    onSuccess: (_, { leadId }) => {
      inv.lead(leadId);
      toast.success("Outreach logged");
    },
    onError: () => toast.error("Failed to log outreach"),
  });
}

export function useSendEmail() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      leadId,
      data,
    }: {
      leadId: string;
      data: {
        subject: string;
        body: string;
        templateId?: string;
        sendVia?: "resend" | "gmail";
      };
    }) => sendLeadEmail(leadId, data),
    onSuccess: (_, { leadId, data }) => {
      inv.lead(leadId);
      qc.invalidateQueries({ queryKey: ["lead-emails"] });
      toast.success(data.sendVia === "gmail" ? "Sent via Gmail" : "Email sent");
    },
    onError: () => toast.error("Failed to send email"),
  });
}

// ---------------------------------------------------------------------------
// Task mutations
// ---------------------------------------------------------------------------

export function useCreateTask() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (row) => {
      inv.tasks(row.leadId);
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      isComplete,
    }: {
      id: string;
      isComplete: boolean;
      leadId?: string | null;
    }) => (isComplete ? uncompleteTask(id) : completeTask(id)),
    onMutate: async ({ id, isComplete }) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasks });
      await qc.cancelQueries({ queryKey: queryKeys.dashboard });

      const snapshots = qc.getQueriesData({ queryKey: queryKeys.tasks });
      qc.setQueriesData(
        { queryKey: queryKeys.tasks },
        (old: Array<{ id: string; completedAt: Date | null }> | undefined) => {
          if (!old) {
            return old;
          }
          return old.map((t) =>
            t.id === id
              ? { ...t, completedAt: isComplete ? null : new Date() }
              : t
          );
        }
      );

      const dashSnap = qc.getQueriesData({ queryKey: queryKeys.dashboard });
      return { snapshots, dashSnap };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots) {
          qc.setQueryData(key, data);
        }
      }
      if (ctx?.dashSnap) {
        for (const [key, data] of ctx.dashSnap) {
          qc.setQueryData(key, data);
        }
      }
      toast.error("Failed to update task");
    },
    onSuccess: (_, { isComplete, leadId }) => {
      inv.tasks(leadId);
      qc.invalidateQueries({ queryKey: queryKeys.calendarEvents });
      toast.success(isComplete ? "Task reopened" : "Task completed");
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateTask>[1];
      leadId?: string | null;
    }) => updateTask(id, data),
    onSuccess: (result, { leadId }) => {
      inv.tasks(leadId);
      qc.invalidateQueries({ queryKey: queryKeys.calendarEvents });

      const ops = result?.calendarOps ?? [];
      if (ops.includes("calendar_cancelled")) {
        toast.success("Task updated · calendar event cancelled");
      } else if (ops.includes("calendar_cancel_failed")) {
        toast.success("Task updated · failed to cancel calendar event");
      } else if (ops.includes("calendar_updated")) {
        toast.success("Task updated · calendar synced");
      } else if (ops.includes("calendar_update_failed")) {
        toast.success("Task updated · calendar sync failed");
      } else {
        toast.success("Task updated");
      }
    },
    onError: () => toast.error("Failed to update task"),
  });
}

export function useRescheduleTask() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      days,
    }: {
      id: string;
      days: number;
      leadId?: string | null;
    }) => rescheduleTask(id, days),
    onSuccess: (_, { days, leadId }) => {
      inv.tasks(leadId);
      toast(`Rescheduled +${days} day${days === 1 ? "" : "s"}`);
    },
    onError: () => toast.error("Failed to reschedule task"),
  });
}

export function useRescheduleTaskTo() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      date,
    }: {
      id: string;
      date: Date;
      leadId?: string | null;
    }) => rescheduleTaskTo(id, date),
    onSuccess: (_, { leadId }) => {
      inv.tasks(leadId);
      toast.success("Rescheduled");
    },
    onError: () => toast.error("Failed to reschedule task"),
  });
}

export function useDeleteTask() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; leadId?: string | null }) =>
      deleteTask(id),
    onSuccess: (_, { leadId }) => {
      inv.tasks(leadId);
      qc.invalidateQueries({ queryKey: queryKeys.calendarEvents });
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });
}

export function useAddTaskAttendees() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      emails,
    }: {
      id: string;
      emails: string[];
      calendarEventId?: string | null;
      leadId?: string | null;
    }) => addTaskAttendees(id, emails),
    onSuccess: (_, { leadId, calendarEventId }) => {
      inv.tasks(leadId);
      if (calendarEventId) {
        qc.invalidateQueries({
          queryKey: queryKeys.calendarEvent(calendarEventId),
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.calendarEvents });
      toast.success("Invite sent");
    },
    onError: () => toast.error("Failed to add attendees"),
  });
}
