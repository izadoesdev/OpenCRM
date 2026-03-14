import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NoteInput({
  noteText,
  setNoteText,
  onAddNote,
  isPending,
}: {
  noteText: string;
  setNoteText: (v: string) => void;
  onAddNote: () => void;
  isPending: boolean;
}) {
  return (
    <div className="shrink-0 border-b px-6 py-3">
      <div className="flex gap-2">
        <Textarea
          className="min-h-[40px] flex-1 resize-none text-sm"
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onAddNote();
            }
          }}
          placeholder="Add a note... (⌘ Enter)"
          rows={1}
          value={noteText}
        />
        <Button
          className="shrink-0 self-end"
          disabled={isPending || !noteText.trim()}
          onClick={onAddNote}
          size="sm"
          variant="outline"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
