"use client";

import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "lead.status_changed",
  "lead.deleted",
  "task.created",
  "task.completed",
  "task.deleted",
] as const;

import {
  useCreateWebhook,
  useDeleteWebhook,
  useUpdateWebhook,
  useWebhooks,
} from "@/lib/queries";
import {
  SettingsCard,
  SettingsCardActions,
  SettingsCardBody,
  SettingsEmptyState,
  SettingsList,
  SettingsSection,
  SettingsSectionHeader,
  SettingsSkeleton,
} from "../_components/settings-layout";

export function WebhooksSection() {
  const { data: webhooks = [], isLoading } = useWebhooks();
  const createMut = useCreateWebhook();
  const updateMut = useUpdateWebhook();
  const deleteMut = useDeleteWebhook();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    new Set()
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleCreate() {
    if (!newUrl.trim() || newEvents.length === 0) {
      return;
    }
    createMut.mutate(
      { url: newUrl.trim(), events: newEvents },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setNewUrl("");
          setNewEvents([]);
        },
      }
    );
  }

  function toggleEventSelection(event: string) {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  function toggleSecretVisibility(id: string) {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <SettingsSection id="webhooks">
      <SettingsSectionHeader
        action={
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            Add Webhook
          </Button>
        }
        description="Receive HTTP POST notifications when events occur in your CRM."
        title="Webhooks"
      />

      {isLoading && <SettingsSkeleton rows={2} />}

      {!isLoading && webhooks.length === 0 && (
        <SettingsEmptyState message="No webhooks configured" />
      )}

      {!isLoading && webhooks.length > 0 && (
        <SettingsList>
          {webhooks.map((wh) => (
            <SettingsCard className="flex-col items-stretch gap-2" key={wh.id}>
              <div className="flex items-center gap-3">
                <SettingsCardBody>
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-[13px]">{wh.url}</p>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {wh.events.length} event
                      {wh.events.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </SettingsCardBody>
                <SettingsCardActions>
                  <Switch
                    checked={wh.active}
                    onCheckedChange={(active) =>
                      updateMut.mutate({ id: wh.id, data: { active } })
                    }
                  />
                  <Button
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteId(wh.id)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                  </Button>
                </SettingsCardActions>
              </div>

              <div className="flex items-center gap-2 border-t pt-2">
                <span className="text-[11px] text-muted-foreground">
                  Secret:
                </span>
                <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground/70">
                  {revealedSecrets.has(wh.id)
                    ? wh.secret
                    : "••••••••••••••••••••"}
                </code>
                <Button
                  onClick={() => toggleSecretVisibility(wh.id)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    icon={
                      revealedSecrets.has(wh.id) ? ViewOffSlashIcon : ViewIcon
                    }
                    size={14}
                    strokeWidth={1.5}
                  />
                </Button>
              </div>
            </SettingsCard>
          ))}
        </SettingsList>
      )}

      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setShowCreateDialog(false);
            setNewUrl("");
            setNewEvents([]);
          }
        }}
        open={showCreateDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              We'll send a POST request to this URL when selected events occur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Endpoint URL</Label>
              <Input
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                value={newUrl}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">Events</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div
                    className="flex items-center gap-2 text-[13px]"
                    key={event}
                  >
                    <Checkbox
                      checked={newEvents.includes(event)}
                      id={`event-${event}`}
                      onCheckedChange={() => toggleEventSelection(event)}
                    />
                    <Label
                      className="cursor-pointer font-mono font-normal text-xs"
                      htmlFor={`event-${event}`}
                    >
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewUrl("");
                  setNewEvents([]);
                }}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !newUrl.trim() ||
                  newEvents.length === 0 ||
                  createMut.isPending
                }
                onClick={handleCreate}
                size="sm"
              >
                Create Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Delete Webhook"
        description="This webhook will be permanently deleted and will no longer receive events."
        icon={Cancel01Icon}
        onConfirm={() => {
          if (deleteId) {
            deleteMut.mutate(deleteId);
          }
        }}
        onOpenChange={(v) => !v && setDeleteId(null)}
        open={!!deleteId}
        title="Delete this webhook?"
        variant="danger"
      />
    </SettingsSection>
  );
}
