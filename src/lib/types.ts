export interface TeamMember {
  email: string;
  id: string;
  image?: string | null;
  name: string;
}

export interface TaskItem {
  calendarEventId?: string | null;
  completedAt: Date | null;
  description?: string | null;
  dueAt: Date;
  id: string;
  lead?: { id: string; name: string; status?: string } | null;
  leadId: string;
  meetingLink: string | null;
  recurrence: string | null;
  title: string;
  type: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
  } | null;
  userId?: string | null;
}
