"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { TaskSuggestionDialog } from "@/components/task-suggestion-dialog";
import type { SuggestedTask } from "@/lib/actions/status";
import { useCreateTask } from "@/lib/queries";

const TaskSuggestionCtx = createContext<(suggestion: SuggestedTask) => void>(
  () => {
    /* noop */
  }
);

export function useTaskSuggestion() {
  return useContext(TaskSuggestionCtx);
}

export function TaskSuggestionProvider({ children }: { children: ReactNode }) {
  const [suggestion, setSuggestion] = useState<SuggestedTask | null>(null);
  const createTask = useCreateTask();

  const suggest = useCallback((s: SuggestedTask) => {
    setSuggestion(s);
  }, []);

  function handleAccept(task: SuggestedTask) {
    createTask.mutate({
      leadId: task.leadId,
      title: task.title,
      type: task.type,
      dueAt: task.dueAt,
      recurrence: task.recurrence ?? null,
      meetingLink: task.meetingLink ?? null,
      syncToCalendar: false,
    });
    setSuggestion(null);
  }

  return (
    <TaskSuggestionCtx value={suggest}>
      {children}
      <TaskSuggestionDialog
        onAccept={handleAccept}
        onDismiss={() => setSuggestion(null)}
        suggestion={suggestion}
      />
    </TaskSuggestionCtx>
  );
}
