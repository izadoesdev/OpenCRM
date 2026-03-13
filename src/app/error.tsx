"use client";

import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-sm bg-destructive/15">
          <HugeiconsIcon
            className="text-destructive"
            icon={Alert01Icon}
            size={24}
            strokeWidth={1.5}
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-xl tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button render={<Link href="/" />} variant="ghost">
            Back to OpenCRM
          </Button>
        </div>
      </div>
    </div>
  );
}
