"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "info";

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { media: string; actionVariant: "destructive" | "default" }
> = {
  danger: {
    media: "bg-red-500/10 text-red-600",
    actionVariant: "destructive",
  },
  warning: {
    media: "bg-amber-500/10 text-amber-600",
    actionVariant: "default",
  },
  info: {
    media: "bg-blue-500/10 text-blue-600",
    actionVariant: "default",
  },
};

interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  description?: string;
  icon?: Parameters<typeof HugeiconsIcon>[0]["icon"];
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  variant?: ConfirmVariant;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const style = VARIANT_STYLES[variant];
  const [pending, setPending] = useState(false);
  const isLoading = loading || pending;

  const handleConfirm = useCallback(async () => {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }, [onConfirm, onOpenChange]);

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {icon && (
            <AlertDialogMedia className={cn(style.media)}>
              <HugeiconsIcon icon={icon} size={20} strokeWidth={1.5} />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            variant={style.actionVariant}
          >
            {isLoading ? "..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook returning `{ trigger, dialog }`.
 * Call `trigger()` to open, render `dialog` in your JSX.
 */
export function useConfirmDialog(
  props: Omit<ConfirmDialogProps, "open" | "onOpenChange">
) {
  const [open, setOpen] = useState(false);

  const trigger = useCallback(() => setOpen(true), []);

  const dialog = (
    <ConfirmDialog {...props} onOpenChange={setOpen} open={open} />
  );

  return { trigger, dialog, open, setOpen };
}
