"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useShipments, useUpdateShipment, useAddShipmentLog } from "@/hooks/useShipments";
import { Shipment } from "@/services/shipment.service";
import { CreateShipmentSheet } from "@/components/sheets/CreateShipmentSheet";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getStatusColor, getStatusDisplay } from "@/lib/utils/shipment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  ViewIcon,
  Note01Icon,
  PackageIcon,
  Calendar01Icon,
  WeightIcon,
  Location01Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDebounce } from "@/hooks/use-debounce";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function ShipmentsPage() {
  const t = useTranslations("pages.shipments");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const { mutate: updateShipment } = useUpdateShipment();
  const { mutate: addLog } = useAddShipmentLog();

  const handleStatusUpdate = useCallback(
    (shipmentId: number, newStatus: string) => {
      const status = newStatus as
        | "pending"
        | "in_transit"
        | "delivered"
        | "failed";
      updateShipment(
        { id: shipmentId, data: { status } },
        {
          onSuccess: () => {
            addLog({
              shipmentId,
              status,
              message: `${t("statusLogUpdated")}${getStatusDisplay(newStatus)}`,
            });
          },
        },
      );
    },
    [updateShipment, addLog, t],
  );

  const {
    data: paginatedData,
    isLoading,
    error,
  } = useShipments(page, pageSize, debouncedSearch, startDate, endDate);

  const shipments = useMemo(() => paginatedData?.data || [], [paginatedData]);

  const columns = useMemo<ColumnDef<Shipment>[]>(
    () => [
      {
        accessorKey: "trackingNumber",
        header: t("colTracking"),
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-black tracking-tight leading-none mb-1">
              {String(info.getValue())}
            </span>
            <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
              {t("standardFreight")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "vesselName",
        header: t("colVessel"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-black leading-tight">
              {row.original.vesselName || "—"}
            </span>
            {row.original.vesselImo && (
              <span className="text-[10px] text-gray-400 font-normal">
                IMO: {row.original.vesselImo}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "shipmentType",
        header: t("colShipmentType"),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gray-600 font-medium">
            {row.original.shipmentType || "international"}
          </span>
        ),
      },
      {
        accessorKey: "itemName",
        header: t("colContent"),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-black shrink-0 shadow-sm">
              <HugeiconsIcon icon={PackageIcon} size={16} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-black font-medium leading-tight truncate max-w-[150px]">
                {String(info.getValue())}
              </span>
              <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1">
                <HugeiconsIcon icon={WeightIcon} size={10} />
                {String(info.row.original.itemWeight)} {t("weightKg")}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "sender.name",
        header: t("colOrigin"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-black font-medium leading-tight">
              {row.original.sender.name}
            </span>
            <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1 uppercase tracking-wider">
              <HugeiconsIcon icon={Location01Icon} size={10} />
              {row.original.sender.city}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "receiver.name",
        header: t("colDestination"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-black font-medium leading-tight">
              {row.original.receiver.name}
            </span>
            <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1 uppercase tracking-wider">
              <HugeiconsIcon icon={Location01Icon} size={10} />
              {row.original.receiver.city}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: (info) => {
          const status = String(info.getValue());
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest border ${getStatusColor(
                status,
              )}`}
            >
              {getStatusDisplay(status)}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("colLoggedDate"),
        cell: (info) => (
          <div className="flex items-center gap-2 text-gray-500 font-normal">
             <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-gray-400" />
             {format(new Date(String(info.getValue())), "MMM d, yyyy")}
          </div>
        ),
      },
      {
        id: "actions",
        header: t("colActions"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg">
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{t("menuControls")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-normal"
                onClick={() =>
                  router.push(`/dashboard/shipments/${row.original.id}`)
                }
              >
                <HugeiconsIcon icon={ViewIcon} size={14} className="mr-2 text-black" />
                {t("detailedView")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="font-normal"
                onClick={() =>
                  router.push(
                    `/dashboard/shipments/${row.original.id}?tab=logs`,
                  )
                }
              >
                <HugeiconsIcon icon={Note01Icon} size={14} className="mr-2 text-black" />
                {t("activityTimeline")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="font-normal">
                  <HugeiconsIcon icon={CircleIcon} size={14} className="mr-2 text-black" />
                  {t("updateStatus")}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-40">
                    {[
                      { value: "pending", label: "En attente" },
                      { value: "in_transit", label: "En transit" },
                      { value: "delivered", label: "Livré" },
                      { value: "failed", label: "Échoué" },
                    ].map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => handleStatusUpdate(row.original.id, s.value)}
                        className={row.original.status === s.value ? "bg-gray-50 text-black font-semibold" : ""}
                      >
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 font-medium">
                {t("abortShipment")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, handleStatusUpdate, t],
  );

  if (error) {
    return (
      <ErrorState 
        title={t("syncErrorTitle")}
        description={t("syncErrorDesc")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {isLoading || shipments.length > 0 || searchTerm || startDate || endDate ? (
        <DataTable
          columns={columns}
          data={shipments}
          isLoading={isLoading}
          page={page}
          pageCount={paginatedData?.totalPages || 1}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          searchQuery={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          searchPlaceholder={t("searchPlaceholder")}
          actions={
            <Button
              onClick={() => setSheetOpen(true)}
              className="h-10 rounded-lg px-4 font-medium"
            >
              {t("addButton")}
            </Button>
          }
          filters={
            <DateRangeFilter
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
            />
          }
        />
      ) : (
        <EmptyState 
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button onClick={() => setSheetOpen(true)} className="gap-2">
              <HugeiconsIcon icon={PackageIcon as any} size={18} />
              {t("addButton")}
            </Button>
          }
        />
      )}

      <CreateShipmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => {
          setPage(1);
        }}
      />
    </div>
  );
}
