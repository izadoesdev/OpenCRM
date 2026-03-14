"use client";

import {
  Add01Icon,
  Cancel01Icon,
  Copy01Icon,
  Key01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import dayjs from "@/lib/dayjs";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useRevokeApiKey,
} from "@/lib/queries";
import {
  SettingsCard,
  SettingsCardActions,
  SettingsCardBody,
  SettingsCardIcon,
  SettingsEmptyState,
  SettingsList,
  SettingsSection,
  SettingsSectionHeader,
  SettingsSkeleton,
} from "../_components/settings-layout";

export function ApiKeysSection() {
  const { data: apiKeys = [], isLoading } = useApiKeys();
  const createKeyMut = useCreateApiKey();
  const revokeKeyMut = useRevokeApiKey();
  const deleteKeyMut = useDeleteApiKey();
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateKey = useCallback(() => {
    if (!newKeyName.trim()) {
      return;
    }
    createKeyMut.mutate(newKeyName.trim(), {
      onSuccess: (result) => {
        setRevealedKey(result.plainKey);
        setNewKeyName("");
        setShowNewKeyDialog(false);
      },
    });
  }, [newKeyName, createKeyMut]);

  const handleCopyKey = useCallback(() => {
    if (!revealedKey) {
      return;
    }
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [revealedKey]);

  return (
    <SettingsSection id="api-keys">
      <SettingsSectionHeader
        action={
          <Button onClick={() => setShowNewKeyDialog(true)} size="sm">
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
            New Key
          </Button>
        }
        description={
          <>
            Create keys to send leads via{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              POST /api/v1/leads
            </code>
          </>
        }
        title="API Keys"
      />

      {revealedKey && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <p className="font-medium text-[13px] text-amber-800">
            Copy this key now — it won't be shown again
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 select-all break-all rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-xs">
              {revealedKey}
            </code>
            <Button onClick={handleCopyKey} size="icon-sm" variant="outline">
              <HugeiconsIcon
                icon={copied ? Tick01Icon : Copy01Icon}
                size={14}
                strokeWidth={1.5}
              />
            </Button>
          </div>
          <Button
            className="mt-3 text-amber-700"
            onClick={() => setRevealedKey(null)}
            size="sm"
            variant="ghost"
          >
            Dismiss
          </Button>
        </div>
      )}

      {isLoading && <SettingsSkeleton />}

      {!isLoading && apiKeys.length === 0 && !revealedKey && (
        <SettingsEmptyState message="No API keys yet" />
      )}

      {!isLoading && apiKeys.length > 0 && (
        <SettingsList>
          {apiKeys.map((k) => (
            <SettingsCard key={k.id}>
              <SettingsCardIcon>
                <HugeiconsIcon
                  className="text-muted-foreground"
                  icon={Key01Icon}
                  size={16}
                  strokeWidth={1.5}
                />
              </SettingsCardIcon>
              <SettingsCardBody>
                <div className="flex items-baseline gap-2">
                  <p className="font-medium text-[13px]">{k.name}</p>
                  <span className="font-mono text-[11px] text-muted-foreground/50">
                    {k.prefix}••••
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Created {dayjs(k.createdAt).fromNow()}
                  {k.lastUsedAt && (
                    <span className="text-muted-foreground/50">
                      {" · "}Last used {dayjs(k.lastUsedAt).fromNow()}
                    </span>
                  )}
                </p>
              </SettingsCardBody>
              <SettingsCardActions>
                <Button
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={revokeKeyMut.isPending || deleteKeyMut.isPending}
                  onClick={() => revokeKeyMut.mutate(k.id)}
                  size="sm"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={14}
                    strokeWidth={1.5}
                  />
                  Revoke
                </Button>
              </SettingsCardActions>
            </SettingsCard>
          ))}
        </SettingsList>
      )}

      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setShowNewKeyDialog(false);
            setNewKeyName("");
          }
        }}
        open={showNewKeyDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give this key a descriptive name so you remember what it's for
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
              placeholder='e.g. "Website Contact Form"'
              value={newKeyName}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowNewKeyDialog(false);
                  setNewKeyName("");
                }}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                disabled={!newKeyName.trim() || createKeyMut.isPending}
                onClick={handleCreateKey}
                size="sm"
              >
                Create Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
