"use client";

import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "@/lib/dayjs";
import {
  useCreateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailTemplates,
  useUpdateEmailTemplate,
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

interface EditingTemplate {
  body: string;
  id?: string;
  name: string;
  subject: string;
}

export function EmailTemplatesSection() {
  const { data: templates = [], isLoading } = useEmailTemplates();
  const createMut = useCreateEmailTemplate();
  const updateMut = useUpdateEmailTemplate();
  const deleteMut = useDeleteEmailTemplate();
  const [editing, setEditing] = useState<EditingTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  function handleSave() {
    if (!(editing?.name?.trim() && editing?.subject?.trim())) {
      return;
    }
    if (editing.id) {
      updateMut.mutate(
        {
          id: editing.id,
          data: {
            name: editing.name,
            subject: editing.subject,
            body: editing.body,
          },
        },
        { onSuccess: () => setEditing(null) }
      );
    } else {
      createMut.mutate(
        { name: editing.name, subject: editing.subject, body: editing.body },
        { onSuccess: () => setEditing(null) }
      );
    }
  }

  return (
    <SettingsSection id="email-templates">
      <SettingsSectionHeader
        action={
          <Button
            onClick={() => setEditing({ name: "", subject: "", body: "" })}
            size="sm"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            New Template
          </Button>
        }
        description={
          <>
            Reusable templates with merge tags:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              {"{{name}}"}
            </code>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              {"{{company}}"}
            </code>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              {"{{title}}"}
            </code>
          </>
        }
        title="Email Templates"
      />

      {isLoading && <SettingsSkeleton rows={2} />}

      {!isLoading && templates.length === 0 && (
        <SettingsEmptyState message="No email templates yet" />
      )}

      {!isLoading && templates.length > 0 && (
        <SettingsList>
          {(
            templates as Array<{
              id: string;
              name: string;
              subject: string;
              body: string;
              createdAt: Date;
            }>
          ).map((t) => (
            <SettingsCard key={t.id}>
              <SettingsCardBody>
                <div className="flex items-baseline gap-2">
                  <p className="font-medium text-[13px]">{t.name}</p>
                  <span className="text-[11px] text-muted-foreground/50">
                    {dayjs(t.createdAt).fromNow()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-muted-foreground text-xs">
                  {t.subject}
                </p>
              </SettingsCardBody>
              <SettingsCardActions>
                <Button
                  onClick={() =>
                    setEditing({
                      id: t.id,
                      name: t.name,
                      subject: t.subject,
                      body: t.body,
                    })
                  }
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                </Button>
                <Button
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setDeleteTemplateId(t.id)}
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
            </SettingsCard>
          ))}
        </SettingsList>
      )}

      <Dialog onOpenChange={(v) => !v && setEditing(null)} open={!!editing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit Template" : "New Template"}
            </DialogTitle>
            <DialogDescription>
              Use {"{{name}}"}, {"{{company}}"}, {"{{title}}"} as merge tags
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Template name"
                value={editing.name}
              />
              <Input
                onChange={(e) =>
                  setEditing({ ...editing, subject: e.target.value })
                }
                placeholder="Email subject"
                value={editing.subject}
              />
              <Textarea
                className="min-h-[120px]"
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
                placeholder="Email body..."
                value={editing.body}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setEditing(null)}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    !(editing.name.trim() && editing.subject.trim()) ||
                    createMut.isPending ||
                    updateMut.isPending
                  }
                  onClick={handleSave}
                  size="sm"
                >
                  {editing.id ? "Save Changes" : "Create Template"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        confirmLabel="Delete Template"
        description="This email template will be permanently deleted."
        icon={Delete02Icon}
        onConfirm={() => {
          if (deleteTemplateId) {
            deleteMut.mutate(deleteTemplateId);
          }
        }}
        onOpenChange={(v) => !v && setDeleteTemplateId(null)}
        open={!!deleteTemplateId}
        title="Delete this template?"
        variant="danger"
      />
    </SettingsSection>
  );
}
