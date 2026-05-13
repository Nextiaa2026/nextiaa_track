"use client";

import { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";
import { Customer } from "@/services/customer.service";
import { CreateCustomerSheet } from "@/components/sheets/CreateCustomerSheet";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import {
  UserIcon,
  Mail01Icon,
  CallIcon,
  Location01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageHeader } from "@/components/page-header";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslations } from "next-intl";

export default function CustomersPage() {
  const t = useTranslations("pages.customers");
  const tc = useTranslations("forms.common");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const {
    data: paginatedData,
    isLoading,
    error,
  } = useCustomers(page, pageSize, startDate, endDate, debouncedSearch);
  const { mutate: deleteCustomer } = useDeleteCustomer();

  const handleDelete = useCallback(
    (id: number) => {
      if (confirm(t("deleteConfirm"))) {
        deleteCustomer(id, {
          onSuccess: () => toast.success(t("deleted")),
          onError: () => toast.error(t("deleteFailed")),
        });
      }
    },
    [deleteCustomer, t],
  );

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("colName"),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-black shrink-0 shadow-sm">
              <HugeiconsIcon icon={UserIcon} size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-black leading-tight">
                {String(info.getValue())}
              </span>
              <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
                {t("activeAccount")}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: t("colEmail"),
        cell: (info) => (
          <div className="flex items-center gap-2 text-gray-600 font-normal">
            <HugeiconsIcon
              icon={Mail01Icon}
              size={14}
              className="text-gray-400"
            />
            {String(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: t("colPhone"),
        cell: (info) => (
          <div className="flex items-center gap-2 text-gray-600 font-normal">
            <HugeiconsIcon
              icon={CallIcon}
              size={14}
              className="text-gray-400"
            />
            {String(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: t("colAddress"),
        cell: (info) => (
          <div className="flex items-center gap-2 text-gray-600 truncate max-w-[150px]">
            <HugeiconsIcon
              icon={Location01Icon}
              size={14}
              className="text-gray-400"
            />
            {String(info.getValue())}
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: t("colLocation"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-black font-medium leading-tight capitalize">
              {row.original.city}, {row.original.state}
            </span>
            <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">
              {row.original.country} ({row.original.zipCode})
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("colJoined"),
        cell: (info) => (
          <div className="flex items-center gap-2 text-gray-500 font-normal">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={14}
              className="text-gray-400"
            />
            {format(new Date(String(info.getValue())), "MMM d, yyyy")}
          </div>
        ),
      },
      {
        id: "actions",
        header: t("actions"),
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-gray-50 rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(customer.email)}
                >
                  {t("copyEmail")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(customer.phone)}
                >
                  {t("copyPhone")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{t("viewDetails")}</DropdownMenuItem>
                <DropdownMenuItem>{t("editCustomer")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 font-medium"
                  onClick={() => handleDelete(customer.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t("deleteProfile")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleDelete, t],
  );

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-2xl border border-red-100 text-red-700">
        <h2 className="font-bold text-xl tracking-tight">
          {t("loadErrorTitle")}
        </h2>
        <p className="mt-2 font-medium opacity-70">
          {t("loadErrorDesc")}
        </p>
        <Button
          variant="outline"
          className="mt-6 font-bold rounded-lg"
          onClick={() => window.location.reload()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <DataTable
        columns={columns}
        data={paginatedData?.data || []}
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

      <CreateCustomerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={() => setPage(1)}
      />
    </div>
  );
}
