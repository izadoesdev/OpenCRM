"use client";

import { useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { TaskTypePicker } from "@/components/task-type-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "@/lib/dayjs";
import { useUpdateTask } from "@/lib/queries";

interface EditableTask {
  description: string | null;
  dueAt: Date;
  id: string;
  title: string;
  type: string;
}

export function TaskInlineEdit({
  task: t,
  leadId,
  onClose,
}: {
  task: EditableTask;
  leadId?: string | null;
  onClose: () => void;
}) {
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState(t.title);
  const [description, setDescription] = useState(t.description ?? "");
  const [dueAt, setDueAt] = useState<Date | null>(dayjs(t.dueAt).toDate());
  const [type, setType] = useState(t.type);

  function handleSave() {
    if (!(title.trim() && dueAt)) {
      return;
    }
    updateTask.mutate(
      {
        id: t.id,
        data: {
          title,
          description: description || undefined,
          dueAt,
          type,
        },
        leadId,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="space-y-2.5">
      <Input
        autoFocus
        className="text-sm"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
        }}
        placeholder="Task title"
        value={title}
      />
      <Textarea
        className="min-h-[60px] text-xs"
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description…"
        value={description}
      />
      <div className="flex items-center gap-2">
        <TaskTypePicker className="flex-1" onChange={setType} value={type} />
        <DateTimePicker
          className="flex-1"
          onChange={(d) => setDueAt(d)}
          value={dueAt}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} size="sm" variant="ghost">
          Cancel
        </Button>
        <Button
          disabled={!(title.trim() && dueAt) || updateTask.isPending}
          onClick={handleSave}
          size="sm"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
