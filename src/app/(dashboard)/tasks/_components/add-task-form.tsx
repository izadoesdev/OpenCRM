"use client";

import { Cancel01Icon, RepeatIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { IconSelect } from "@/components/micro";
import { TaskTypePicker } from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { RECURRENCE_LABELS, TASK_RECURRENCES } from "@/lib/constants";
import { useCreateTask, useLeads } from "@/lib/queries";
import { isMeetingType } from "@/lib/utils";

export function AddTaskForm({
  teamMembers,
  currentUserId,
  onClose,
}: {
  teamMembers: Array<{ id: string; name: string; email: string }>;
  currentUserId?: string;
  onClose: () => void;
}) {
  const others = currentUserId
    ? teamMembers.filter((m) => m.id !== currentUserId)
    : teamMembers;
  const { data: leads = [] } = useLeads();
  const createTask = useCreateTask();
  const [title, setTitle] = useState("");
  const [leadId, setLeadId] = useState<string>("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [type, setType] = useState("follow_up");
  const [assignee, setAssignee] = useState("_self");
  const [recurrence, setRecurrence] = useState("none");
  const [meetingLink, setMeetingLink] = useState("");
  const [syncCalendar, setSyncCalendar] = useState(true);

  const showMeetingFields = isMeetingType(type);
  const canSubmit = !!(title.trim() && dueAt && leadId);

  useEffect(() => {
    if (type !== "follow_up" && type !== "call") {
      setRecurrence("none");
    }
  }, [type]);

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    createTask.mutate(
      {
        leadId,
        title: title.trim(),
        dueAt,
        type,
        userId: assignee === "_self" ? undefined : assignee,
        recurrence: recurrence === "none" ? null : recurrence,
        meetingLink: meetingLink.trim() || null,
        syncToCalendar: syncCalendar && showMeetingFields,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="mx-auto mb-6 max-w-2xl rounded-xl border bg-background">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h3 className="font-semibold text-[13px]">New task</h3>
        <button
          className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="space-y-3.5 p-5">
        <Input
          autoFocus
          className="h-9"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") {
              onClose();
            }
          }}
          placeholder="What needs to be done?"
          value={title}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <Select onValueChange={(v) => v && setLeadId(v)} value={leadId}>
            <SelectTrigger className="w-full text-xs">
              <span className="flex-1 truncate text-left">
                {leadId
                  ? ((leads as Array<{ id: string; name: string }>).find(
                      (l) => l.id === leadId
                    )?.name ?? "Select lead…")
                  : "Select lead…"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {(leads as Array<{ id: string; name: string }>).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TaskTypePicker className="w-full" onChange={setType} value={type} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <DateTimePicker onChange={setDueAt} value={dueAt} />
          <IconSelect
            displayValue={
              assignee === "_self"
                ? "Myself"
                : (teamMembers.find((m) => m.id === assignee)?.name ??
                  "Select…")
            }
            icon={UserIcon}
            onValueChange={setAssignee}
            value={assignee}
          >
            <SelectItem value="_self">Myself</SelectItem>
            {others.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </IconSelect>
        </div>

        {(type === "follow_up" || type === "call" || showMeetingFields) && (
          <div className="grid grid-cols-2 gap-2.5">
            {(type === "follow_up" || type === "call") && (
              <IconSelect
                displayValue={
                  recurrence === "none"
                    ? "One-time"
                    : (RECURRENCE_LABELS[recurrence] ?? recurrence)
                }
                icon={RepeatIcon}
                onValueChange={setRecurrence}
                value={recurrence}
              >
                <SelectItem value="none">One-time</SelectItem>
                {TASK_RECURRENCES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {RECURRENCE_LABELS[r]}
                  </SelectItem>
                ))}
              </IconSelect>
            )}
            {showMeetingFields && (
              <Input
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Meeting link (optional)"
                value={meetingLink}
              />
            )}
          </div>
        )}

        {showMeetingFields && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Checkbox
              checked={syncCalendar}
              id="sync-calendar"
              onCheckedChange={(checked) => setSyncCalendar(checked)}
            />
            <label className="cursor-pointer" htmlFor="sync-calendar">
              Create Google Calendar event with Meet link
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3">
        <span className="text-[11px] text-muted-foreground">
          {canSubmit ? "⌘ Enter to save" : "Fill in title, lead, and due date"}
        </span>
        <div className="flex items-center gap-2">
          <Button onClick={onClose} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={createTask.isPending || !canSubmit}
            onClick={handleSubmit}
            size="sm"
          >
            {createTask.isPending ? "Adding…" : "Add Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
