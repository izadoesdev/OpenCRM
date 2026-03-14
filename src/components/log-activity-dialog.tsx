"use client";

import { CallIcon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLogOutreach } from "@/lib/queries";

type ActivityType = "outreach_call" | "outreach_linkedin";

export function LogActivityDialog({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<ActivityType>("outreach_call");
  const [note, setNote] = useState("");
  const logOutreach = useLogOutreach();

  function handleSubmit() {
    const content =
      note.trim() ||
      (type === "outreach_call" ? "Logged a call" : "Logged LinkedIn outreach");
    logOutreach.mutate(
      { leadId, type, content },
      {
        onSuccess: () => {
          setNote("");
          setType("outreach_call");
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>
            Choose the type of activity and optionally add a note.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => setType("outreach_call")}
              size="sm"
              variant={type === "outreach_call" ? "default" : "outline"}
            >
              <HugeiconsIcon icon={CallIcon} size={14} strokeWidth={1.5} />
              Call
            </Button>
            <Button
              className="flex-1"
              onClick={() => setType("outreach_linkedin")}
              size="sm"
              variant={type === "outreach_linkedin" ? "default" : "outline"}
            >
              <HugeiconsIcon
                icon={LinkSquare01Icon}
                size={14}
                strokeWidth={1.5}
              />
              LinkedIn
            </Button>
          </div>
          <Textarea
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            rows={3}
            value={note}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Cancel
          </Button>
          <Button disabled={logOutreach.isPending} onClick={handleSubmit}>
            {logOutreach.isPending ? "Logging..." : "Log Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
