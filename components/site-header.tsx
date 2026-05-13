"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  shipments: "Shipments",
  customers: "Customers",
  reports: "Reports",
  settings: "Settings",
  help: "Help Center",
};

export function SiteHeader() {
  const pathname = usePathname();

  // Build breadcrumb segments from pathname
  // e.g. /dashboard/shipments/123 → ["dashboard","shipments","123"]
  const segments = pathname
    .split("/")
    .filter(Boolean);

  // Build cumulative paths: dashboard → /dashboard, shipments → /dashboard/shipments
  const crumbs = segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-gray-100 bg-white/80 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4 bg-gray-200"
        />
        <nav className="flex items-center gap-1 text-sm">
          {crumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {!crumb.isLast ? (
                <>
                  <Link
                    href={crumb.href}
                    className="text-gray-400 hover:text-gray-700 transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="size-3.5 text-gray-300" />
                </>
              ) : (
                <span className="font-bold text-gray-900">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
