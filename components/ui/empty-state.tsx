"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Aucune donnée trouvée",
  description = "Il n'y a rien à afficher pour le moment.",
  icon = PackageIcon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/60 mb-6 border border-muted/50 shadow-inner">
        <HugeiconsIcon icon={icon} size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}
