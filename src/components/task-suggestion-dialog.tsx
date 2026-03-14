"use client";

import { Task01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";
import { TaskTypePicker } from "@/components/task-type-picker";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SuggestedTask } from "@/lib/actions/status";
import dayjs from "@/lib/dayjs";

interface TaskSuggestionDialogProps {
  onAccept: (task: SuggestedTask) => void;
  onDismiss: () => void;
  suggestion: SuggestedTask | null;
}

export function TaskSuggestionDialog({
  suggestion,
  onAccept,
  onDismiss,
}: TaskSuggestionDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [dueAt, setDueAt] = useState<Date | null>(null);

  useEffect(() => {
    if (suggestion) {
      setTitle(suggestion.title);
      setType(suggestion.type);
      setDueAt(suggestion.dueAt);
    }
  }, [suggestion]);

  return (
    <AlertDialog
      onOpenChange={(v) => {
        if (!v) {
          onDismiss();
        }
      }}
      open={!!suggestion}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-blue-500/10 text-blue-600">
            <HugeiconsIcon icon={Task01Icon} size={20} strokeWidth={1.5} />
          </AlertDialogMedia>
          <AlertDialogTitle>Create a task?</AlertDialogTitle>
          <AlertDialogDescription>
            We suggest creating a task based on this action. You can customize
            it before creating.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2.5">
          <Input
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            value={title}
          />
          <div className="grid grid-cols-2 gap-2">
            <TaskTypePicker
              className="w-full"
              onChange={setType}
              value={type}
            />
            <DateTimePicker onChange={setDueAt} value={dueAt} />
          </div>
          {dueAt && (
            <p className="text-[11px] text-muted-foreground">
              Due {dayjs(dueAt).format("MMM D, YYYY")} at{" "}
              {dayjs(dueAt).format("h:mm A")} ({dayjs(dueAt).fromNow()})
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Skip</AlertDialogCancel>
          <Button
            disabled={!(title.trim() && dueAt)}
            onClick={() => {
              if (!(suggestion && dueAt)) {
                return;
              }
              onAccept({
                ...suggestion,
                title,
                type,
                dueAt,
              });
            }}
          >
            Create Task
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
