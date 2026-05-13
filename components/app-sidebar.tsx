"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutBottomIcon,
  PackageIcon,
  UserIcon,
  ComputerTerminalIcon,
  MapsIcon,
  CargoShipIcon,
  Invoice01Icon,
  ZapIcon,
  RouteIcon,
  Settings01Icon
} from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useAuth";
import { Logo } from "@/components/logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("sidebar");
  const { data: user } = useCurrentUser();
  
  const isAdmin = user?.role === "admin" || user?.role === "staff";
  const isVesselOwner = user?.role === "customer" || isAdmin; // Assuming customers can own vessels now

  const navMain = [
    {
      title: t("overview"),
      url: "/dashboard",
      icon: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
    },
    {
      title: t("shipments"),
      url: "/dashboard/shipments",
      icon: <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />,
    },
    {
      title: t("customers"),
      url: "/dashboard/customers",
      icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
    },
    {
      title: t("invoices"),
      url: "/dashboard/invoices",
      icon: <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />,
    },
    ...(isVesselOwner ? [
      {
        title: t("vessels"),
        url: "/dashboard/vessels",
        icon: <HugeiconsIcon icon={CargoShipIcon} strokeWidth={2} />,
      },
      {
        title: t("trips"),
        url: "/dashboard/trips",
        icon: <HugeiconsIcon icon={RouteIcon} strokeWidth={2} />,
      },
    ] : []),
    {
      title: "Subscriptions",
      url: "/dashboard/subscriptions",
      icon: <HugeiconsIcon icon={ZapIcon} strokeWidth={2} />,
    },
    ...(isAdmin ? [
      {
        title: t("activityLogs"),
        url: "/dashboard/logs",
        icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
      },
      {
        title: t("users"),
        url: "/dashboard/users",
        icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
      },
    ] : []),
    {
      title: t("liveTracking"),
      url: "/track",
      icon: <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />,
    },
    {
      title: t("settings"),
      url: "/dashboard/settings",
      icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
          <Logo showText={true} className="group-data-[collapsible=icon]:hidden" />
          <Logo showText={false} className="hidden group-data-[collapsible=icon]:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
