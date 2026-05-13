"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ShipmentTrackingIcon, 
  Location01Icon, 
  Calendar01Icon, 
  MoreHorizontalIcon,
  ViewIcon,
  ArrowRight02Icon
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CreateTripSheet } from "@/components/sheets/CreateTripSheet";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

interface Trip {
  id: number;
  tripNumber: string;
  vessel?: {
    name: string;
    imo: string;
  };
  origin: string;
  destination: string;
  departureDate?: string;
  arrivalDate?: string;
  status: string;
}

export default function TripsPage() {
  const t = useTranslations("pages.trips");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: paginatedData, isLoading, error, refetch } = useQuery({
    queryKey: ["trips", page, pageSize, search],
    queryFn: async () => {
      const response = await axios.get(`/api/dashboard/trips?page=${page}&pageSize=${pageSize}&search=${search}`);
      return response.data;
    },
  });

  const trips = useMemo(() => paginatedData?.data || [], [paginatedData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "in_transit": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "arrived": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      {
        accessorKey: "tripNumber",
        header: t("colTrip"),
        cell: (info) => (
          <span className="font-semibold text-black tracking-tight">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "vessel.name",
        header: t("colVessel"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              <HugeiconsIcon icon={ShipmentTrackingIcon} size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-black text-xs leading-none mb-1">
                {row.original.vessel?.name || "—"}
              </span>
              <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
                IMO: {row.original.vessel?.imo || "—"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "origin",
        header: t("colOrigin"),
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <HugeiconsIcon icon={Location01Icon as any} size={12} className="text-gray-400" />
            {String(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "destination",
        header: t("colDestination"),
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <HugeiconsIcon icon={Location01Icon as any} size={12} className="text-gray-400" />
            {String(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "departureDate",
        header: t("colSchedule"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex items-center gap-1.5 text-gray-500">
              <HugeiconsIcon icon={Calendar01Icon} size={12} />
              {row.original.departureDate ? format(new Date(row.original.departureDate), "MMM d, yyyy") : "N/A"}
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <HugeiconsIcon icon={ArrowRight02Icon} size={12} />
              {row.original.arrivalDate ? format(new Date(row.original.arrivalDate), "MMM d, yyyy") : "TBD"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: (info) => {
          const status = String(info.getValue());
          return (
            <Badge variant="outline" className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[9px] tracking-wider border ${getStatusColor(status)}`}>
              {status.replace(/_/g, " ")}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg">
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <HugeiconsIcon icon={ViewIcon} size={14} />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                Annuler le voyage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t],
  );

  if (error) {
    return (
      <ErrorState 
        title="Erreur de chargement"
        description="Impossible de charger les voyages."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setSheetOpen(true)} className="gap-2 btn-shiny">
            <HugeiconsIcon icon={ShipmentTrackingIcon} size={18} strokeWidth={2} />
            {t("addButton")}
          </Button>
        }
      />

      {isLoading || trips.length > 0 || search ? (
        <DataTable
          columns={columns}
          data={trips}
          isLoading={isLoading}
          page={page}
          pageCount={paginatedData?.totalPages || 1}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          searchQuery={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder={t("searchPlaceholder")}
        />
      ) : (
        <EmptyState 
          title="Aucun voyage trouvé"
          description="Planifiez votre premier voyage pour commencer le suivi."
          icon={ShipmentTrackingIcon}
          action={
            <Button onClick={() => setSheetOpen(true)} className="gap-2">
              <HugeiconsIcon icon={ShipmentTrackingIcon} size={18} />
              {t("addButton")}
            </Button>
          }
        />
      )}

      <CreateTripSheet 
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
