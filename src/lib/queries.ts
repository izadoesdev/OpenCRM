"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDashboardStats,
  getPipelineCounts,
  getRecentLeads,
  getUpcomingTasks,
} from "@/lib/actions/dashboard";
import {
  getEmailTemplates,
  sendLeadEmail,
} from "@/lib/actions/email-templates";
import {
  bulkDeleteLeads,
  bulkUpdateStatus,
  createLead,
  deleteLead,
  getLead,
  getLeadCounts,
  getLeads,
  updateLead,
} from "@/lib/actions/leads";
import { addNote, changeLeadStatus, logOutreach } from "@/lib/actions/status";
import {
  completeTask,
  createTask,
  deleteTask,
  getLeadTasks,
  getTasks,
  rescheduleTask,
  uncompleteTask,
  updateTask,
} from "@/lib/actions/tasks";
import { getTeamMembers } from "@/lib/actions/team";
import { RESCHEDULE_LABELS, STATUS_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const queryKeys = {
  leads: ["leads"] as const,
  lead: (id: string) => ["leads", id] as const,
  leadCounts: ["leads", "counts"] as const,
  tasks: ["tasks"] as const,
  dashboard: ["dashboard"] as const,
  emailTemplates: ["email-templates"] as const,
  team: ["team"] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useLeads() {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: () => getLeads(),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: () => getLead(id),
  });
}

export function useLeadCounts() {
  return useQuery({
    queryKey: queryKeys.leadCounts,
    queryFn: () => getLeadCounts(),
  });
}

export function useTasks(opts?: { userId?: string | null }) {
  return useQuery({
    queryKey: [...queryKeys.tasks, opts?.userId ?? "all"],
    queryFn: () =>
      getTasks({ showCompleted: true, userId: opts?.userId ?? undefined }),
  });
}

export function useLeadTasks(leadId: string) {
  return useQuery({
    queryKey: [...queryKeys.tasks, "lead", leadId],
    queryFn: () => getLeadTasks(leadId),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const [stats, recentLeads, upcomingTasks, pipelineCounts] =
        await Promise.all([
          getDashboardStats(),
          getRecentLeads(),
          getUpcomingTasks(),
          getPipelineCounts(),
        ]);
      return { stats, recentLeads, upcomingTasks, pipelineCounts };
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: queryKeys.emailTemplates,
    queryFn: () => getEmailTemplates(),
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.team,
    queryFn: () => getTeamMembers(),
    staleTime: 5 * 60 * 1000,
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
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      inv.leads();
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
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
  return useMutation({
    mutationFn: bulkDeleteLeads,
    onSuccess: (_, ids) => {
      inv.leads();
      toast.success(`${ids.length} lead${ids.length > 1 ? "s" : ""} deleted`);
    },
    onError: () => toast.error("Failed to delete leads"),
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
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({
      leadId,
      data,
    }: {
      leadId: string;
      data: { subject: string; body: string; templateId?: string };
    }) => sendLeadEmail(leadId, data),
    onSuccess: (_, { leadId }) => {
      inv.lead(leadId);
      toast.success("Email sent");
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
    onSuccess: (_, { isComplete, leadId }) => {
      inv.tasks(leadId);
      toast.success(isComplete ? "Task reopened" : "Task completed");
    },
    onError: () => toast.error("Failed to update task"),
  });
}

export function useUpdateTask() {
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
    onSuccess: (_, { leadId }) => {
      inv.tasks(leadId);
      toast.success("Task updated");
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
      toast(`Rescheduled ${RESCHEDULE_LABELS[days] ?? `+${days}d`}`);
    },
    onError: () => toast.error("Failed to reschedule task"),
  });
}

export function useDeleteTask() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id }: { id: string; leadId?: string | null }) =>
      deleteTask(id),
    onSuccess: (_, { leadId }) => {
      inv.tasks(leadId);
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });
}
