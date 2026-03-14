"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsSection({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("scroll-mt-8", className)} id={id}>
      {children}
    </section>
  );
}

export function SettingsSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 space-y-1">
        <h2 className="font-semibold text-sm tracking-tight">{title}</h2>
        {description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-px">{action}</div>}
    </div>
  );
}

export function SettingsDivider() {
  return <div className="border-t" />;
}

export const SettingsCard = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
  }
>(({ children, className, onClick }, ref) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30",
      onClick && "cursor-pointer",
      className
    )}
    onClick={onClick}
    ref={ref}
  >
    {children}
  </div>
));
SettingsCard.displayName = "SettingsCard";

export function SettingsCardIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsCardBody({ children }: { children: ReactNode }) {
  return <div className="min-w-0 flex-1">{children}</div>;
}

export function SettingsCardActions({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 items-center gap-1">{children}</div>;
}

export function SettingsList({ children }: { children: ReactNode }) {
  return <div className="mt-5 space-y-2">{children}</div>;
}

export function SettingsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="mt-5 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          className="h-[60px] animate-pulse rounded-lg bg-muted/40"
          key={`skeleton-${i.toString()}`}
        />
      ))}
    </div>
  );
}

export function SettingsNavItem({
  label,
  sectionId,
  active,
  onClick,
}: {
  label: string;
  sectionId: string;
  active: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      className={cn(
        "relative w-full rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
      onClick={() => onClick(sectionId)}
      type="button"
    >
      {label}
    </button>
  );
}

export function SettingsEmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
      <p className="text-[13px]">{message}</p>
    </div>
  );
}
