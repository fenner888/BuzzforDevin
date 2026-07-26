import * as React from "react";
import { TerminalSquare } from "lucide-react";

import type { AcpRuntimeCatalogEntry } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";

export function getRuntimeDisplayLabel(
  runtime: AcpRuntimeCatalogEntry,
): string {
  return runtime.displayLabel;
}

export function RuntimeIcon({
  className = "h-8 w-8",
  runtime,
}: {
  className?: string;
  runtime: AcpRuntimeCatalogEntry;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const imageUrl = runtime.iconUrl || runtime.avatarUrl;

  if (imageUrl && !imageFailed) {
    return (
      <img
        alt=""
        className={cn("rounded-md object-contain", className)}
        onError={() => setImageFailed(true)}
        src={imageUrl}
        style={{ transform: `scale(${runtime.iconScale})` }}
      />
    );
  }

  return (
    <TerminalSquare
      className={cn(className, "text-foreground")}
      strokeWidth={1.25}
    />
  );
}
