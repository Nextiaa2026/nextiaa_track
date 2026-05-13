"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useShipmentLogs } from "@/hooks/useShipments";
import { DataTable } from "@/components/data-table";
import { getStatusColor, getStatusDisplay } from "@/lib/utils/shipment";
import { format } from "date-fns";
import {
  PackageIcon,
  Note01Icon,
  Location01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { PageHeader } from "@/components/page-header";
import { useTranslations } from "next-intl";
import { ShipmentLog } from "@/services/shipment.service";

export default function LogsPage() {
  const t = useTranslations("pages.logs");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data: paginatedData, isLoading } = useShipmentLogs(
    page,
    pageSize,
    undefined,
    startDate,
    endDate,
    undefined,
    searchQuery,
  );

  const logs = useMemo(() => paginatedData?.data || [], [paginatedData]);

  const columns = useMemo<ColumnDef<ShipmentLog>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: t("colExecutionTime"),
        cell: (info) => (
          <div className="flex flex-col">
             <div className="flex items-center gap-2 text-black font-medium leading-none mb-1">
                <HugeiconsIcon icon={Clock01Icon} size={14} className="text-gray-400" />
                {format(new Date(String(info.getValue())), "HH:mm:ss")}
             </div>
             <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
                {format(new Date(String(info.getValue())), "MMM d, yyyy")}
             </span>
          </div>
        ),
      },
      {
        accessorKey: "shipment.trackingNumber",
        header: t("colContext"),
        cell: ({ row }) => (
          <div className="flex flex-col">
             <div className="flex items-center gap-2 font-medium text-black leading-none mb-1">
                <HugeiconsIcon icon={PackageIcon} size={14} className="text-black" />
                {row.original.shipment?.trackingNumber || `#${row.original.shipmentId}`}
             </div>
             <span className="text-[10px] text-gray-400 font-normal truncate max-w-[120px] uppercase tracking-wider">
                {row.original.shipment?.itemName || "General Cargo"}
             </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("colEventType"),
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
        accessorKey: "location",
        header: t("colCheckpoint"),
        cell: (info) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-black font-medium leading-none mb-1">
              <HugeiconsIcon icon={Location01Icon} size={14} className="text-gray-400" />
              {String(info.getValue())}
            </div>
            {info.row.original.address && (
                <span className="text-[10px] text-gray-400 font-normal truncate max-w-[150px]">
                    {info.row.original.address}
                </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "message",
        header: t("colNarrative"),
        cell: (info) => (
          <div className="flex items-start gap-2">
             <HugeiconsIcon icon={Note01Icon} size={14} className="text-gray-300 mt-0.5 shrink-0" />
             <span className="text-gray-600 font-normal text-xs leading-relaxed max-w-[250px]">
                {String(info.getValue())}
             </span>
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        page={page}
        pageCount={paginatedData?.totalPages || 1}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        searchPlaceholder={t("searchPlaceholder")}
        filters={
          <DateRangeFilter
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />
        }
      />
    </div>
  );
}
