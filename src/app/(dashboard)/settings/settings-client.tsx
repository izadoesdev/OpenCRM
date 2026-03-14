"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { UserAvatar } from "@/components/micro";
import { PageHeader } from "@/components/page-header";
import { EmptyState, PageSkeleton } from "@/components/page-skeleton";
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
  useArchivedLeads,
  useCreateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailTemplates,
  usePermanentlyDeleteLead,
  useRestoreLead,
  useUpdateEmailTemplate,
} from "@/lib/queries";

interface EditingTemplate {
  body: string;
  id?: string;
  name: string;
  subject: string;
}

export function SettingsClient() {
  const { data: templates = [], isLoading } = useEmailTemplates();
  const { data: archivedLeads = [], isLoading: archivedLoading } =
    useArchivedLeads();
  const createMut = useCreateEmailTemplate();
  const updateMut = useUpdateEmailTemplate();
  const deleteMut = useDeleteEmailTemplate();
  const restoreLead = useRestoreLead();
  const permanentlyDelete = usePermanentlyDeleteLead();
  const [editing, setEditing] = useState<EditingTemplate | null>(null);

  if (isLoading) {
    return <PageSkeleton header="Settings" />;
  }

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
    <div className="flex h-full flex-col">
      <PageHeader>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight">Settings</h1>
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Email Templates</h2>
            <Button
              onClick={() => setEditing({ name: "", subject: "", body: "" })}
              size="sm"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              New Template
            </Button>
          </div>
          <p className="mt-1 text-muted-foreground text-xs">
            Templates can use merge tags: {"{{name}}"}, {"{{company}}"},{" "}
            {"{{title}}"}
          </p>

          {templates.length === 0 && (
            <EmptyState className="mt-8" message="No email templates yet" />
          )}

          <div className="mt-4 space-y-2">
            {(
              templates as Array<{
                id: string;
                name: string;
                subject: string;
                body: string;
                createdAt: Date;
              }>
            ).map((t) => (
              <div
                className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30"
                key={t.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="mt-0.5 truncate text-muted-foreground text-xs">
                    Subject: {t.subject}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                    {t.body}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    Created {dayjs(t.createdAt).fromNow()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
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
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => deleteMut.mutate(t.id)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={14}
                      strokeWidth={1.5}
                    />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="font-medium text-sm">Archived Leads</h2>
            <p className="mt-1 text-muted-foreground text-xs">
              Restore or permanently delete archived leads
            </p>
            {archivedLoading && (
              <div className="mt-4 h-20 animate-pulse rounded-lg bg-muted/40" />
            )}
            {!archivedLoading && archivedLeads.length === 0 && (
              <EmptyState className="mt-8" message="No archived leads" />
            )}
            {!archivedLoading && archivedLeads.length > 0 && (
              <div className="mt-4 space-y-2">
                {archivedLeads.map((l) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30"
                    key={l.id}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <UserAvatar name={l.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{l.name}</p>
                        <p className="truncate text-muted-foreground text-xs">
                          {l.company ? `${l.company} · ${l.email}` : l.email}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                          Archived{" "}
                          {l.archivedAt ? dayjs(l.archivedAt).fromNow() : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        disabled={
                          restoreLead.isPending || permanentlyDelete.isPending
                        }
                        onClick={() => restoreLead.mutate(l.id)}
                        size="sm"
                        variant="outline"
                      >
                        <HugeiconsIcon
                          icon={ArrowLeft01Icon}
                          size={14}
                          strokeWidth={1.5}
                        />
                        Restore
                      </Button>
                      <Button
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={
                          restoreLead.isPending || permanentlyDelete.isPending
                        }
                        onClick={() => permanentlyDelete.mutate(l.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={14}
                          strokeWidth={1.5}
                        />
                        Delete Forever
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
