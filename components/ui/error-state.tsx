"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Nous n'avons pas pu charger les données. Veuillez réessayer.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/5 text-destructive mb-4 border border-destructive/10">
        <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
      </div>
      <h3 className="text-lg font-semibold mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 h-9 text-xs font-semibold uppercase tracking-wider">
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          Réessayer
        </Button>
      )}
    </div>
  );
}
