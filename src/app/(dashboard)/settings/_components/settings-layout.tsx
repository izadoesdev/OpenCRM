"use client";

import { AnimatePresence, motion } from "motion/react";
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
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={cn("scroll-mt-8", className)}
      id={id}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.section>
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
      {action && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="shrink-0 pt-px"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          {action}
        </motion.div>
      )}
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
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30",
      onClick && "cursor-pointer",
      className
    )}
    initial={{ opacity: 0, y: 8 }}
    layout
    onClick={onClick}
    ref={ref}
    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
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
  return (
    <motion.div
      animate="visible"
      className="mt-5 space-y-2"
      initial="hidden"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function SettingsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="mt-5 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          animate={{ opacity: 1 }}
          className="h-[60px] animate-pulse rounded-lg bg-muted/40"
          initial={{ opacity: 0 }}
          key={`skeleton-${i.toString()}`}
          transition={{ delay: i * 0.05, duration: 0.3 }}
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
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
      onClick={() => onClick(sectionId)}
      type="button"
    >
      <AnimatePresence>
        {active && (
          <motion.span
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-md bg-muted"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            layoutId="settings-nav-indicator"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10">{label}</span>
    </button>
  );
}

export function SettingsEmptyState({ message }: { message: string }) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground"
      initial={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-[13px]">{message}</p>
    </motion.div>
  );
}
