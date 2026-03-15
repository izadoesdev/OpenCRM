import { Search01Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={Search01Icon}
            size={24}
            strokeWidth={1.5}
          />
        </div>

        <div className="space-y-2">
          <p className="font-bold font-mono text-5xl text-muted-foreground">
            404
          </p>
          <h1 className="font-semibold text-xl tracking-tight">
            Page not found
          </h1>
          <p className="text-muted-foreground text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button render={<Link href="/" />}>
          <HugeiconsIcon icon={Target01Icon} size={16} strokeWidth={1.5} />
          Back to OpenCRM
        </Button>
      </div>
    </div>
  );
}
