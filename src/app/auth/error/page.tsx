"use client";

import { ShieldBanIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, { title: string; description: string }> = {
  unable_to_create_user: {
    title: "Access denied",
    description:
      "Only @databuddy.cc accounts can access DataCRM. Sign in with your Databuddy Google account.",
  },
  please_restart_the_process: {
    title: "Session expired",
    description: "The sign-in process timed out. Please try again.",
  },
  user_banned: {
    title: "Account suspended",
    description: "Your account has been suspended. Contact your administrator.",
  },
};

const defaultError = {
  title: "Authentication error",
  description: "Something went wrong during sign-in. Please try again.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "";
  const { title, description } = errorMessages[errorCode] ?? defaultError;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-sm bg-destructive/15">
          <HugeiconsIcon
            className="text-destructive"
            icon={ShieldBanIcon}
            size={24}
            strokeWidth={1.5}
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
          {errorCode && (
            <p className="font-mono text-muted-foreground/50 text-xs">
              {errorCode}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button render={<Link href="/sign-in" />}>Try again</Button>
          <Button render={<Link href="/" />} variant="ghost">
            <HugeiconsIcon icon={Target01Icon} size={16} strokeWidth={1.5} />
            Back to DataCRM
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-background">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
