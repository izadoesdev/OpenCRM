import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { cn, getInitials } from "@/lib/utils";

export function SectionHeader({
  children,
  count,
  className,
  divider,
}: {
  children: React.ReactNode;
  count?: number;
  className?: string;
  divider?: boolean;
}) {
  return (
    <h3
      className={cn(
        "mb-1.5 flex items-center gap-2 font-medium text-[10px] uppercase tracking-widest",
        className ?? "text-muted-foreground"
      )}
    >
      {children}
      {count !== undefined && <span className="font-mono">{count}</span>}
      {divider && <span className="h-px flex-1 bg-border" />}
    </h3>
  );
}

const PILL_VARIANTS = {
  muted: "bg-muted text-muted-foreground",
  danger: "bg-red-500/15 text-red-400",
  success: "bg-emerald-500/15 text-emerald-400",
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet-500/15 text-violet-400",
} as const;

export function Pill({
  variant = "muted",
  children,
  className,
}: {
  variant?: keyof typeof PILL_VARIANTS;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-sm px-1.5 py-0.5 font-mono text-[10px]",
        PILL_VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const AVATAR_SIZES = {
  xs: { avatar: "size-4", text: "text-[6px]" },
  sm: { avatar: "size-5", text: "text-[7px]" },
  md: { avatar: "size-7", text: "text-[9px]" },
  lg: { avatar: "size-8", text: "text-xs" },
  xl: { avatar: "size-11", text: "text-base" },
} as const;

export function UserAvatar({
  name,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  const s = AVATAR_SIZES[size];
  return (
    <Avatar className={cn(s.avatar, className)}>
      <AvatarFallback className={cn("bg-muted text-muted-foreground", s.text)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function IconSelect({
  icon,
  value,
  onValueChange,
  displayValue,
  children,
  className,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  value: string;
  onValueChange: (v: string) => void;
  displayValue: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Select onValueChange={(v) => v && onValueChange(v)} value={value}>
      <SelectTrigger className={cn("w-full text-xs", className)}>
        <HugeiconsIcon
          className="mr-1 shrink-0 text-muted-foreground"
          icon={icon}
          size={12}
          strokeWidth={1.5}
        />
        <span className="flex-1 truncate text-left">{displayValue}</span>
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0 text-muted-foreground text-xs">
        {label}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}
