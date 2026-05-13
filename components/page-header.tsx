import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Primary actions (e.g. CTA) — rendered on the right on `sm+`. */
  actions?: ReactNode;
  className?: string;
};

/** Matches the Customers page title + subtitle pattern across the dashboard. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-none text-gray-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm font-normal text-gray-500">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
