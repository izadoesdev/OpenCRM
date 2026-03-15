import { motion } from "motion/react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />
  );
}

export function PageSkeleton({ header }: { header?: string }) {
  return (
    <div className="flex h-full flex-col">
      {header && (
        <PageHeader>
          <h1 className="font-semibold text-lg tracking-tight">{header}</h1>
        </PageHeader>
      )}
      <div className="flex-1 p-5">
        <div className="space-y-4">
          <Bone className="h-5 w-48" />
          <div className="space-y-2.5">
            <Bone className="h-10 w-full" />
            <Bone className="h-10 w-full" />
            <Bone className="h-10 w-full" />
            <Bone className="h-10 w-3/4" />
          </div>
          <Bone className="mt-6 h-5 w-36" />
          <div className="space-y-2.5">
            <Bone className="h-10 w-full" />
            <Bone className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  message,
  className,
}: {
  icon?: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 text-muted-foreground",
        className
      )}
      initial={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
    >
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm">{message}</p>
    </motion.div>
  );
}
