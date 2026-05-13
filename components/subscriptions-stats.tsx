"use client";

import { useSubscriptionStats } from "@/hooks/useSubscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, Time02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function SubscriptionsStats() {
  const { data: stats, isLoading } = useSubscriptionStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-gray-100 shadow-none">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Crédits",
      value: stats?.balance ?? 0,
      icon: ZapIcon,
      color: "text-amber-500",
      bg: "bg-amber-50",
      description: "Balance actuelle",
    },
    {
      label: "Plan",
      value: stats?.planName ?? "Gratuit",
      icon: ArrowUp02Icon,
      color: "text-blue-500",
      bg: "bg-blue-50",
      description: stats?.status === "active" ? "Actif" : "Aucun",
    },
    {
      label: "Renouvellement",
      value: stats?.nextRefresh
        ? format(new Date(stats.nextRefresh), "dd/MM/yyyy")
        : "N/A",
      icon: Time02Icon,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      description: "Auto-recharge",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.label}
          className="border border-gray-100 shadow-none hover:border-primary/20 transition-all duration-300"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={`p-2.5 rounded-xl ${item.bg} ${item.color} shrink-0`}
            >
              <HugeiconsIcon icon={item.icon} size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                {item.label}
              </p>
              <h3 className="text-lg font-semibold tracking-tight leading-none mb-1">
                {item.value}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                {item.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
